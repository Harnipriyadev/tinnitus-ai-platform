const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign(
    { id }, // Payload
    process.env.JWT_SECRET, // Secret Key
    {
      expiresIn: "7d", // Token valid for 7 days
    }
  );
};

module.exports = generateToken;