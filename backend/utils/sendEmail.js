const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log("Sending email...");
    console.log("From:", emailUser);
    console.log("To:", email);
    console.log(
      "App password loaded:",
      emailPass ? `Yes (${emailPass.length} characters)` : "No"
    );

    if (!emailUser || !emailPass) {
      throw new Error(
        "EMAIL_USER or EMAIL_PASS is missing from the backend .env file"
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.verify();

    console.log("Gmail SMTP connection successful");

    const info = await transporter.sendMail({
      from: `"AI Tinnitus" <${emailUser}>`,
      to: email,
      subject,
      html: message,
    });

    console.log("Email accepted:", info.accepted);
    console.log("Email rejected:", info.rejected);
    console.log("Email response:", info.response);
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error.message);
    console.error(error);

    throw error;
  }
};

module.exports = sendEmail;