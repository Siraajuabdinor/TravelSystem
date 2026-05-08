const db = require("../config/db");

const allowedStatuses = new Set(["active", "inactive", "suspended"]);
const driverSelectColumns = `
  d.driver_id,
  d.user_id,
  u.full_name,
  u.email,
  u.phone,
  d.license_number,
  d.license_expiry,
  d.status,
  d.created_at,
  d.updated_at
`;

const normalizeDriverInput = (body) => ({
  user_id: body.user_id,
  license_number: body.license_number?.trim(),
  license_expiry: body.license_expiry,
  status: body.status,
});

const validateDriverStatus = (status, res) => {
  if (!allowedStatuses.has(status)) {
    res.status(400).json({
      message: "status must be one of: active, inactive, suspended",
    });
    return false;
  }

  return true;
};

const verifyDriverUser = (userId, res, onOk) => {
  db.query(
    "SELECT user_id, role FROM users WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) {
        return res.status(400).json({ message: "user_id must refer to an existing user" });
      }
      if (result[0].role !== "Driver") {
        return res.status(400).json({ message: "user_id must belong to a user with Driver role" });
      }
      onOk();
    }
  );
};

const checkDriverUniqueness = ({ user_id, license_number }, excludeDriverId, res, onOk) => {
  let query =
    "SELECT driver_id, user_id, license_number FROM drivers WHERE (user_id = ? OR license_number = ?)";
  const params = [user_id, license_number];

  if (excludeDriverId) {
    query += " AND driver_id <> ?";
    params.push(excludeDriverId);
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length > 0) {
      return res.status(400).json({
        message: "A driver profile with this user_id or license_number already exists",
      });
    }
    onOk();
  });
};

exports.getDrivers = (req, res) => {
  db.query(
    `SELECT ${driverSelectColumns} FROM drivers d JOIN users u ON u.user_id = d.user_id`,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};

exports.getDriverById = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT ${driverSelectColumns} FROM drivers d JOIN users u ON u.user_id = d.user_id WHERE d.driver_id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(result[0]);
    }
  );
};

exports.addDriver = (req, res) => {
  const { user_id, license_number, license_expiry, status } = normalizeDriverInput(req.body);

  if (!user_id || !license_number || !license_expiry || !status) {
    return res.status(400).json({
      message: "user_id, license_number, license_expiry, and status are required",
    });
  }

  if (!validateDriverStatus(status, res)) {
    return;
  }

  verifyDriverUser(user_id, res, () => {
    checkDriverUniqueness({ user_id, license_number }, null, res, () => {
      db.query(
        "INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES (?, ?, ?, ?)",
        [user_id, license_number, license_expiry, status],
        (insertErr, insertResult) => {
          if (insertErr) return res.status(500).json(insertErr);

          db.query(
            `SELECT ${driverSelectColumns} FROM drivers d JOIN users u ON u.user_id = d.user_id WHERE d.driver_id = ?`,
            [insertResult.insertId],
            (selectErr, rows) => {
              if (selectErr) return res.status(500).json(selectErr);
              res.status(201).json({
                message: "Driver Created Successfully",
                driver: rows[0],
              });
            }
          );
        }
      );
    });
  });
};

exports.updateDriver = (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM drivers WHERE driver_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const existingDriver = result[0];
    const payload = normalizeDriverInput(req.body);
    const updatedDriver = {
      user_id: payload.user_id ?? existingDriver.user_id,
      license_number: payload.license_number ?? existingDriver.license_number,
      license_expiry: payload.license_expiry ?? existingDriver.license_expiry,
      status: payload.status ?? existingDriver.status,
    };

    if (!validateDriverStatus(updatedDriver.status, res)) {
      return;
    }

    verifyDriverUser(updatedDriver.user_id, res, () => {
      checkDriverUniqueness(updatedDriver, id, res, () => {
        db.query(
          "UPDATE drivers SET user_id = ?, license_number = ?, license_expiry = ?, status = ? WHERE driver_id = ?",
          [
            updatedDriver.user_id,
            updatedDriver.license_number,
            updatedDriver.license_expiry,
            updatedDriver.status,
            id,
          ],
          (updateErr) => {
            if (updateErr) return res.status(500).json(updateErr);

            db.query(
              `SELECT ${driverSelectColumns} FROM drivers d JOIN users u ON u.user_id = d.user_id WHERE d.driver_id = ?`,
              [id],
              (selectErr, rows) => {
                if (selectErr) return res.status(500).json(selectErr);
                res.json({
                  message: "Driver Updated Successfully",
                  driver: rows[0],
                });
              }
            );
          }
        );
      });
    });
  });
};

exports.deleteDriver = (req, res) => {
  const { id } = req.params;

  db.query("SELECT driver_id FROM drivers WHERE driver_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    db.query("DELETE FROM drivers WHERE driver_id = ?", [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json(deleteErr);
      res.json({ message: "Driver Deleted Successfully" });
    });
  });
};
