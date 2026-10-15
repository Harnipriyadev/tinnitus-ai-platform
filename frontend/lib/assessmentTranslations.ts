export type AssessmentLanguage =
  | "en"
  | "kn"
  | "hi";

export type AssessmentQuestionName =
  | "patient_name"
  | "email"
  | "age"
  | "gender"
  | "tinnitus_type"
  | "affected_ear"
  | "frequency_hz"
  | "loudness_db"
  | "hearing_loss"
  | "thi_score"
  | "tfi_score"
  | "hads_anxiety"
  | "hads_depression"
  | "sleep_score"
  | "treatment";

type QuestionTranslation = {
  question: string;
  description: string;
  guidance?: string;
  placeholder?: string;
};

type AssessmentTranslation = {
  languageName: string;

  interface: {
    title: string;
    subtitle: string;
    language: string;
    question: string;
    of: string;
    guidance: string;
    previous: string;
    continue: string;
    completeAssessment: string;
    analysing: string;
    requiredInformation: string;
    disclaimer: string;
  };

  validation: {
    required: string;
    invalidNumber: string;
    minimumValue: string;
    maximumValue: string;
    invalidEmail: string;
    apiNotConfigured: string;
    sessionExpired: string;
    signInRequired: string;
    processingFailed: string;
    submissionFailed: string;
  };

  questions: Record<
    AssessmentQuestionName,
    QuestionTranslation
  >;

  optionLabels: Record<
    string,
    string
  >;
};

export const supportedAssessmentLanguages: {
  code: AssessmentLanguage;
  label: string;
}[] = [
  {
    code: "en",
    label: "English",
  },
  {
    code: "kn",
    label: "ಕನ್ನಡ",
  },
  {
    code: "hi",
    label: "हिन्दी",
  },
];

export const assessmentTranslations: Record<
  AssessmentLanguage,
  AssessmentTranslation
> = {
  en: {
    languageName: "English",

    interface: {
      title:
        "AI Tinnitus Assessment",

      subtitle:
        "Structured Hearing Health Evaluation",

      language:
        "Language",

      question:
        "Question",

      of:
        "of",

      guidance:
        "Guidance",

      previous:
        "Previous",

      continue:
        "Continue",

      completeAssessment:
        "Complete Assessment",

      analysing:
        "Analysing...",

      requiredInformation:
        "Enter the required information",

      disclaimer:
        "This assessment is intended to support tinnitus evaluation. It does not provide a medical diagnosis and does not replace consultation with a qualified healthcare professional.",
    },

    validation: {
      required:
        "Please complete this field before continuing.",

      invalidNumber:
        "Please enter a valid numerical value.",

      minimumValue:
        "The minimum permitted value is",

      maximumValue:
        "The maximum permitted value is",

      invalidEmail:
        "Please enter a valid email address.",

      apiNotConfigured:
        "The backend API URL has not been configured.",

      sessionExpired:
        "Your session has expired. Please sign in again.",

      signInRequired:
        "Please sign in before submitting an assessment.",

      processingFailed:
        "The assessment could not be processed.",

      submissionFailed:
        "The assessment could not be submitted.",
    },

    questions: {
      patient_name: {
        question:
          "Patient Name",

        description:
          "The patient name identifies the person undergoing the assessment. It is required to associate the submitted responses and generated report with the correct patient record.",

        placeholder:
          "Enter the patient’s full name",
      },

      email: {
        question:
          "Email Address",

        description:
          "The email address identifies the registered patient account. It helps ensure that the assessment is associated with the correct authenticated user and their health records.",

        placeholder:
          "Enter the registered email address",
      },

      age: {
        question:
          "Age",

        description:
          "Age refers to the patient’s current age in completed years. This information is relevant because hearing sensitivity and tinnitus characteristics may vary across different age groups.",

        placeholder:
          "Enter age in completed years",
      },

      gender: {
        question:
          "Gender",

        description:
          "Gender is collected as part of the patient’s demographic information. It supports clinical and statistical evaluation of patterns that may differ between population groups.",
      },

      tinnitus_type: {
        question:
          "Tinnitus Type",

        description:
          "Tinnitus type describes the clinical characteristics or likely origin of the perceived sound. Identifying the appropriate category helps the system interpret symptoms and generate a more relevant assessment.",

        guidance:
          "Subjective tinnitus is perceived only by the patient, while pulsatile tinnitus is commonly experienced as a rhythmic sound that may follow the heartbeat.",
      },

      affected_ear: {
        question:
          "Affected Ear",

        description:
          "The affected ear indicates where the tinnitus sound is predominantly perceived. This information helps determine whether the condition is unilateral or bilateral and may support further clinical evaluation.",

        guidance:
          "Select Both when tinnitus is perceived in both ears or appears to originate centrally within the head.",
      },

      frequency_hz: {
        question:
          "Tinnitus Frequency (Hz)",

        description:
          "Tinnitus frequency represents the perceived pitch of the tinnitus sound and is measured in Hertz. It is generally determined through a tinnitus pitch-matching or audiological assessment.",

        guidance:
          "A lower value represents a lower-pitched sound, while a higher value represents a higher-pitched sound. Enter the measured clinical value in Hertz.",

        placeholder:
          "Enter the measured frequency",
      },

      loudness_db: {
        question:
          "Tinnitus Loudness (dB)",

        description:
          "Tinnitus loudness represents the perceived intensity of the tinnitus sound and is recorded in decibels. This value helps evaluate symptom intensity and its possible effect on daily functioning.",

        guidance:
          "Enter the loudness value obtained during a tinnitus loudness-matching or audiological assessment.",

        placeholder:
          "Enter the measured loudness",
      },

      hearing_loss: {
        question:
          "Hearing Loss Level",

        description:
          "Hearing loss level indicates the degree of reduced hearing ability identified during a hearing examination. This information is important because tinnitus frequently occurs together with hearing impairment.",

        guidance:
          "Select the level recorded in the most recent audiological report. Select None when no measurable hearing loss has been identified.",
      },

      thi_score: {
        question:
          "Tinnitus Handicap Inventory Score",

        description:
          "The Tinnitus Handicap Inventory score measures how tinnitus affects daily activities, emotional wellbeing and functional ability. It helps estimate the overall impact of tinnitus on the patient’s quality of life.",

        guidance:
          "Enter the total score obtained from the THI questionnaire. The accepted score range is 0 to 100.",

        placeholder:
          "Enter the THI score",
      },

      tfi_score: {
        question:
          "Tinnitus Functional Index Score",

        description:
          "The Tinnitus Functional Index score evaluates tinnitus severity and its effect on sleep, concentration, relaxation, emotional wellbeing and daily functioning. It may also be used to monitor changes over time.",

        guidance:
          "Enter the total score obtained from the TFI questionnaire. The accepted score range is 0 to 100.",

        placeholder:
          "Enter the TFI score",
      },

      hads_anxiety: {
        question:
          "HADS Anxiety Score",

        description:
          "The HADS Anxiety score represents the anxiety component of the Hospital Anxiety and Depression Scale. It is collected because anxiety may increase tinnitus-related distress and affect the patient’s ability to manage symptoms.",

        guidance:
          "Enter only the anxiety subscale score obtained from the HADS questionnaire. The accepted score range is 0 to 21.",

        placeholder:
          "Enter the anxiety subscale score",
      },

      hads_depression: {
        question:
          "HADS Depression Score",

        description:
          "The HADS Depression score represents the depression component of the Hospital Anxiety and Depression Scale. It helps assess whether emotional wellbeing may be affected alongside tinnitus symptoms.",

        guidance:
          "Enter only the depression subscale score obtained from the HADS questionnaire. The accepted score range is 0 to 21.",

        placeholder:
          "Enter the depression subscale score",
      },

      sleep_score: {
        question:
          "Sleep Assessment Score",

        description:
          "The sleep assessment score represents the quality of sleep and the presence of sleep disturbance. It is required because tinnitus may affect the ability to fall asleep, remain asleep or obtain adequate rest.",

        guidance:
          "Enter the total score recorded in the sleep assessment used by the healthcare provider.",

        placeholder:
          "Enter the recorded sleep score",
      },

      treatment: {
        question:
          "Current Tinnitus Management",

        description:
          "Current tinnitus management refers to the primary treatment or management approach presently being followed. This information helps the system consider the patient’s existing care while generating assessment results.",

        guidance:
          "Select Combined when the current care plan includes two or more management approaches.",
      },
    },

    optionLabels: {
      Male: "Male",
      Female: "Female",

      Subjective:
        "Subjective",

      Objective:
        "Objective",

      Pulsatile:
        "Pulsatile",

      Somatic:
        "Somatic",

      Sensorineural:
        "Sensorineural",

      Left: "Left",
      Right: "Right",
      Both: "Both",

      None: "None",
      Mild: "Mild",
      Moderate: "Moderate",
      Severe: "Severe",

      Medication:
        "Medication",

      CBT:
        "Cognitive Behavioural Therapy",

      "Sound Therapy":
        "Sound Therapy",

      "Hearing Aid":
        "Hearing Aid",

      "TMJ Therapy":
        "TMJ Therapy",

      Combined:
        "Combined Treatment",
    },
  },

  kn: {
    languageName: "ಕನ್ನಡ",

    interface: {
      title:
        "ಎಐ ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನ",

      subtitle:
        "ರಚನಾತ್ಮಕ ಶ್ರವಣ ಆರೋಗ್ಯ ಮೌಲ್ಯಮಾಪನ",

      language:
        "ಭಾಷೆ",

      question:
        "ಪ್ರಶ್ನೆ",

      of:
        "ರಲ್ಲಿ",

      guidance:
        "ಮಾರ್ಗದರ್ಶನ",

      previous:
        "ಹಿಂದಿನದು",

      continue:
        "ಮುಂದುವರಿಸಿ",

      completeAssessment:
        "ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಳಿಸಿ",

      analysing:
        "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",

      requiredInformation:
        "ಅಗತ್ಯ ಮಾಹಿತಿಯನ್ನು ನಮೂದಿಸಿ",

      disclaimer:
        "ಈ ಮೌಲ್ಯಮಾಪನವು ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಸಹಾಯ ಮಾಡುವ ಉದ್ದೇಶ ಹೊಂದಿದೆ. ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವನ್ನು ನೀಡುವುದಿಲ್ಲ ಮತ್ತು ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.",
    },

    validation: {
      required:
        "ಮುಂದುವರಿಸುವ ಮೊದಲು ಈ ಮಾಹಿತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",

      invalidNumber:
        "ಮಾನ್ಯವಾದ ಸಂಖ್ಯಾತ್ಮಕ ಮೌಲ್ಯವನ್ನು ನಮೂದಿಸಿ.",

      minimumValue:
        "ಅನುಮತಿಸಲಾದ ಕನಿಷ್ಠ ಮೌಲ್ಯ",

      maximumValue:
        "ಅನುಮತಿಸಲಾದ ಗರಿಷ್ಠ ಮೌಲ್ಯ",

      invalidEmail:
        "ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",

      apiNotConfigured:
        "ಬ್ಯಾಕೆಂಡ್ ಎಪಿಐ ವಿಳಾಸವನ್ನು ಸಂರಚಿಸಲಾಗಿಲ್ಲ.",

      sessionExpired:
        "ನಿಮ್ಮ ಸೆಷನ್ ಅವಧಿ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",

      signInRequired:
        "ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ.",

      processingFailed:
        "ಮೌಲ್ಯಮಾಪನವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",

      submissionFailed:
        "ಮೌಲ್ಯಮಾಪನವನ್ನು ಸಲ್ಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    },

    questions: {
      patient_name: {
        question:
          "ರೋಗಿಯ ಹೆಸರು",

        description:
          "ರೋಗಿಯ ಹೆಸರು ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಒಳಗಾಗುತ್ತಿರುವ ವ್ಯಕ್ತಿಯನ್ನು ಗುರುತಿಸುತ್ತದೆ. ಸಲ್ಲಿಸಿದ ಉತ್ತರಗಳು ಮತ್ತು ರಚಿಸಲಾದ ವರದಿಯನ್ನು ಸರಿಯಾದ ರೋಗಿಯ ದಾಖಲೆಯೊಂದಿಗೆ ಸಂಯೋಜಿಸಲು ಈ ಮಾಹಿತಿ ಅಗತ್ಯವಾಗಿದೆ.",

        placeholder:
          "ರೋಗಿಯ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
      },

      email: {
        question:
          "ಇಮೇಲ್ ವಿಳಾಸ",

        description:
          "ಇಮೇಲ್ ವಿಳಾಸವು ನೋಂದಾಯಿತ ರೋಗಿಯ ಖಾತೆಯನ್ನು ಗುರುತಿಸುತ್ತದೆ. ಮೌಲ್ಯಮಾಪನವನ್ನು ಸರಿಯಾದ ದೃಢೀಕೃತ ಬಳಕೆದಾರ ಮತ್ತು ಅವರ ಆರೋಗ್ಯ ದಾಖಲೆಗಳೊಂದಿಗೆ ಸಂಯೋಜಿಸಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

        placeholder:
          "ನೋಂದಾಯಿತ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
      },

      age: {
        question:
          "ವಯಸ್ಸು",

        description:
          "ವಯಸ್ಸು ಎಂದರೆ ರೋಗಿಯ ಪ್ರಸ್ತುತ ಪೂರ್ಣಗೊಂಡ ವರ್ಷಗಳ ವಯಸ್ಸು. ವಿಭಿನ್ನ ವಯೋಮಾನದವರಲ್ಲಿ ಶ್ರವಣ ಸಂವೇದನೆ ಮತ್ತು ಟಿನಿಟಸ್ ಲಕ್ಷಣಗಳು ಬದಲಾಗಬಹುದಾದ ಕಾರಣ ಈ ಮಾಹಿತಿ ಮುಖ್ಯವಾಗಿದೆ.",

        placeholder:
          "ಪೂರ್ಣಗೊಂಡ ವರ್ಷಗಳಲ್ಲಿ ವಯಸ್ಸನ್ನು ನಮೂದಿಸಿ",
      },

      gender: {
        question:
          "ಲಿಂಗ",

        description:
          "ರೋಗಿಯ ಜನಸಾಂಖ್ಯಿಕ ಮಾಹಿತಿಯ ಭಾಗವಾಗಿ ಲಿಂಗವನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ. ವಿಭಿನ್ನ ಜನಸಮೂಹಗಳ ನಡುವೆ ಬದಲಾಗಬಹುದಾದ ವೈದ್ಯಕೀಯ ಮತ್ತು ಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯ ಮಾದರಿಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
      },

      tinnitus_type: {
        question:
          "ಟಿನಿಟಸ್ ಪ್ರಕಾರ",

        description:
          "ಟಿನಿಟಸ್ ಪ್ರಕಾರವು ರೋಗಿಗೆ ಕೇಳಿಸುವ ಧ್ವನಿಯ ವೈದ್ಯಕೀಯ ಲಕ್ಷಣಗಳು ಅಥವಾ ಅದರ ಸಾಧ್ಯ ಮೂಲವನ್ನು ಸೂಚಿಸುತ್ತದೆ. ಸರಿಯಾದ ಪ್ರಕಾರವನ್ನು ಗುರುತಿಸುವುದು ಲಕ್ಷಣಗಳನ್ನು ಅರ್ಥೈಸಲು ಮತ್ತು ಸೂಕ್ತ ಮೌಲ್ಯಮಾಪನವನ್ನು ರಚಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

        guidance:
          "ವ್ಯಕ್ತಿನಿಷ್ಠ ಟಿನಿಟಸ್ ಧ್ವನಿಯನ್ನು ರೋಗಿಯೊಬ್ಬರು ಮಾತ್ರ ಕೇಳುತ್ತಾರೆ. ಪಲ್ಸಟೈಲ್ ಟಿನಿಟಸ್ ಸಾಮಾನ್ಯವಾಗಿ ಹೃದಯಬಡಿತವನ್ನು ಅನುಸರಿಸುವ ಲಯಬದ್ಧ ಧ್ವನಿಯಾಗಿ ಅನುಭವವಾಗುತ್ತದೆ.",
      },

      affected_ear: {
        question:
          "ಪರಿಣಾಮಿತ ಕಿವಿ",

        description:
          "ಪರಿಣಾಮಿತ ಕಿವಿ ಎಂದರೆ ಟಿನಿಟಸ್ ಧ್ವನಿ ಮುಖ್ಯವಾಗಿ ಯಾವ ಕಿವಿಯಲ್ಲಿ ಅನುಭವವಾಗುತ್ತದೆ ಎಂಬುದು. ಸಮಸ್ಯೆ ಒಂದು ಕಿವಿಯಲ್ಲಿದೆಯೇ ಅಥವಾ ಎರಡೂ ಕಿವಿಗಳಲ್ಲಿದೆಯೇ ಎಂಬುದನ್ನು ನಿರ್ಧರಿಸಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

        guidance:
          "ಎರಡೂ ಕಿವಿಗಳಲ್ಲಿ ಧ್ವನಿ ಕೇಳಿಸಿದರೆ ಅಥವಾ ತಲೆಯ ಮಧ್ಯಭಾಗದಿಂದ ಧ್ವನಿ ಬರುತ್ತಿರುವಂತೆ ಅನುಭವವಾದರೆ ಎರಡೂ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.",
      },

      frequency_hz: {
        question:
          "ಟಿನಿಟಸ್ ಆವರ್ತನ (Hz)",

        description:
          "ಟಿನಿಟಸ್ ಆವರ್ತನವು ರೋಗಿಗೆ ಕೇಳಿಸುವ ಧ್ವನಿಯ ಪಿಚ್ ಅನ್ನು ಸೂಚಿಸುತ್ತದೆ ಮತ್ತು ಅದನ್ನು ಹರ್ಟ್ಜ್‌ನಲ್ಲಿ ಅಳೆಯಲಾಗುತ್ತದೆ. ಇದನ್ನು ಸಾಮಾನ್ಯವಾಗಿ ಪಿಚ್ ಹೊಂದಾಣಿಕೆ ಅಥವಾ ಶ್ರವಣ ಪರೀಕ್ಷೆಯ ಮೂಲಕ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ.",

        guidance:
          "ಕಡಿಮೆ ಮೌಲ್ಯವು ಕಡಿಮೆ ಪಿಚ್‌ನ ಧ್ವನಿಯನ್ನು ಮತ್ತು ಹೆಚ್ಚಿನ ಮೌಲ್ಯವು ಹೆಚ್ಚಿನ ಪಿಚ್‌ನ ಧ್ವನಿಯನ್ನು ಸೂಚಿಸುತ್ತದೆ. ವೈದ್ಯಕೀಯ ಪರೀಕ್ಷೆಯಲ್ಲಿ ದಾಖಲಾದ ಮೌಲ್ಯವನ್ನು ನಮೂದಿಸಿ.",

        placeholder:
          "ಅಳೆಯಲಾದ ಆವರ್ತನವನ್ನು ನಮೂದಿಸಿ",
      },

      loudness_db: {
        question:
          "ಟಿನಿಟಸ್ ಧ್ವನಿ ತೀವ್ರತೆ (dB)",

        description:
          "ಟಿನಿಟಸ್ ಧ್ವನಿ ತೀವ್ರತೆಯು ರೋಗಿಗೆ ಕೇಳಿಸುವ ಧ್ವನಿಯ ಬಲವನ್ನು ಸೂಚಿಸುತ್ತದೆ ಮತ್ತು ಅದನ್ನು ಡೆಸಿಬೆಲ್‌ನಲ್ಲಿ ದಾಖಲಿಸಲಾಗುತ್ತದೆ. ಲಕ್ಷಣದ ತೀವ್ರತೆ ಮತ್ತು ದೈನಂದಿನ ಜೀವನದ ಮೇಲಿನ ಪರಿಣಾಮವನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

        guidance:
          "ಟಿನಿಟಸ್ ಧ್ವನಿ ಹೊಂದಾಣಿಕೆ ಅಥವಾ ಶ್ರವಣ ಪರೀಕ್ಷೆಯ ಮೂಲಕ ಪಡೆದ ಮೌಲ್ಯವನ್ನು ನಮೂದಿಸಿ.",

        placeholder:
          "ಅಳೆಯಲಾದ ಧ್ವನಿ ತೀವ್ರತೆಯನ್ನು ನಮೂದಿಸಿ",
      },

      hearing_loss: {
        question:
          "ಶ್ರವಣ ನಷ್ಟದ ಮಟ್ಟ",

        description:
          "ಶ್ರವಣ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಗುರುತಿಸಲಾದ ಕೇಳುವ ಸಾಮರ್ಥ್ಯದ ಕಡಿತದ ಪ್ರಮಾಣವನ್ನು ಶ್ರವಣ ನಷ್ಟದ ಮಟ್ಟ ಸೂಚಿಸುತ್ತದೆ. ಟಿನಿಟಸ್ ಸಾಮಾನ್ಯವಾಗಿ ಶ್ರವಣ ನಷ್ಟದೊಂದಿಗೆ ಕಾಣಿಸಿಕೊಳ್ಳುವುದರಿಂದ ಈ ಮಾಹಿತಿ ಮುಖ್ಯವಾಗಿದೆ.",

        guidance:
          "ಇತ್ತೀಚಿನ ಶ್ರವಣ ಪರೀಕ್ಷಾ ವರದಿಯಲ್ಲಿ ದಾಖಲಾದ ಮಟ್ಟವನ್ನು ಆರಿಸಿ. ಶ್ರವಣ ನಷ್ಟ ಕಂಡುಬಂದಿಲ್ಲದಿದ್ದರೆ ಇಲ್ಲ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.",
      },

      thi_score: {
        question:
          "ಟಿನಿಟಸ್ ಹ್ಯಾಂಡಿಕ್ಯಾಪ್ ಇನ್ವೆಂಟರಿ ಅಂಕ",

        description:
          "ಟಿನಿಟಸ್ ಹ್ಯಾಂಡಿಕ್ಯಾಪ್ ಇನ್ವೆಂಟರಿ ಅಂಕವು ಟಿನಿಟಸ್ ದೈನಂದಿನ ಚಟುವಟಿಕೆ, ಭಾವನಾತ್ಮಕ ಆರೋಗ್ಯ ಮತ್ತು ಕಾರ್ಯನಿರ್ವಹಣೆಯ ಮೇಲೆ ಬೀರುವ ಪರಿಣಾಮವನ್ನು ಅಳೆಯುತ್ತದೆ.",

        guidance:
          "THI ಪ್ರಶ್ನಾವಳಿಯಿಂದ ಪಡೆದ ಒಟ್ಟು ಅಂಕವನ್ನು ನಮೂದಿಸಿ. ಅನುಮತಿಸಲಾದ ಅಂಕಗಳ ವ್ಯಾಪ್ತಿ 0 ರಿಂದ 100.",

        placeholder:
          "THI ಅಂಕವನ್ನು ನಮೂದಿಸಿ",
      },

      tfi_score: {
        question:
          "ಟಿನಿಟಸ್ ಫಂಕ್ಷನಲ್ ಇಂಡೆಕ್ಸ್ ಅಂಕ",

        description:
          "ಟಿನಿಟಸ್ ಫಂಕ್ಷನಲ್ ಇಂಡೆಕ್ಸ್ ಅಂಕವು ಟಿನಿಟಸ್‌ನ ತೀವ್ರತೆ ಮತ್ತು ಅದು ನಿದ್ರೆ, ಏಕಾಗ್ರತೆ, ವಿಶ್ರಾಂತಿ, ಭಾವನಾತ್ಮಕ ಆರೋಗ್ಯ ಹಾಗೂ ದೈನಂದಿನ ಕಾರ್ಯಗಳ ಮೇಲೆ ಬೀರುವ ಪರಿಣಾಮವನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತದೆ.",

        guidance:
          "TFI ಪ್ರಶ್ನಾವಳಿಯಿಂದ ಪಡೆದ ಒಟ್ಟು ಅಂಕವನ್ನು ನಮೂದಿಸಿ. ಅನುಮತಿಸಲಾದ ಅಂಕಗಳ ವ್ಯಾಪ್ತಿ 0 ರಿಂದ 100.",

        placeholder:
          "TFI ಅಂಕವನ್ನು ನಮೂದಿಸಿ",
      },

      hads_anxiety: {
        question:
          "HADS ಆತಂಕ ಅಂಕ",

        description:
          "HADS ಆತಂಕ ಅಂಕವು ಆಸ್ಪತ್ರೆ ಆತಂಕ ಮತ್ತು ಖಿನ್ನತೆ ಮಾಪಕದ ಆತಂಕ ವಿಭಾಗವನ್ನು ಪ್ರತಿನಿಧಿಸುತ್ತದೆ. ಆತಂಕವು ಟಿನಿಟಸ್‌ನಿಂದ ಉಂಟಾಗುವ ತೊಂದರೆಯನ್ನು ಹೆಚ್ಚಿಸಬಹುದಾದ ಕಾರಣ ಈ ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.",

        guidance:
          "HADS ಪ್ರಶ್ನಾವಳಿಯಿಂದ ಪಡೆದ ಆತಂಕ ಉಪಮಾಪಕದ ಅಂಕವನ್ನು ಮಾತ್ರ ನಮೂದಿಸಿ. ಅನುಮತಿಸಲಾದ ಅಂಕಗಳ ವ್ಯಾಪ್ತಿ 0 ರಿಂದ 21.",

        placeholder:
          "ಆತಂಕ ಉಪಮಾಪಕದ ಅಂಕವನ್ನು ನಮೂದಿಸಿ",
      },

      hads_depression: {
        question:
          "HADS ಖಿನ್ನತೆ ಅಂಕ",

        description:
          "HADS ಖಿನ್ನತೆ ಅಂಕವು ಆಸ್ಪತ್ರೆ ಆತಂಕ ಮತ್ತು ಖಿನ್ನತೆ ಮಾಪಕದ ಖಿನ್ನತೆ ವಿಭಾಗವನ್ನು ಪ್ರತಿನಿಧಿಸುತ್ತದೆ. ಟಿನಿಟಸ್ ಜೊತೆಗೆ ರೋಗಿಯ ಭಾವನಾತ್ಮಕ ಆರೋಗ್ಯದ ಮೇಲೆ ಪರಿಣಾಮವಿದೆಯೇ ಎಂಬುದನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

        guidance:
          "HADS ಪ್ರಶ್ನಾವಳಿಯಿಂದ ಪಡೆದ ಖಿನ್ನತೆ ಉಪಮಾಪಕದ ಅಂಕವನ್ನು ಮಾತ್ರ ನಮೂದಿಸಿ. ಅನುಮತಿಸಲಾದ ಅಂಕಗಳ ವ್ಯಾಪ್ತಿ 0 ರಿಂದ 21.",

        placeholder:
          "ಖಿನ್ನತೆ ಉಪಮಾಪಕದ ಅಂಕವನ್ನು ನಮೂದಿಸಿ",
      },

      sleep_score: {
        question:
          "ನಿದ್ರೆ ಮೌಲ್ಯಮಾಪನ ಅಂಕ",

        description:
          "ನಿದ್ರೆ ಮೌಲ್ಯಮಾಪನ ಅಂಕವು ನಿದ್ರೆಯ ಗುಣಮಟ್ಟ ಮತ್ತು ನಿದ್ರೆ ಅಡಚಣೆಯನ್ನು ಪ್ರತಿನಿಧಿಸುತ್ತದೆ. ಟಿನಿಟಸ್ ನಿದ್ರೆಗೆ ಹೋಗುವುದು, ನಿರಂತರವಾಗಿ ನಿದ್ರಿಸುವುದು ಅಥವಾ ಸಾಕಷ್ಟು ವಿಶ್ರಾಂತಿ ಪಡೆಯುವುದನ್ನು ಪ್ರಭಾವಿಸಬಹುದಾದ ಕಾರಣ ಈ ಮಾಹಿತಿ ಅಗತ್ಯವಾಗಿದೆ.",

        guidance:
          "ಆರೋಗ್ಯ ವೃತ್ತಿಪರರು ಬಳಸಿದ ನಿದ್ರೆ ಮೌಲ್ಯಮಾಪನದಲ್ಲಿ ದಾಖಲಾದ ಒಟ್ಟು ಅಂಕವನ್ನು ನಮೂದಿಸಿ.",

        placeholder:
          "ದಾಖಲಾದ ನಿದ್ರೆ ಅಂಕವನ್ನು ನಮೂದಿಸಿ",
      },

      treatment: {
        question:
          "ಪ್ರಸ್ತುತ ಟಿನಿಟಸ್ ನಿರ್ವಹಣೆ",

        description:
          "ಪ್ರಸ್ತುತ ಟಿನಿಟಸ್ ನಿರ್ವಹಣೆ ಎಂದರೆ ಈಗ ಅನುಸರಿಸಲಾಗುತ್ತಿರುವ ಮುಖ್ಯ ಚಿಕಿತ್ಸೆ ಅಥವಾ ನಿರ್ವಹಣಾ ವಿಧಾನ. ಮೌಲ್ಯಮಾಪನ ಫಲಿತಾಂಶ ರಚಿಸುವಾಗ ರೋಗಿಯ ಪ್ರಸ್ತುತ ಆರೈಕೆಯನ್ನು ಪರಿಗಣಿಸಲು ಇದು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

        guidance:
          "ಪ್ರಸ್ತುತ ಆರೈಕೆ ಯೋಜನೆಯಲ್ಲಿ ಎರಡು ಅಥವಾ ಹೆಚ್ಚಿನ ನಿರ್ವಹಣಾ ವಿಧಾನಗಳಿದ್ದರೆ ಸಂಯೋಜಿತ ಚಿಕಿತ್ಸೆ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.",
      },
    },

    optionLabels: {
      Male: "ಪುರುಷ",
      Female: "ಮಹಿಳೆ",

      Subjective:
        "ವ್ಯಕ್ತಿನಿಷ್ಠ",

      Objective:
        "ವಸ್ತುನಿಷ್ಠ",

      Pulsatile:
        "ಪಲ್ಸಟೈಲ್",

      Somatic:
        "ಸೊಮ್ಯಾಟಿಕ್",

      Sensorineural:
        "ಸಂವೇದನ ನರ ಸಂಬಂಧಿತ",

      Left: "ಎಡ",
      Right: "ಬಲ",
      Both: "ಎರಡೂ",

      None: "ಇಲ್ಲ",
      Mild: "ಸೌಮ್ಯ",
      Moderate: "ಮಧ್ಯಮ",
      Severe: "ತೀವ್ರ",

      Medication:
        "ಔಷಧೋಪಚಾರ",

      CBT:
        "ಅರಿವಿನ ವರ್ತನಾ ಚಿಕಿತ್ಸೆ",

      "Sound Therapy":
        "ಧ್ವನಿ ಚಿಕಿತ್ಸೆ",

      "Hearing Aid":
        "ಶ್ರವಣ ಸಾಧನ",

      "TMJ Therapy":
        "TMJ ಚಿಕಿತ್ಸೆ",

      Combined:
        "ಸಂಯೋಜಿತ ಚಿಕಿತ್ಸೆ",
    },
  },

  hi: {
    languageName: "हिन्दी",

    interface: {
      title:
        "एआई टिनिटस मूल्यांकन",

      subtitle:
        "संरचित श्रवण स्वास्थ्य मूल्यांकन",

      language:
        "भाषा",

      question:
        "प्रश्न",

      of:
        "में से",

      guidance:
        "मार्गदर्शन",

      previous:
        "पिछला",

      continue:
        "आगे बढ़ें",

      completeAssessment:
        "मूल्यांकन पूरा करें",

      analysing:
        "विश्लेषण किया जा रहा है...",

      requiredInformation:
        "आवश्यक जानकारी दर्ज करें",

      disclaimer:
        "यह मूल्यांकन टिनिटस के आकलन में सहायता के लिए है। यह चिकित्सीय निदान प्रदान नहीं करता और योग्य स्वास्थ्य विशेषज्ञ के परामर्श का विकल्प नहीं है।",
    },

    validation: {
      required:
        "आगे बढ़ने से पहले इस जानकारी को पूरा करें।",

      invalidNumber:
        "कृपया एक मान्य संख्यात्मक मान दर्ज करें।",

      minimumValue:
        "न्यूनतम अनुमत मान है",

      maximumValue:
        "अधिकतम अनुमत मान है",

      invalidEmail:
        "कृपया एक मान्य ईमेल पता दर्ज करें।",

      apiNotConfigured:
        "बैकएंड एपीआई पता कॉन्फ़िगर नहीं किया गया है।",

      sessionExpired:
        "आपका सत्र समाप्त हो गया है। कृपया दोबारा साइन इन करें।",

      signInRequired:
        "मूल्यांकन जमा करने से पहले कृपया साइन इन करें।",

      processingFailed:
        "मूल्यांकन को संसाधित नहीं किया जा सका।",

      submissionFailed:
        "मूल्यांकन जमा नहीं किया जा सका।",
    },

    questions: {
      patient_name: {
        question:
          "रोगी का नाम",

        description:
          "रोगी का नाम मूल्यांकन कराने वाले व्यक्ति की पहचान करता है। जमा किए गए उत्तरों और तैयार की गई रिपोर्ट को सही रोगी रिकॉर्ड से जोड़ने के लिए यह जानकारी आवश्यक है।",

        placeholder:
          "रोगी का पूरा नाम दर्ज करें",
      },

      email: {
        question:
          "ईमेल पता",

        description:
          "ईमेल पता पंजीकृत रोगी खाते की पहचान करता है। यह सुनिश्चित करने में सहायता करता है कि मूल्यांकन सही प्रमाणित उपयोगकर्ता और उनके स्वास्थ्य रिकॉर्ड से जुड़ा हो।",

        placeholder:
          "पंजीकृत ईमेल पता दर्ज करें",
      },

      age: {
        question:
          "आयु",

        description:
          "आयु से तात्पर्य रोगी की पूर्ण वर्षों में वर्तमान आयु से है। यह जानकारी महत्वपूर्ण है क्योंकि श्रवण संवेदनशीलता और टिनिटस की विशेषताएँ विभिन्न आयु समूहों में अलग हो सकती हैं।",

        placeholder:
          "पूर्ण वर्षों में आयु दर्ज करें",
      },

      gender: {
        question:
          "लिंग",

        description:
          "लिंग को रोगी की जनसांख्यिकीय जानकारी के भाग के रूप में एकत्र किया जाता है। यह विभिन्न जनसंख्या समूहों के बीच भिन्न हो सकने वाले चिकित्सीय और सांख्यिकीय पैटर्न के मूल्यांकन में सहायता करता है।",
      },

      tinnitus_type: {
        question:
          "टिनिटस का प्रकार",

        description:
          "टिनिटस का प्रकार सुनाई देने वाली ध्वनि की चिकित्सीय विशेषताओं या उसके संभावित स्रोत को दर्शाता है। सही श्रेणी की पहचान लक्षणों को समझने और अधिक प्रासंगिक मूल्यांकन तैयार करने में सहायता करती है।",

        guidance:
          "सब्जेक्टिव टिनिटस केवल रोगी को सुनाई देता है, जबकि पल्सेटाइल टिनिटस सामान्यतः हृदय की धड़कन के साथ चलने वाली लयबद्ध ध्वनि के रूप में अनुभव होता है।",
      },

      affected_ear: {
        question:
          "प्रभावित कान",

        description:
          "प्रभावित कान से तात्पर्य उस कान से है जिसमें टिनिटस की ध्वनि मुख्य रूप से महसूस होती है। यह स्थिति के एक कान या दोनों कानों में होने का निर्धारण करने में सहायता करता है।",

        guidance:
          "यदि टिनिटस दोनों कानों में सुनाई देता है या ध्वनि सिर के मध्य से आती हुई महसूस होती है, तो दोनों विकल्प चुनें।",
      },

      frequency_hz: {
        question:
          "टिनिटस आवृत्ति (Hz)",

        description:
          "टिनिटस आवृत्ति सुनाई देने वाली ध्वनि की पिच को दर्शाती है और इसे हर्ट्ज में मापा जाता है। इसे सामान्यतः पिच मिलान या श्रवण परीक्षण के माध्यम से निर्धारित किया जाता है।",

        guidance:
          "कम मान कम पिच वाली ध्वनि और अधिक मान अधिक पिच वाली ध्वनि को दर्शाता है। चिकित्सीय परीक्षण में दर्ज मान को हर्ट्ज में दर्ज करें।",

        placeholder:
          "मापी गई आवृत्ति दर्ज करें",
      },

      loudness_db: {
        question:
          "टिनिटस ध्वनि तीव्रता (dB)",

        description:
          "टिनिटस ध्वनि तीव्रता सुनाई देने वाली ध्वनि की शक्ति को दर्शाती है और इसे डेसीबल में दर्ज किया जाता है। यह लक्षण की तीव्रता और दैनिक जीवन पर उसके प्रभाव का आकलन करने में सहायता करती है।",

        guidance:
          "टिनिटस ध्वनि मिलान या श्रवण परीक्षण से प्राप्त मान दर्ज करें।",

        placeholder:
          "मापी गई ध्वनि तीव्रता दर्ज करें",
      },

      hearing_loss: {
        question:
          "श्रवण हानि का स्तर",

        description:
          "श्रवण हानि का स्तर सुनने की क्षमता में उस कमी को दर्शाता है जिसकी पहचान श्रवण परीक्षण में की गई है। यह जानकारी महत्वपूर्ण है क्योंकि टिनिटस प्रायः श्रवण हानि के साथ पाया जाता है।",

        guidance:
          "नवीनतम श्रवण परीक्षण रिपोर्ट में दर्ज स्तर चुनें। यदि श्रवण हानि की पहचान नहीं हुई है, तो कोई नहीं चुनें।",
      },

      thi_score: {
        question:
          "टिनिटस हैंडीकैप इन्वेंटरी स्कोर",

        description:
          "टिनिटस हैंडीकैप इन्वेंटरी स्कोर दैनिक गतिविधियों, भावनात्मक स्वास्थ्य और कार्यक्षमता पर टिनिटस के प्रभाव को मापता है। यह रोगी के जीवन की गुणवत्ता पर समग्र प्रभाव का अनुमान लगाने में सहायता करता है।",

        guidance:
          "THI प्रश्नावली से प्राप्त कुल स्कोर दर्ज करें। स्वीकार्य स्कोर सीमा 0 से 100 है।",

        placeholder:
          "THI स्कोर दर्ज करें",
      },

      tfi_score: {
        question:
          "टिनिटस फंक्शनल इंडेक्स स्कोर",

        description:
          "टिनिटस फंक्शनल इंडेक्स स्कोर टिनिटस की गंभीरता और नींद, एकाग्रता, विश्राम, भावनात्मक स्वास्थ्य तथा दैनिक कार्यों पर उसके प्रभाव का मूल्यांकन करता है।",

        guidance:
          "TFI प्रश्नावली से प्राप्त कुल स्कोर दर्ज करें। स्वीकार्य स्कोर सीमा 0 से 100 है।",

        placeholder:
          "TFI स्कोर दर्ज करें",
      },

      hads_anxiety: {
        question:
          "HADS चिंता स्कोर",

        description:
          "HADS चिंता स्कोर अस्पताल चिंता और अवसाद मापनी के चिंता घटक को दर्शाता है। यह जानकारी इसलिए ली जाती है क्योंकि चिंता टिनिटस से संबंधित परेशानी को बढ़ा सकती है।",

        guidance:
          "HADS प्रश्नावली से प्राप्त केवल चिंता उपमापनी स्कोर दर्ज करें। स्वीकार्य स्कोर सीमा 0 से 21 है।",

        placeholder:
          "चिंता उपमापनी स्कोर दर्ज करें",
      },

      hads_depression: {
        question:
          "HADS अवसाद स्कोर",

        description:
          "HADS अवसाद स्कोर अस्पताल चिंता और अवसाद मापनी के अवसाद घटक को दर्शाता है। यह आकलन करने में सहायता करता है कि टिनिटस के साथ रोगी का भावनात्मक स्वास्थ्य प्रभावित हुआ है या नहीं।",

        guidance:
          "HADS प्रश्नावली से प्राप्त केवल अवसाद उपमापनी स्कोर दर्ज करें। स्वीकार्य स्कोर सीमा 0 से 21 है।",

        placeholder:
          "अवसाद उपमापनी स्कोर दर्ज करें",
      },

      sleep_score: {
        question:
          "नींद मूल्यांकन स्कोर",

        description:
          "नींद मूल्यांकन स्कोर नींद की गुणवत्ता और नींद में होने वाली बाधा को दर्शाता है। यह जानकारी आवश्यक है क्योंकि टिनिटस सोने, लगातार सोए रहने या पर्याप्त आराम प्राप्त करने की क्षमता को प्रभावित कर सकता है।",

        guidance:
          "स्वास्थ्य विशेषज्ञ द्वारा उपयोग किए गए नींद मूल्यांकन में दर्ज कुल स्कोर दर्ज करें।",

        placeholder:
          "दर्ज किया गया नींद स्कोर भरें",
      },

      treatment: {
        question:
          "वर्तमान टिनिटस प्रबंधन",

        description:
          "वर्तमान टिनिटस प्रबंधन से तात्पर्य उस प्रमुख उपचार या प्रबंधन विधि से है जिसका वर्तमान में पालन किया जा रहा है। यह मूल्यांकन परिणाम तैयार करते समय रोगी की मौजूदा देखभाल पर विचार करने में सहायता करता है।",

        guidance:
          "यदि वर्तमान देखभाल योजना में दो या अधिक प्रबंधन विधियाँ शामिल हैं, तो संयुक्त उपचार चुनें।",
      },
    },

    optionLabels: {
      Male: "पुरुष",
      Female: "महिला",

      Subjective:
        "सब्जेक्टिव",

      Objective:
        "ऑब्जेक्टिव",

      Pulsatile:
        "पल्सेटाइल",

      Somatic:
        "सोमैटिक",

      Sensorineural:
        "सेंसरीन्यूरल",

      Left: "बायाँ",
      Right: "दायाँ",
      Both: "दोनों",

      None: "कोई नहीं",
      Mild: "हल्का",
      Moderate: "मध्यम",
      Severe: "गंभीर",

      Medication:
        "दवा उपचार",

      CBT:
        "संज्ञानात्मक व्यवहार चिकित्सा",

      "Sound Therapy":
        "ध्वनि चिकित्सा",

      "Hearing Aid":
        "श्रवण यंत्र",

      "TMJ Therapy":
        "TMJ चिकित्सा",

      Combined:
        "संयुक्त उपचार",
    },
  },
};

export const getAssessmentTranslation = (
  language: AssessmentLanguage
) => {
  return assessmentTranslations[
    language
  ];
};