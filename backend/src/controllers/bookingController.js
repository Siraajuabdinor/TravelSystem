const db = require("../config/db");

const allowedStatuses = new Set(["pending", "assigned", "cancelled", "completed"]);
const bookingSelectColumns = `
  b.booking_id,
  b.route_id,
  r.origin_id,
  origin.city_name AS origin_city,
  r.dest_id,
  destination.city_name AS destination_city,
  r.distance_km,
  r.distance_km AS distance,
  r.estimated_time,
  b.user_id,
  u.full_name AS customer_name,
  u.email AS customer_email,
  u.phone AS customer_phone,
  b.trip_id,
  b.seat_count,
  b.booking_status,
  b.notes,
  b.created_at,
  b.updated_at
`;

const normalizeBookingInput = (body) => ({
  route_id:
    body.route_id === undefined || body.route_id === null || body.route_id === ""
      ? null
      : Number(body.route_id),
  user_id:
    body.user_id === undefined || body.user_id === null || body.user_id === ""
      ? null
      : Number(body.user_id),
  trip_id:
    body.trip_id === undefined || body.trip_id === null || body.trip_id === ""
      ? null
      : Number(body.trip_id),
  seat_count:
    body.seat_count === undefined || body.seat_count === null || body.seat_count === ""
      ? null
      : Number(body.seat_count),
  booking_status: body.booking_status,
  notes: body.notes?.trim() || null,
});

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
const isAdmin = (req) => req.user?.role === "Admin";

const getBookingAccessQuery = (req) =>
  isAdmin(req)
    ? `SELECT ${bookingSelectColumns}
       FROM bookings b
       JOIN routes r ON r.route_id = b.route_id
       JOIN cities origin ON origin.city_id = r.origin_id
       JOIN cities destination ON destination.city_id = r.dest_id
       JOIN users u ON u.user_id = b.user_id`
    : `SELECT ${bookingSelectColumns}
       FROM bookings b
       JOIN routes r ON r.route_id = b.route_id
       JOIN cities origin ON origin.city_id = r.origin_id
       JOIN cities destination ON destination.city_id = r.dest_id
       JOIN users u ON u.user_id = b.user_id
       WHERE b.user_id = ?`;

const verifyRouteExists = (routeId, res, onOk) => {
  db.query("SELECT route_id FROM routes WHERE route_id = ?", [routeId], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(400).json({ message: "route_id must refer to an existing route" });
    }

    onOk();
  });
};

const verifyUserExists = (userId, res, onOk) => {
  db.query("SELECT user_id FROM users WHERE user_id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(400).json({ message: "user_id must refer to an existing user" });
    }

    onOk();
  });
};

const validateBookingStatus = (status, res) => {
  if (!allowedStatuses.has(status)) {
    res.status(400).json({
      message: "booking_status must be one of: pending, assigned, cancelled, completed",
    });
    return false;
  }

  return true;
};

const validateBookingPayload = ({ route_id, user_id, seat_count, booking_status }, res) => {
  if (!isPositiveInteger(route_id) || !isPositiveInteger(user_id) || !isPositiveInteger(seat_count)) {
    res.status(400).json({
      message: "route_id, user_id, and seat_count must be valid positive integers",
    });
    return false;
  }

  return validateBookingStatus(booking_status, res);
};

const getBookingById = (bookingId, callback) => {
  db.query("SELECT * FROM bookings WHERE booking_id = ?", [bookingId], callback);
};

const ensureBookingAccess = (req, booking, res) => {
  if (isAdmin(req)) {
    return true;
  }

  if (Number(booking.user_id) !== Number(req.user.user_id)) {
    res.status(403).json({ message: "Access denied" });
    return false;
  }

  return true;
};

exports.getBookings = (req, res) => {
  const query = `${getBookingAccessQuery(req)} ORDER BY b.created_at DESC, b.booking_id DESC`;
  const params = isAdmin(req) ? [] : [req.user.user_id];

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

exports.getBookingById = (req, res) => {
  const { id } = req.params;
  const query = `${getBookingAccessQuery(req)}${isAdmin(req) ? " WHERE b.booking_id = ?" : " AND b.booking_id = ?"}`;
  const params = isAdmin(req) ? [id] : [req.user.user_id, id];

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(rows[0]);
  });
};

exports.addBooking = (req, res) => {
  const payload = normalizeBookingInput(req.body);
  const booking = {
    route_id: payload.route_id,
    user_id: isAdmin(req) && payload.user_id ? payload.user_id : Number(req.user.user_id),
    trip_id: isAdmin(req) ? payload.trip_id : null,
    seat_count: payload.seat_count ?? 1,
    booking_status: isAdmin(req) && payload.booking_status ? payload.booking_status : "pending",
    notes: payload.notes,
  };

  if (!validateBookingPayload(booking, res)) {
    return;
  }

  verifyRouteExists(booking.route_id, res, () => {
    verifyUserExists(booking.user_id, res, () => {
      db.query(
        "INSERT INTO bookings (route_id, user_id, trip_id, seat_count, booking_status, notes) VALUES (?, ?, ?, ?, ?, ?)",
        [
          booking.route_id,
          booking.user_id,
          booking.trip_id,
          booking.seat_count,
          booking.booking_status,
          booking.notes,
        ],
        (insertErr, insertResult) => {
          if (insertErr) return res.status(500).json(insertErr);

          const selectQuery = `
            SELECT ${bookingSelectColumns}
            FROM bookings b
            JOIN routes r ON r.route_id = b.route_id
            JOIN cities origin ON origin.city_id = r.origin_id
            JOIN cities destination ON destination.city_id = r.dest_id
            JOIN users u ON u.user_id = b.user_id
            WHERE b.booking_id = ?
          `;

          db.query(selectQuery, [insertResult.insertId], (selectErr, rows) => {
            if (selectErr) return res.status(500).json(selectErr);
            res.status(201).json({
              message: "Booking created successfully",
              booking: rows[0],
            });
          });
        }
      );
    });
  });
};

exports.updateBooking = (req, res) => {
  const { id } = req.params;

  getBookingById(id, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const existingBooking = rows[0];
    if (!ensureBookingAccess(req, existingBooking, res)) {
      return;
    }

    if (!isAdmin(req) && existingBooking.booking_status !== "pending") {
      return res.status(400).json({
        message: "Only pending bookings can be updated",
      });
    }

    const payload = normalizeBookingInput(req.body);
    const updatedBooking = {
      route_id: payload.route_id ?? existingBooking.route_id,
      user_id: isAdmin(req) ? payload.user_id ?? existingBooking.user_id : existingBooking.user_id,
      trip_id: isAdmin(req) ? payload.trip_id ?? existingBooking.trip_id : existingBooking.trip_id,
      seat_count: payload.seat_count ?? existingBooking.seat_count,
      booking_status: isAdmin(req)
        ? payload.booking_status ?? existingBooking.booking_status
        : existingBooking.booking_status,
      notes: payload.notes === undefined ? existingBooking.notes : payload.notes,
    };

    if (!validateBookingPayload(updatedBooking, res)) {
      return;
    }

    verifyRouteExists(updatedBooking.route_id, res, () => {
      verifyUserExists(updatedBooking.user_id, res, () => {
        db.query(
          "UPDATE bookings SET route_id = ?, user_id = ?, trip_id = ?, seat_count = ?, booking_status = ?, notes = ? WHERE booking_id = ?",
          [
            updatedBooking.route_id,
            updatedBooking.user_id,
            updatedBooking.trip_id,
            updatedBooking.seat_count,
            updatedBooking.booking_status,
            updatedBooking.notes,
            id,
          ],
          (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);

            const selectQuery = `
              SELECT ${bookingSelectColumns}
              FROM bookings b
              JOIN routes r ON r.route_id = b.route_id
              JOIN cities origin ON origin.city_id = r.origin_id
              JOIN cities destination ON destination.city_id = r.dest_id
              JOIN users u ON u.user_id = b.user_id
              WHERE b.booking_id = ?
            `;

            db.query(selectQuery, [id], (selectErr, selectedRows) => {
              if (selectErr) return res.status(500).json(selectErr);
              res.json({
                message: "Booking updated successfully",
                booking: selectedRows[0],
              });
            });
          }
        );
      });
    });
  });
};

exports.deleteBooking = (req, res) => {
  const { id } = req.params;

  getBookingById(id, (err, rows) => {
    if (err) return res.status(500).json(err);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const existingBooking = rows[0];
    if (!ensureBookingAccess(req, existingBooking, res)) {
      return;
    }

    if (!isAdmin(req) && existingBooking.booking_status !== "pending") {
      return res.status(400).json({
        message: "Only pending bookings can be deleted",
      });
    }

    db.query("DELETE FROM bookings WHERE booking_id = ?", [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json(deleteErr);
      res.json({ message: "Booking deleted successfully" });
    });
  });
};
