const db = require("../config/db");
const { sendTripAssignedEmail } = require("../services/notificationService");

const allowedTripStatuses = new Set([
  "planned",
  "ready",
  "in_progress",
  "completed",
  "cancelled",
]);

const tripSelectColumns = `
  t.trip_id,
  t.route_id,
  r.origin_id,
  origin.city_name AS origin_city,
  r.dest_id,
  destination.city_name AS destination_city,
  r.distance_km,
  r.distance_km AS distance,
  r.estimated_time,
  t.vd_id,
  vd.vehicle_id,
  v.vehicle_type,
  v.plate_number,
  vd.driver_id,
  u.full_name AS driver_name,
  d.license_number,
  t.trip_date,
  t.departure_datetime,
  t.arrival_datetime,
  t.capacity,
  t.booked_seats,
  t.trip_status,
  t.notes,
  t.created_at,
  t.updated_at,
  (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.trip_id = t.trip_id
  ) AS booking_count
`;

const normalizeTripInput = (body) => ({
  route_id:
    body.route_id === undefined || body.route_id === null || body.route_id === ""
      ? null
      : Number(body.route_id),
  vd_id:
    body.vd_id === undefined || body.vd_id === null || body.vd_id === ""
      ? null
      : Number(body.vd_id),
  trip_date: body.trip_date,
  departure_datetime: body.departure_datetime,
  capacity:
    body.capacity === undefined
      ? undefined
      : body.capacity === null || body.capacity === ""
        ? null
      : Number(body.capacity),
  trip_status: body.trip_status,
  arrival_datetime:
    body.arrival_datetime === undefined
      ? undefined
      : body.arrival_datetime === null || body.arrival_datetime === ""
        ? null
        : body.arrival_datetime,
  notes:
    body.notes === undefined ? undefined : body.notes === null || body.notes.trim() === "" ? null : body.notes.trim(),
  booking_ids: Array.isArray(body.booking_ids)
    ? body.booking_ids
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [],
});

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
const toTimestamp = (value) => new Date(value).getTime();

const selectTripByIdQuery = `
  SELECT ${tripSelectColumns}
  FROM trips t
  JOIN routes r ON r.route_id = t.route_id
  JOIN cities origin ON origin.city_id = r.origin_id
  JOIN cities destination ON destination.city_id = r.dest_id
  JOIN vehicle_driver vd ON vd.vd_id = t.vd_id
  JOIN vehicles v ON v.vehicle_id = vd.vehicle_id
  JOIN drivers d ON d.driver_id = vd.driver_id
  JOIN users u ON u.user_id = d.user_id
  WHERE t.trip_id = ?
`;

const validateTripStatus = (status) => {
  if (!allowedTripStatuses.has(status)) {
    return "trip_status must be one of: planned, ready, in_progress, completed, cancelled";
  }

  return null;
};

const getTripValidationMessage = (trip) => {
  const tripTimestamp = toTimestamp(trip.trip_date);
  const departureTimestamp = toTimestamp(trip.departure_datetime);
  const arrivalTimestamp = trip.arrival_datetime ? toTimestamp(trip.arrival_datetime) : null;

  if (
    !isPositiveInteger(trip.route_id) ||
    !isPositiveInteger(trip.vd_id) ||
    !trip.trip_date ||
    !trip.departure_datetime ||
    !isPositiveInteger(trip.capacity)
  ) {
    return "route_id, vd_id, trip_date, departure_datetime, and capacity are required";
  }

  if (Number.isNaN(tripTimestamp) || Number.isNaN(departureTimestamp)) {
    return "trip_date and departure_datetime must be valid dates";
  }

  if (trip.arrival_datetime && Number.isNaN(arrivalTimestamp)) {
    return "arrival_datetime must be a valid date";
  }

  if (trip.arrival_datetime && arrivalTimestamp < departureTimestamp) {
    return "arrival_datetime cannot be earlier than departure_datetime";
  }

  const statusError = validateTripStatus(trip.trip_status);
  if (statusError) {
    return statusError;
  }

  if (!Array.isArray(trip.booking_ids) || trip.booking_ids.length === 0) {
    return "At least one booking must be selected for a trip";
  }

  return null;
};

const selectTripById = (tripId, callback) => {
  db.query(selectTripByIdQuery, [tripId], callback);
};

const withTransaction = (res, work) => {
  db.beginTransaction((beginErr) => {
    if (beginErr) return res.status(500).json(beginErr);

    const rollback = (error) => {
      db.rollback(() => {
        if (error?.statusCode) {
          res.status(error.statusCode).json({ message: error.message });
        } else {
          res.status(500).json(error);
        }
      });
    };

    const commit = (onSuccess) => {
      db.commit((commitErr) => {
        if (commitErr) {
          rollback(commitErr);
          return;
        }

        onSuccess();
      });
    };

    work({ rollback, commit });
  });
};

const queryAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  });

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getSelectedBookingsQuery = (bookingIds) => `
  SELECT booking_id, route_id, trip_id, seat_count, booking_status
  FROM bookings
  WHERE booking_id IN (${bookingIds.map(() => "?").join(", ")})
`;

const verifyTripReferences = async (routeId, assignmentId, tripDate) => {
  const routes = await queryAsync("SELECT route_id FROM routes WHERE route_id = ?", [routeId]);
  if (routes.length === 0) {
    throw createHttpError(400, "route_id must refer to an existing route");
  }

  const assignments = await queryAsync(
    "SELECT vd_id, start_date, end_date FROM vehicle_driver WHERE vd_id = ?",
    [assignmentId]
  );

  if (assignments.length === 0) {
    throw createHttpError(400, "vd_id must refer to an existing vehicle assignment");
  }

  const assignment = assignments[0];
  const tripTimestamp = toTimestamp(tripDate);
  const startTimestamp = toTimestamp(assignment.start_date);
  const endTimestamp = assignment.end_date ? toTimestamp(assignment.end_date) : null;

  if (tripTimestamp < startTimestamp || (endTimestamp && tripTimestamp > endTimestamp)) {
    throw createHttpError(
      400,
      "trip_date must fall within the selected vehicle assignment date range"
    );
  }
};

const prepareTripBookings = async (bookingIds, routeId, currentTripId = null) => {
  const uniqueBookingIds = [...new Set(bookingIds)];
  const selectedBookings = await queryAsync(getSelectedBookingsQuery(uniqueBookingIds), uniqueBookingIds);

  if (selectedBookings.length !== uniqueBookingIds.length) {
    throw createHttpError(400, "One or more selected bookings do not exist");
  }

  for (const booking of selectedBookings) {
    if (Number(booking.route_id) !== Number(routeId)) {
      throw createHttpError(400, "All selected bookings must belong to the same route");
    }

    const isAssignedToCurrentTrip = currentTripId && Number(booking.trip_id) === Number(currentTripId);
    if (!isAssignedToCurrentTrip && booking.booking_status !== "pending") {
      throw createHttpError(400, "Only pending bookings can be assigned to a new trip");
    }

    if (!isAssignedToCurrentTrip && booking.trip_id != null) {
      throw createHttpError(400, "A selected booking is already assigned to another trip");
    }
  }

  const bookedSeats = selectedBookings.reduce((sum, booking) => sum + Number(booking.seat_count || 0), 0);

  return {
    uniqueBookingIds,
    selectedBookings,
    bookedSeats,
  };
};

exports.getTrips = (req, res) => {
  db.query(
    `SELECT ${tripSelectColumns}
     FROM trips t
     JOIN routes r ON r.route_id = t.route_id
     JOIN cities origin ON origin.city_id = r.origin_id
     JOIN cities destination ON destination.city_id = r.dest_id
     JOIN vehicle_driver vd ON vd.vd_id = t.vd_id
     JOIN vehicles v ON v.vehicle_id = vd.vehicle_id
     JOIN drivers d ON d.driver_id = vd.driver_id
     JOIN users u ON u.user_id = d.user_id
     ORDER BY t.trip_date DESC, t.departure_datetime DESC, t.trip_id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
};

exports.getTripById = (req, res) => {
  const { id } = req.params;

  selectTripById(id, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json(rows[0]);
  });
};

exports.addTrip = (req, res) => {
  const payload = normalizeTripInput(req.body);
  const trip = {
    ...payload,
    capacity: payload.capacity ?? 25,
    trip_status: payload.trip_status || "planned",
  };

  const validationMessage = getTripValidationMessage(trip);
  if (validationMessage) {
    res.status(400).json({ message: validationMessage });
    return;
  }

  withTransaction(res, async ({ rollback, commit }) => {
    try {
      await verifyTripReferences(trip.route_id, trip.vd_id, trip.trip_date);
      const { uniqueBookingIds, bookedSeats } = await prepareTripBookings(trip.booking_ids, trip.route_id);

      if (bookedSeats > trip.capacity) {
        throw createHttpError(400, "Selected bookings exceed the configured trip capacity");
      }

      const insertResult = await queryAsync(
        `INSERT INTO trips
         (route_id, vd_id, trip_date, departure_datetime, arrival_datetime, capacity, booked_seats, trip_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.route_id,
          trip.vd_id,
          trip.trip_date,
          trip.departure_datetime,
          trip.arrival_datetime,
          trip.capacity,
          bookedSeats,
          trip.trip_status,
          trip.notes,
        ]
      );

      await queryAsync(
        `UPDATE bookings
         SET trip_id = ?, booking_status = 'assigned'
         WHERE booking_id IN (${uniqueBookingIds.map(() => "?").join(", ")})`,
        [insertResult.insertId, ...uniqueBookingIds]
      );

      commit(() => {
        selectTripById(insertResult.insertId, (selectErr, rows) => {
          if (selectErr) return res.status(500).json(selectErr);
          const tripData = rows[0];
          res.status(201).json({
            message: "Trip created successfully",
            trip: tripData,
          });

          // Send email notifications in the background (non-blocking)
          notifyAssignedCustomers(uniqueBookingIds, tripData);
        });
      });
    } catch (error) {
      rollback(error);
    }
  });
};

exports.updateTrip = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM trips WHERE trip_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const existingTrip = rows[0];
    const payload = normalizeTripInput(req.body);
    const trip = {
      route_id: payload.route_id ?? existingTrip.route_id,
      vd_id: payload.vd_id ?? existingTrip.vd_id,
      trip_date: payload.trip_date ?? existingTrip.trip_date,
      departure_datetime: payload.departure_datetime ?? existingTrip.departure_datetime,
      arrival_datetime:
        payload.arrival_datetime === undefined ? existingTrip.arrival_datetime : payload.arrival_datetime,
      capacity: payload.capacity ?? existingTrip.capacity,
      trip_status: payload.trip_status ?? existingTrip.trip_status,
      notes: payload.notes === undefined ? existingTrip.notes : payload.notes,
      booking_ids: payload.booking_ids.length > 0 ? payload.booking_ids : [],
    };

    if (trip.booking_ids.length === 0) {
      trip.booking_ids = [];
    }

    withTransaction(res, async ({ rollback, commit }) => {
      try {
        const currentlyAssigned = await queryAsync(
          "SELECT booking_id FROM bookings WHERE trip_id = ? ORDER BY booking_id",
          [id]
        );

        const currentBookingIds = currentlyAssigned.map((booking) => Number(booking.booking_id));
        if (trip.booking_ids.length === 0) {
          trip.booking_ids = currentBookingIds;
        }

        const validationMessage = getTripValidationMessage(trip);
        if (validationMessage) {
          rollback(createHttpError(400, validationMessage));
          return;
        }

        await verifyTripReferences(trip.route_id, trip.vd_id, trip.trip_date);
        const { uniqueBookingIds, bookedSeats } = await prepareTripBookings(
          trip.booking_ids,
          trip.route_id,
          id
        );

        if (bookedSeats > trip.capacity) {
          throw createHttpError(400, "Selected bookings exceed the configured trip capacity");
        }

        await queryAsync(
          `UPDATE trips
           SET route_id = ?, vd_id = ?, trip_date = ?, departure_datetime = ?, arrival_datetime = ?, capacity = ?, booked_seats = ?, trip_status = ?, notes = ?
           WHERE trip_id = ?`,
          [
            trip.route_id,
            trip.vd_id,
            trip.trip_date,
            trip.departure_datetime,
            trip.arrival_datetime,
            trip.capacity,
            bookedSeats,
            trip.trip_status,
            trip.notes,
            id,
          ]
        );

        const removedBookingIds = currentBookingIds.filter(
          (bookingId) => !uniqueBookingIds.includes(Number(bookingId))
        );

        if (removedBookingIds.length > 0) {
          await queryAsync(
            `UPDATE bookings
             SET trip_id = NULL, booking_status = 'pending'
             WHERE booking_id IN (${removedBookingIds.map(() => "?").join(", ")})`,
            removedBookingIds
          );
        }

        // Find bookings that are newly assigned (not previously in this trip)
        const newlyAssignedIds = uniqueBookingIds.filter(
          (bookingId) => !currentBookingIds.includes(Number(bookingId))
        );

        await queryAsync(
          `UPDATE bookings
           SET trip_id = ?, booking_status = 'assigned'
           WHERE booking_id IN (${uniqueBookingIds.map(() => "?").join(", ")})`,
          [id, ...uniqueBookingIds]
        );

        commit(() => {
          selectTripById(id, (selectErr, selectedRows) => {
            if (selectErr) return res.status(500).json(selectErr);
            const tripData = selectedRows[0];
            res.json({
              message: "Trip updated successfully",
              trip: tripData,
            });

            // Notify only newly assigned customers (non-blocking)
            if (newlyAssignedIds.length > 0) {
              notifyAssignedCustomers(newlyAssignedIds, tripData);
            }
          });
        });
      } catch (error) {
        rollback(error);
      }
    });
  });
};

exports.deleteTrip = (req, res) => {
  const { id } = req.params;

  db.query("SELECT trip_id FROM trips WHERE trip_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Trip not found" });
    }

    withTransaction(res, async ({ rollback, commit }) => {
      try {
        const assignedBookings = await queryAsync("SELECT booking_id FROM bookings WHERE trip_id = ?", [id]);

        if (assignedBookings.length > 0) {
          const assignedIds = assignedBookings.map((booking) => booking.booking_id);
          await queryAsync(
            `UPDATE bookings
             SET trip_id = NULL, booking_status = 'pending'
             WHERE booking_id IN (${assignedIds.map(() => "?").join(", ")})`,
            assignedIds
          );
        }

        await queryAsync("DELETE FROM trips WHERE trip_id = ?", [id]);

        commit(() => {
          res.json({ message: "Trip deleted successfully" });
        });
      } catch (error) {
        rollback(error);
      }
    });
  });
};

// ─── Notification Helper ──────────────────────────────────────────────────────
/**
 * Fetch the customer info for each booking and send trip-assigned emails.
 * Runs entirely in the background — never throws.
 */
async function notifyAssignedCustomers(bookingIds, trip) {
  try {
    if (!bookingIds || bookingIds.length === 0) return;

    const placeholders = bookingIds.map(() => "?").join(", ");
    const rows = await queryAsync(
      `SELECT u.email, u.full_name, b.seat_count, b.notes
       FROM bookings b
       JOIN users u ON u.user_id = b.user_id
       WHERE b.booking_id IN (${placeholders})`,
      bookingIds
    );

    for (const row of rows) {
      await sendTripAssignedEmail(row.email, {
        customerName: row.full_name,
        origin: trip.origin_city,
        destination: trip.destination_city,
        departureDate: trip.departure_datetime,
        tripDate: trip.trip_date,
        vehicleType: trip.vehicle_type,
        plateNumber: trip.plate_number,
        driverName: trip.driver_name,
        seatCount: row.seat_count,
        notes: row.notes,
      });
    }
  } catch (err) {
    console.error("[Notification] Error notifying customers:", err.message);
  }
}
