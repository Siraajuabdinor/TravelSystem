const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET || "change-this-jwt-secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

const signUserToken = (user) =>
  jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

module.exports = {
  jwtSecret,
  jwtExpiresIn,
  signUserToken,
};
