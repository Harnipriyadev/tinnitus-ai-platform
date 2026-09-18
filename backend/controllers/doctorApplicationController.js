const DoctorProfile = require(
  "../models/DoctorProfile"
);

const User = require(
  "../models/User"
);

/*
 * Returns the logged-in doctor's
 * application.
 */
const getMyDoctorApplication =
  async (
    req,
    res,
    next
  ) => {
    try {
      const profile =
        await DoctorProfile.findOne({
          user:
            req.user._id,
        });

      return res
        .status(200)
        .json({
          success: true,
          profile:
            profile || null,
        });
    } catch (error) {
      return next(error);
    }
  };

/*
 * Creates or updates a doctor's draft.
 *
 * Role, verification status, reviewer and
 * documents are never accepted from req.body.
 */
const saveDoctorApplication =
  async (
    req,
    res,
    next
  ) => {
    try {
      let profile =
        await DoctorProfile.findOne({
          user:
            req.user._id,
        });

      if (
        profile &&
        [
          "pending",
          "verified",
          "suspended",
        ].includes(
          profile
            .verificationStatus
        )
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              profile
                .verificationStatus ===
              "pending"
                ? "Your doctor application is currently under review"
                : "This doctor profile cannot currently be edited",
          });
      }

      const {
        medicalCouncil,
        registrationNumber,
        registrationYear,
        qualification,
        specialization,
        experienceYears,
        consultationLanguages,
        hospitalOrClinic,
        professionalBio,
      } = req.body;

      if (!profile) {
        profile =
          new DoctorProfile({
            user:
              req.user._id,
          });
      }

      profile.medicalCouncil =
        medicalCouncil;

      profile.registrationNumber =
        registrationNumber;

      profile.registrationYear =
        registrationYear;

      profile.qualification =
        qualification;

      profile.specialization =
        specialization;

      profile.experienceYears =
        experienceYears;

      profile.consultationLanguages =
        consultationLanguages;

      profile.hospitalOrClinic =
        hospitalOrClinic || "";

      profile.professionalBio =
        professionalBio || "";

      /*
       * A rejected doctor can correct the
       * application and save it as a draft.
       */
      if (
        profile.verificationStatus ===
        "rejected"
      ) {
        profile.verificationStatus =
          "draft";

        profile.rejectionReason =
          "";

        profile.reviewedAt =
          undefined;
      }

      await profile.save();

      return res
        .status(
          profile.createdAt
            .getTime() ===
          profile.updatedAt
            .getTime()
            ? 201
            : 200
        )
        .json({
          success: true,

          message:
            "Doctor application draft saved",

          profile,
        });
    } catch (error) {
      if (
        error.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "This Medical Council registration number is already registered",
          });
      }

      return next(error);
    }
  };

/*
 * Submits a completed application for
 * administrator verification.
 */
const submitDoctorApplication =
  async (
    req,
    res,
    next
  ) => {
    try {
      const profile =
        await DoctorProfile.findOne({
          user:
            req.user._id,
        });

      if (!profile) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Create your doctor application before submitting it",
          });
      }

      if (
        profile.verificationStatus ===
        "pending"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Your doctor application is already under review",
          });
      }

      if (
        profile.verificationStatus ===
        "verified"
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Your doctor account is already verified",
          });
      }

      if (
        profile.verificationStatus ===
        "suspended"
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "This doctor account is suspended",
          });
      }

      const requiredDocuments =
        new Set([
          "medical_registration",
          "government_id",
          "qualification_certificate",
        ]);

      for (
        const document
        of profile.documents
      ) {
        requiredDocuments.delete(
          document.documentType
        );
      }

      if (
        requiredDocuments.size >
        0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Upload all required verification documents before submitting",

            missingDocuments:
              Array.from(
                requiredDocuments
              ),
          });
      }

      profile.verificationStatus =
        "pending";

      profile.submittedAt =
        new Date();

      profile.reviewedAt =
        undefined;

      profile.rejectionReason =
        "";

      await profile.save();

      /*
       * Keep the User verification state
       * synchronized with DoctorProfile.
       */
      await User.updateOne(
        {
          _id:
            req.user._id,
          role:
            "doctor",
        },
        {
          $set: {
            roleVerificationStatus:
              "pending",

            roleVerificationUpdatedAt:
              new Date(),
          },
        }
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Doctor application submitted for verification",

          profile,
        });
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  getMyDoctorApplication,
  saveDoctorApplication,
  submitDoctorApplication,
};