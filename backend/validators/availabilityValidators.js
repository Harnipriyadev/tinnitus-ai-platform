const {
  z,
} = require("zod");

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)$/;

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const timeSlotSchema =
  z
    .object({
      startTime:
        z
          .string()
          .trim()
          .regex(
            TIME_PATTERN,
            "Start time must use HH:MM format"
          ),

      endTime:
        z
          .string()
          .trim()
          .regex(
            TIME_PATTERN,
            "End time must use HH:MM format"
          ),
    })
    .strict()
    .refine(
      (slot) =>
        slot.startTime <
        slot.endTime,
      {
        message:
          "End time must be after start time",

        path: [
          "endTime",
        ],
      }
    );

const availabilitySchema =
  z
    .object({
      date:
        z
          .string()
          .trim()
          .regex(
            DATE_PATTERN,
            "Date must use YYYY-MM-DD format"
          )
          .refine(
            (value) => {
              const parsedDate =
                new Date(
                  `${value}T00:00:00+05:30`
                );

              return (
                !Number.isNaN(
                  parsedDate.getTime()
                ) &&
                parsedDate
                  .toLocaleDateString(
                    "en-CA",
                    {
                      timeZone:
                        "Asia/Kolkata",
                    }
                  ) === value
              );
            },
            {
              message:
                "Enter a valid date",
            }
          ),

      slots:
        z
          .array(
            timeSlotSchema
          )
          .min(
            1,
            "Add at least one time slot"
          )
          .max(
            30,
            "Add no more than 30 time slots"
          ),

      timezone:
        z
          .literal(
            "Asia/Kolkata"
          )
          .optional()
          .default(
            "Asia/Kolkata"
          ),
    })
    .strict()
    .superRefine(
      (
        data,
        context
      ) => {
        /*
         * Prevent dates before today
         * in the India timezone.
         */
        const today =
          new Intl.DateTimeFormat(
            "en-CA",
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
          ).format(
            new Date()
          );

        if (
          data.date < today
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "date",
            ],

            message:
              "Availability cannot be created for a past date",
          });
        }

        /*
         * Sort a copy so the submitted
         * array is not modified.
         */
        const sortedSlots = [
          ...data.slots,
        ].sort(
          (
            first,
            second
          ) =>
            first.startTime.localeCompare(
              second.startTime
            )
        );

        for (
          let index = 1;
          index <
          sortedSlots.length;
          index += 1
        ) {
          const previous =
            sortedSlots[
              index - 1
            ];

          const current =
            sortedSlots[
              index
            ];

          if (
            current.startTime <
            previous.endTime
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode
                  .custom,

              path: [
                "slots",
              ],

              message:
                "Availability time slots cannot overlap",
            });

            break;
          }
        }

        /*
         * Prevent duplicate time slots.
         */
        const uniqueSlots =
          new Set(
            data.slots.map(
              (slot) =>
                `${slot.startTime}-${slot.endTime}`
            )
          );

        if (
          uniqueSlots.size !==
          data.slots.length
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "slots",
            ],

            message:
              "Duplicate time slots are not allowed",
          });
        }
      }
    );

module.exports = {
  availabilitySchema,
};