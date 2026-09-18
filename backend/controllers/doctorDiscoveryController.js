const DoctorAvailability =
  require(
    "../models/DoctorAvailability"
  );

const DoctorProfile =
  require(
    "../models/DoctorProfile"
  );

/*
 * Returns the beginning of today in the
 * Asia/Kolkata timezone.
 */
const getIndiaToday =
  () => {
    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone:
            "Asia/Kolkata",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",
        }
      ).formatToParts(
        new Date()
      );

    const values =
      Object.fromEntries(
        parts
          .filter(
            (part) =>
              part.type !==
              "literal"
          )
          .map(
            (part) => [
              part.type,
              part.value,
            ]
          )
      );

    return new Date(
      `${values.year}-${values.month}-${values.day}T00:00:00+05:30`
    );
  };

/*
 * Builds the exact appointment time so
 * past slots from today are not displayed.
 */
const getSlotDateTime =
  (
    date,
    time
  ) => {
    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone:
            "Asia/Kolkata",

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",
        }
      ).formatToParts(
        new Date(
          date
        )
      );

    const values =
      Object.fromEntries(
        parts
          .filter(
            (part) =>
              part.type !==
              "literal"
          )
          .map(
            (part) => [
              part.type,
              part.value,
            ]
          )
      );

    return new Date(
      `${values.year}-${values.month}-${values.day}T${time}:00+05:30`
    );
  };

/*
 * Patients can browse only verified,
 * active doctors and their open future slots.
 */
const getVerifiedDoctors =
  async (
    req,
    res,
    next
  ) => {
    try {
      const profiles =
        await DoctorProfile
          .find({
            verificationStatus:
              "verified",
          })
          .select(
            "user medicalCouncil registrationNumber registrationYear qualification specialization experienceYears consultationLanguages hospitalOrClinic professionalBio"
          )
          .populate({
            path:
              "user",

            match: {
              role:
                "doctor",

              roleVerificationStatus:
                "verified",

              accountStatus:
                "active",
            },

            select:
              "fullName profilePicture",
          })
          .sort({
            specialization:
              1,

            experienceYears:
              -1,
          });

      /*
       * Remove profiles whose connected User
       * account is no longer active or verified.
       */
      const activeProfiles =
        profiles.filter(
          (profile) =>
            profile.user
        );

      const doctorIds =
        activeProfiles.map(
          (profile) =>
            profile.user._id
        );

      const availability =
        await DoctorAvailability
          .find({
            doctor: {
              $in:
                doctorIds,
            },

            active:
              true,

            date: {
              $gte:
                getIndiaToday(),
            },
          })
          .select(
            "doctor date timezone slots"
          )
          .sort({
            date:
              1,
          });

      const availabilityByDoctor =
        new Map();

      for (
        const schedule of
        availability
      ) {
        const openSlots =
          schedule.slots
            .filter(
              (slot) =>
                !slot.isBooked &&
                getSlotDateTime(
                  schedule.date,
                  slot.startTime
                ).getTime() >
                  Date.now()
            )
            .map(
              (slot) => ({
                _id:
                  slot._id,

                startTime:
                  slot.startTime,

                endTime:
                  slot.endTime,
              })
            );

        if (
          openSlots.length ===
          0
        ) {
          continue;
        }

        const doctorId =
          schedule.doctor
            .toString();

        const doctorAvailability =
          availabilityByDoctor
            .get(
              doctorId
            ) || [];

        doctorAvailability.push({
          _id:
            schedule._id,

          date:
            schedule.date,

          timezone:
            schedule
              .timezone,

          slots:
            openSlots,
        });

        availabilityByDoctor.set(
          doctorId,
          doctorAvailability
        );
      }

      /*
       * Return only public professional details.
       * Registration documents and private
       * storage keys are never returned.
       */
      const doctors =
        activeProfiles.map(
          (profile) => ({
            _id:
              profile.user
                ._id,

            profileId:
              profile._id,

            fullName:
              profile.user
                .fullName,

            profilePicture:
              profile.user
                .profilePicture ||
              "",

            medicalCouncil:
              profile
                .medicalCouncil,

            registrationNumber:
              profile
                .registrationNumber,

            registrationYear:
              profile
                .registrationYear,

            qualification:
              profile
                .qualification,

            specialization:
              profile
                .specialization,

            experienceYears:
              profile
                .experienceYears,

            consultationLanguages:
              profile
                .consultationLanguages,

            hospitalOrClinic:
              profile
                .hospitalOrClinic ||
              "",

            professionalBio:
              profile
                .professionalBio ||
              "",

            availability:
              availabilityByDoctor
                .get(
                  profile.user
                    ._id
                    .toString()
                ) || [],
          })
        );

      return res
        .status(200)
        .json({
          success: true,

          doctors,
        });
    } catch (error) {
      return next(error);
    }
  };

module.exports = {
  getVerifiedDoctors,
};