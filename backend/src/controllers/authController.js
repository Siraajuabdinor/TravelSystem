const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { signUserToken } = require("../config/auth");

const authSelectColumns =
  "user_id, full_name, username, email, phone, role, is_active, created_at, updated_at";

exports.register = async (req, res) => {
  const full_name = req.body.full_name?.trim();
  const username = req.body.username?.trim();
  const email = req.body.email?.trim();
  const phone = req.body.phone?.trim();
  const { password } = req.body;

  if (!full_name || !username || !email || !phone || !password) {
    return res.status(400).json({
      message: "full_name, username, email, phone, and password are required",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "SELECT user_id FROM users WHERE email = ? OR phone = ? OR username = ?",
      [email, phone, username],
      (duplicateErr, duplicateResult) => {
        if (duplicateErr) return res.status(500).json(duplicateErr);
        if (duplicateResult.length > 0) {
          return res.status(400).json({
            message: "Email, phone, or username already exists",
          });
        }

        db.query(
          "INSERT INTO users (full_name, username, email, phone, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [full_name, username, email, phone, hashedPassword, "Customer", true],
          (insertErr, insertResult) => {
            if (insertErr) return res.status(500).json(insertErr);

            db.query(
              `SELECT * FROM users WHERE user_id = ?`,
              [insertResult.insertId],
              (selectErr, result) => {
                if (selectErr) return res.status(500).json(selectErr);

                const user = result[0];
                const token = signUserToken(user);

                res.status(201).json({
                  message: "Registration successful",
                  token,
                  user: {
                    user_id: user.user_id,
                    full_name: user.full_name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    is_active: user.is_active,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                  },
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
};

exports.login = (req, res) => {
  const identifier = req.body.email?.trim() || req.body.username?.trim();
  const { password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      message: "email or username, and password are required",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1",
    [identifier, identifier],
    async (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) {
        return res.status(401).json({ message: "Invalid login credentials" });
      }

      const user = result[0];

      if (!user.is_active) {
        return res.status(403).json({ message: "This account is inactive" });
      }

      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid login credentials" });
        }

        const token = signUserToken(user);

        res.json({
          message: "Login successful",
          token,
          user: {
            user_id: user.user_id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
        });
      } catch (compareError) {
        res.status(500).json(compareError);
      }
    }
  );
};

exports.getMe = (req, res) => {
  db.query(
    `SELECT ${authSelectColumns} FROM users WHERE user_id = ?`,
    [req.user.user_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(result[0]);
    }
  );
};
