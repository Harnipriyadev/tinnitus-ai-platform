require(
  "dotenv"
).config();

const mongoose = require(
  "mongoose"
);

const User = require(
  "../models/User"
);

const admin = require(
  "../config/firebaseAdmin"
);

const promoteAdmin =
  async () => {
    const email =
      process.argv[2]
        ?.trim()
        .toLowerCase();

    if (!email) {
      throw new Error(
        "Provide the verified account email"
      );
    }

    if (
      !process.env.MONGO_URI
    ) {
      throw new Error(
        "MONGO_URI is not configured"
      );
    }

    await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS:
          10000,
      }
    );

    /*
     * Confirm that the Firebase identity exists
     * and has a verified email.
     */
    const firebaseUser =
      await admin
        .auth()
        .getUserByEmail(
          email
        );

    if (
      firebaseUser
        .emailVerified !==
      true
    ) {
      throw new Error(
        "Verify the Firebase email before creating an Admin"
      );
    }

    const user =
      await User.findOne({
        email,
      }).select(
        "+firebaseUid"
      );

    if (!user) {
      throw new Error(
        "MongoDB user profile was not found. Log in once before promotion."
      );
    }

    if (
      user.firebaseUid !==
      firebaseUser.uid
    ) {
      throw new Error(
        "Firebase identity does not match the MongoDB profile"
      );
    }

    if (
      user.accountStatus !==
      "active"
    ) {
      throw new Error(
        "Disabled accounts cannot become Administrators"
      );
    }

    /*
     * Only a normal Patient test account can
     * be promoted. This prevents accidental
     * conversion of Doctor or Caretaker users.
     */
    if (
      user.role !==
        "patient" &&
      user.role !==
        "admin"
    ) {
      throw new Error(
        "Only a Patient account can be promoted to Admin"
      );
    }

    user.role =
      "admin";

    user.roleVerificationStatus =
      "verified";

    user.roleVerificationUpdatedAt =
      new Date();

    await user.save();

    console.log(
      `Admin role assigned to ${email}`
    );
  };

promoteAdmin()
  .catch(
    (error) => {
      console.error(
        "Admin promotion failed:",
        error.message
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await mongoose
        .connection
        .close();
    }
  );