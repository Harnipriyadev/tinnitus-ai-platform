const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// ==========================
// Register User
// ==========================
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Full name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({
      email: normalizedEmail,
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Unable to create account",
    });
  }
};

// ==========================
// Login User
// ==========================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login",
    });
  }
};

// ==========================
// Forgot Password
// ==========================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Generic response prevents revealing registered emails
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save({
      validateBeforeSave: false,
    });

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
        <h2 style="color: #06b6d4;">AI Tinnitus Password Reset</h2>

        <p>Hello ${user.fullName},</p>

        <p>
          We received a request to reset the password for your AI Tinnitus
          account.
        </p>

        <p>
          Click the button below to create a new password. This link will expire
          in 15 minutes.
        </p>

        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            margin: 16px 0;
            padding: 12px 22px;
            border-radius: 8px;
            background: #06b6d4;
            color: #001018;
            text-decoration: none;
            font-weight: bold;
          "
        >
          Reset Password
        </a>

        <p>
          If the button does not work, copy and paste this address into your
          browser:
        </p>

        <p>${resetUrl}</p>

        <p>
          If you did not request this reset, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset your AI Tinnitus password",
        message,
      });

      return res.status(200).json({
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({
        validateBeforeSave: false,
      });

      console.error("Email error:", emailError);

      return res.status(500).json({
        message: "Unable to send the reset email",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  }
};

// ==========================
// Reset Password
// ==========================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset password",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};