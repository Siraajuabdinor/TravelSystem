const db = require("../config/db");

const assignmentSelectColumns = `
  vd.vd_id,
  vd.vehicle_id,
  v.vehicle_type,
  v.plate_number,
  vd.driver_id,
  u.full_name AS driver_name,
  u.email AS driver_email,
  u.phone AS driver_phone,
  d.license_number,
  d.status AS driver_status,
  vd.start_date,
  vd.end_date,
  vd.created_at,
  vd.updated_at
`;

const normalizeAssignmentInput = (body) => ({
  vehicle_id:
    body.vehicle_id === undefined || body.vehicle_id === null || body.vehicle_id === ""
      ? null
      : Number(body.vehicle_id),
  driver_id:
    body.driver_id === undefined || body.driver_id === null || body.driver_id === ""
      ? null
      : Number(body.driver_id),
  start_date: body.start_date,
  end_date: body.end_date === undefined ? undefined : body.end_date || null,
});

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;
const toTimestamp = (value) => new Date(value).getTime();

const validateAssignment = ({ vehicle_id, driver_id, start_date, end_date }, res) => {
  const startTimestamp = toTimestamp(start_date);
  const endTimestamp = end_date ? toTimestamp(end_date) : null;

  if (!isPositiveInteger(vehicle_id) || !isPositiveInteger(driver_id) || !start_date) {
    res.status(400).json({
      message: "vehicle_id, driver_id, and start_date are required",
    });
    return false;
  }

  if (Number.isNaN(startTimestamp) || (end_date && Number.isNaN(endTimestamp))) {
    res.status(400).json({
      message: "start_date and end_date must be valid dates",
    });
    return false;
  }

  if (end_date && endTimestamp < startTimestamp) {
    res.status(400).json({
      message: "end_date cannot be earlier than start_date",
    });
    return false;
  }

  return true;
};

const verifyAssignmentReferences = (vehicleId, driverId, res, onOk) => {
  db.query("SELECT vehicle_id FROM vehicles WHERE vehicle_id = ?", [vehicleId], (vehicleErr, vehicles) => {
    if (vehicleErr) return res.status(500).json(vehicleErr);
    if (vehicles.length === 0) {
      return res.status(400).json({ message: "vehicle_id must refer to an existing vehicle" });
    }

    db.query("SELECT driver_id FROM drivers WHERE driver_id = ?", [driverId], (driverErr, drivers) => {
      if (driverErr) return res.status(500).json(driverErr);
      if (drivers.length === 0) {
        return res.status(400).json({ message: "driver_id must refer to an existing driver" });
      }

      onOk();
    });
  });
};

const checkAssignmentUniqueness = (
  { vehicle_id, driver_id, start_date },
  excludeAssignmentId,
  res,
  onOk
) => {
  let query =
    "SELECT vd_id FROM vehicle_driver WHERE vehicle_id = ? AND driver_id = ? AND start_date = ?";
  const params = [vehicle_id, driver_id, start_date];

  if (excludeAssignmentId) {
    query += " AND vd_id <> ?";
    params.push(excludeAssignmentId);
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length > 0) {
      return res.status(400).json({
        message: "This vehicle and driver assignment already exists for the selected start date",
      });
    }

    onOk();
  });
};

exports.getVehicleDrivers = (req, res) => {
  db.query(
    `SELECT ${assignmentSelectColumns}
     FROM vehicle_driver vd
     JOIN vehicles v ON v.vehicle_id = vd.vehicle_id
     JOIN drivers d ON d.driver_id = vd.driver_id
     JOIN users u ON u.user_id = d.user_id
     ORDER BY vd.start_date DESC, vd.vd_id DESC`,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.getVehicleDriverById = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT ${assignmentSelectColumns}
     FROM vehicle_driver vd
     JOIN vehicles v ON v.vehicle_id = vd.vehicle_id
     JOIN drivers d ON d.driver_id = vd.driver_id
     JOIN users u ON u.user_id = d.user_id
     WHERE vd.vd_id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) {
        return res.status(404).json({ message: "Vehicle assignment not found" });
      }

      res.json(result[0]);
    }
  );
};

exports.addVehicleDriver = (req, res) => {
  const assignment = normalizeAssignmentInput(req.body);

  if (!validateAssignment(assignment, res)) {
    return;
  }

  verifyAssignmentReferences(assignment.vehicle_id, assignment.driver_id, res, () => {
    checkAssignmentUniqueness(assignment, null, res, () => {
      db.query(
        "INSERT INTO vehicle_driver (vehicle_id, driver_id, start_date, end_date) VALUES (?, ?, ?, ?)",
        [assignment.vehicle_id, assignment.driver_id, assignment.start_date, assignment.end_date],
        (insertErr, insertResult) => {
          if (insertErr) return res.status(500).json(insertErr);

          db.query(
            `SELECT ${assignmentSelectColumns}
             FROM vehicle_driver vd
             JOIN vehicles v ON v.vehicle_id = vd.vehicle_id
             JOIN drivers d ON d.driver_id = vd.driver_id
             JOIN users u ON u.user_id = d.user_id
             WHERE vd.vd_id = ?`,
            [insertResult.insertId],
            (selectErr, rows) => {
              if (selectErr) return res.status(500).json(selectErr);
              res.status(201).json({
                message: "Vehicle assignment created successfully",
                assignment: rows[0],
              });
            }
          );
        }
      );
    });
  });
};

exports.updateVehicleDriver = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM vehicle_driver WHERE vd_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Vehicle assignment not found" });
    }

    const existingAssignment = result[0];
    const payload = normalizeAssignmentInput(req.body);
    const updatedAssignment = {
      vehicle_id: payload.vehicle_id ?? existingAssignment.vehicle_id,
      driver_id: payload.driver_id ?? existingAssignment.driver_id,
      start_date: payload.start_date ?? existingAssignment.start_date,
      end_date: payload.end_date === undefined ? existingAssignment.end_date : payload.end_date,
    };

    if (!validateAssignment(updatedAssignment, res)) {
      return;
    }

    verifyAssignmentReferences(updatedAssignment.vehicle_id, updatedAssignment.driver_id, res, () => {
      checkAssignmentUniqueness(updatedAssignment, id, res, () => {
        db.query(
          "UPDATE vehicle_driver SET vehicle_id = ?, driver_id = ?, start_date = ?, end_date = ? WHERE vd_id = ?",
          [
            updatedAssignment.vehicle_id,
            updatedAssignment.driver_id,
            updatedAssignment.start_date,
            updatedAssignment.end_date,
            id,
          ],
          (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);

            db.query(
              `SELECT ${assignmentSelectColumns}
               FROM vehicle_driver vd
               JOIN vehicles v ON v.vehicle_id = vd.vehicle_id
               JOIN drivers d ON d.driver_id = vd.driver_id
               JOIN users u ON u.user_id = d.user_id
               WHERE vd.vd_id = ?`,
              [id],
              (selectErr, rows) => {
                if (selectErr) return res.status(500).json(selectErr);
                res.json({
                  message: "Vehicle assignment updated successfully",
                  assignment: rows[0],
                });
              }
            );
          }
        );
      });
    });
  });
};

exports.deleteVehicleDriver = (req, res) => {
  const { id } = req.params;

  db.query("SELECT vd_id FROM vehicle_driver WHERE vd_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Vehicle assignment not found" });
    }

    db.query("DELETE FROM vehicle_driver WHERE vd_id = ?", [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json(deleteErr);
      res.json({ message: "Vehicle assignment deleted successfully" });
    });
  });
};
