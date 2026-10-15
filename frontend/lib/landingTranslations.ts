
export type LandingLanguage =
  | "en"
  | "kn"
  | "hi";

type LandingTranslation = {
  features: {
    headingPrefix: string;
    headingHighlight: string;
    description: string;

    assessmentTitle: string;
    assessmentDescription: string;

    therapyTitle: string;
    therapyDescription: string;

    reportsTitle: string;
    reportsDescription: string;
  };
};

export const landingTranslations: Record<
  LandingLanguage,
  LandingTranslation
> = {
  en: {
    features: {
      headingPrefix:
        "Why Choose",

      headingHighlight:
        "AI Tinnitus?",

      description:
        "Access structured tinnitus assessment, personalised therapeutic guidance and securely managed health information through one integrated platform.",

      assessmentTitle:
        "AI-Assisted Assessment",

      assessmentDescription:
        "Structured assessment information is analysed with artificial intelligence to support tinnitus evaluation.",

      therapyTitle:
        "Personalised Guidance",

      therapyDescription:
        "Receive therapeutic guidance based on individual symptoms, assessment scores and hearing-related information.",

      reportsTitle:
        "Protected Reports",

      reportsDescription:
        "Assessment reports are protected through authenticated access and role-based authorisation.",
    },
  },

  kn: {
    features: {
      headingPrefix:
        "ಏಕೆ ಆಯ್ಕೆ ಮಾಡಬೇಕು",

      headingHighlight:
        "ಎಐ ಟಿನಿಟಸ್?",

      description:
        "ಒಂದೇ ಸಮಗ್ರ ವೇದಿಕೆಯ ಮೂಲಕ ರಚನಾತ್ಮಕ ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನ, ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ವಹಿಸಲಾದ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಿರಿ.",

      assessmentTitle:
        "ಎಐ ಸಹಾಯಕ ಮೌಲ್ಯಮಾಪನ",

      assessmentDescription:
        "ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಸಹಾಯ ಮಾಡಲು ರಚನಾತ್ಮಕ ಮೌಲ್ಯಮಾಪನ ಮಾಹಿತಿಯನ್ನು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯ ಮೂಲಕ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತದೆ.",

      therapyTitle:
        "ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನ",

      therapyDescription:
        "ವೈಯಕ್ತಿಕ ಲಕ್ಷಣಗಳು, ಮೌಲ್ಯಮಾಪನ ಅಂಕಗಳು ಮತ್ತು ಶ್ರವಣ ಸಂಬಂಧಿತ ಮಾಹಿತಿಯ ಆಧಾರದ ಮೇಲೆ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.",

      reportsTitle:
        "ರಕ್ಷಿತ ವರದಿಗಳು",

      reportsDescription:
        "ದೃಢೀಕೃತ ಪ್ರವೇಶ ಮತ್ತು ಪಾತ್ರ ಆಧಾರಿತ ಅನುಮತಿಯ ಮೂಲಕ ಮೌಲ್ಯಮಾಪನ ವರದಿಗಳನ್ನು ರಕ್ಷಿಸಲಾಗುತ್ತದೆ.",
    },
  },

  hi: {
    features: {
      headingPrefix:
        "क्यों चुनें",

      headingHighlight:
        "एआई टिनिटस?",

      description:
        "एकीकृत मंच के माध्यम से संरचित टिनिटस मूल्यांकन, व्यक्तिगत चिकित्सीय मार्गदर्शन और सुरक्षित रूप से प्रबंधित स्वास्थ्य जानकारी प्राप्त करें।",

      assessmentTitle:
        "एआई-सहायित मूल्यांकन",

      assessmentDescription:
        "टिनिटस मूल्यांकन में सहायता के लिए संरचित मूल्यांकन जानकारी का कृत्रिम बुद्धिमत्ता द्वारा विश्लेषण किया जाता है।",

      therapyTitle:
        "व्यक्तिगत मार्गदर्शन",

      therapyDescription:
        "व्यक्तिगत लक्षणों, मूल्यांकन स्कोर और श्रवण-संबंधी जानकारी के आधार पर चिकित्सीय मार्गदर्शन प्राप्त करें।",

      reportsTitle:
        "संरक्षित रिपोर्ट",

      reportsDescription:
        "मूल्यांकन रिपोर्ट को प्रमाणित पहुँच और भूमिका-आधारित अनुमति के माध्यम से सुरक्षित रखा जाता है।",
    },
  },
};

export const getLandingTranslation = (
  language: LandingLanguage
) => {
  return landingTranslations[
    language
  ];
};