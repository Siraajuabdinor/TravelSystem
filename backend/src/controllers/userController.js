const bcrypt = require("bcryptjs");
const db = require("../config/db");

const allowedRoles = new Set(["Customer", "Driver", "Admin"]);
const userSelectColumns =
  "user_id, full_name, username, email, phone, role, is_active, created_at, updated_at";

const normalizeUserInput = (body) => ({
  full_name: body.full_name?.trim(),
  username: body.username?.trim(),
  email: body.email?.trim(),
  phone: body.phone?.trim(),
  password: body.password,
  role: body.role,
  is_active: body.is_active,
});

const getUserByUniqueFields = ({ email, phone, username }, excludeUserId, callback) => {
  let query = "SELECT user_id, email, phone, username FROM users WHERE (email = ? OR phone = ? OR username = ?)";
  const params = [email, phone, username];

  if (excludeUserId) {
    query += " AND user_id <> ?";
    params.push(excludeUserId);
  }

  db.query(query, params, callback);
};

exports.getUsers = (req, res) => {
  db.query(`SELECT ${userSelectColumns} FROM users`, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getUserById = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT ${userSelectColumns} FROM users WHERE user_id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(result[0]);
    }
  );
};

exports.addUser = async (req, res) => {
  const { full_name, username, email, phone, password, role, is_active } =
    normalizeUserInput(req.body);

  if (!full_name || !username || !email || !phone || !password) {
    return res.status(400).json({
      message: "full_name, username, email, phone, and password are required",
    });
  }

  if (role && !allowedRoles.has(role)) {
    return res.status(400).json({
      message: "role must be one of: Customer, Driver, Admin",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    getUserByUniqueFields({ email, phone, username }, null, (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length > 0) {
        return res.status(400).json({
          message: "Email, phone, or username already exists",
        });
      }

      db.query(
        "INSERT INTO users (full_name, username, email, phone, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          full_name,
          username,
          email,
          phone,
          hashedPassword,
          role || "Customer",
          is_active ?? true,
        ],
        (insertErr, insertResult) => {
          if (insertErr) return res.status(500).json(insertErr);

          db.query(
            `SELECT ${userSelectColumns} FROM users WHERE user_id = ?`,
            [insertResult.insertId],
            (selectErr, rows) => {
              if (selectErr) return res.status(500).json(selectErr);
              res.status(201).json({
                message: "User Created Successfully",
                user: rows[0],
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM users WHERE user_id = ?", [id], async (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingUser = result[0];
    const payload = normalizeUserInput(req.body);
    const updatedUser = {
      full_name: payload.full_name ?? existingUser.full_name,
      username: payload.username ?? existingUser.username,
      email: payload.email ?? existingUser.email,
      phone: payload.phone ?? existingUser.phone,
      role: payload.role ?? existingUser.role,
      is_active: payload.is_active ?? existingUser.is_active,
      password: payload.password,
    };

    if (!allowedRoles.has(updatedUser.role)) {
      return res.status(400).json({
        message: "role must be one of: Customer, Driver, Admin",
      });
    }

    try {
      const hashedPassword = updatedUser.password
        ? await bcrypt.hash(updatedUser.password, 10)
        : existingUser.password;

      getUserByUniqueFields(
        {
          email: updatedUser.email,
          phone: updatedUser.phone,
          username: updatedUser.username,
        },
        id,
        (duplicateErr, duplicateResult) => {
          if (duplicateErr) return res.status(500).json(duplicateErr);
          if (duplicateResult.length > 0) {
            return res.status(400).json({
              message: "Email, phone, or username already exists",
            });
          }

          db.query(
            "UPDATE users SET full_name = ?, username = ?, email = ?, phone = ?, password = ?, role = ?, is_active = ? WHERE user_id = ?",
            [
              updatedUser.full_name,
              updatedUser.username,
              updatedUser.email,
              updatedUser.phone,
              hashedPassword,
              updatedUser.role,
              updatedUser.is_active,
              id,
            ],
            (updateErr) => {
              if (updateErr) return res.status(500).json(updateErr);

              db.query(
                `SELECT ${userSelectColumns} FROM users WHERE user_id = ?`,
                [id],
                (selectErr, rows) => {
                  if (selectErr) return res.status(500).json(selectErr);
                  res.json({
                    message: "User Updated Successfully",
                    user: rows[0],
                  });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      res.status(500).json(error);
    }
  });
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;

  db.query("SELECT user_id FROM users WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    db.query("DELETE FROM users WHERE user_id = ?", [id], (deleteErr) => {
      if (deleteErr) return res.status(500).json(deleteErr);
      res.json({ message: "User Deleted Successfully" });
    });
  });
};
