export type SiteLanguage =
  | "en"
  | "kn"
  | "hi";

type SiteTranslation = {
  brand: {
    title: string;
    subtitle: string;
  };

  navigation: {
    home: string;
    features: string;
    technology: string;
    about: string;
    contact: string;
  };

  home: {
    badge: string;
    headingPrimary: string;
    headingSecondary: string;
    description: string;
    startAssessment: string;
    viewFeatures: string;

    assessmentTitle: string;
    assessmentDescription: string;

    therapyTitle: string;
    therapyDescription: string;

    securityTitle: string;
    securityDescription: string;
  };
};

export const siteTranslations: Record<
  SiteLanguage,
  SiteTranslation
> = {
  en: {
    brand: {
      title:
        "AI Tinnitus",

      subtitle:
        "Smart Hearing Care",
    },

    navigation: {
      home:
        "Home",

      features:
        "Features",

      technology:
        "Technology",

      about:
        "About",

      contact:
        "Contact",
    },

    home: {
      badge:
        "AI-Assisted Hearing Healthcare",

      headingPrimary:
        "AI",

      headingSecondary:
        "TINNITUS",

      description:
        "Experience a modern approach to hearing healthcare through structured tinnitus assessment, AI-assisted analysis and personalised therapeutic guidance.",

      startAssessment:
        "Start Assessment",

      viewFeatures:
        "View Features",

      assessmentTitle:
        "AI-Assisted Assessment",

      assessmentDescription:
        "Structured tinnitus analysis supported by artificial intelligence.",

      therapyTitle:
        "Personalised Guidance",

      therapyDescription:
        "Individual therapeutic recommendations based on assessment results.",

      securityTitle:
        "Secure Health Records",

      securityDescription:
        "Assessment information is protected through secure authentication and controlled access.",
    },
  },

  kn: {
    brand: {
      title:
        "ಎಐ ಟಿನಿಟಸ್",

      subtitle:
        "ಬುದ್ಧಿವಂತ ಶ್ರವಣ ಆರೈಕೆ",
    },

    navigation: {
      home:
        "ಮುಖಪುಟ",

      features:
        "ವೈಶಿಷ್ಟ್ಯಗಳು",

      technology:
        "ತಂತ್ರಜ್ಞಾನ",

      about:
        "ನಮ್ಮ ಬಗ್ಗೆ",

      contact:
        "ಸಂಪರ್ಕ",
    },

    home: {
      badge:
        "ಎಐ ಸಹಾಯಕ ಶ್ರವಣ ಆರೋಗ್ಯ ಸೇವೆ",

      headingPrimary:
        "ಎಐ",

      headingSecondary:
        "ಟಿನಿಟಸ್",

      description:
        "ರಚನಾತ್ಮಕ ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನ, ಎಐ ಸಹಾಯಕ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನದ ಮೂಲಕ ಆಧುನಿಕ ಶ್ರವಣ ಆರೋಗ್ಯ ಸೇವೆಯನ್ನು ಅನುಭವಿಸಿ.",

      startAssessment:
        "ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ",

      viewFeatures:
        "ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ನೋಡಿ",

      assessmentTitle:
        "ಎಐ ಸಹಾಯಕ ಮೌಲ್ಯಮಾಪನ",

      assessmentDescription:
        "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯ ಬೆಂಬಲದೊಂದಿಗೆ ರಚನಾತ್ಮಕ ಟಿನಿಟಸ್ ವಿಶ್ಲೇಷಣೆ.",

      therapyTitle:
        "ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನ",

      therapyDescription:
        "ಮೌಲ್ಯಮಾಪನ ಫಲಿತಾಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಶಿಫಾರಸುಗಳು.",

      securityTitle:
        "ಸುರಕ್ಷಿತ ಆರೋಗ್ಯ ದಾಖಲೆಗಳು",

      securityDescription:
        "ಮೌಲ್ಯಮಾಪನ ಮಾಹಿತಿಯನ್ನು ಸುರಕ್ಷಿತ ದೃಢೀಕರಣ ಮತ್ತು ನಿಯಂತ್ರಿತ ಪ್ರವೇಶದ ಮೂಲಕ ರಕ್ಷಿಸಲಾಗುತ್ತದೆ.",
    },
  },

  hi: {
    brand: {
      title:
        "एआई टिनिटस",

      subtitle:
        "स्मार्ट श्रवण देखभाल",
    },

    navigation: {
      home:
        "मुखपृष्ठ",

      features:
        "विशेषताएँ",

      technology:
        "तकनीक",

      about:
        "हमारे बारे में",

      contact:
        "संपर्क",
    },

    home: {
      badge:
        "एआई-सहायित श्रवण स्वास्थ्य सेवा",

      headingPrimary:
        "एआई",

      headingSecondary:
        "टिनिटस",

      description:
        "संरचित टिनिटस मूल्यांकन, एआई-सहायित विश्लेषण और व्यक्तिगत चिकित्सीय मार्गदर्शन के माध्यम से श्रवण स्वास्थ्य सेवा के आधुनिक दृष्टिकोण का अनुभव करें।",

      startAssessment:
        "मूल्यांकन शुरू करें",

      viewFeatures:
        "विशेषताएँ देखें",

      assessmentTitle:
        "एआई-सहायित मूल्यांकन",

      assessmentDescription:
        "कृत्रिम बुद्धिमत्ता द्वारा समर्थित संरचित टिनिटस विश्लेषण।",

      therapyTitle:
        "व्यक्तिगत मार्गदर्शन",

      therapyDescription:
        "मूल्यांकन परिणामों के आधार पर व्यक्तिगत चिकित्सीय सुझाव।",

      securityTitle:
        "सुरक्षित स्वास्थ्य रिकॉर्ड",

      securityDescription:
        "मूल्यांकन जानकारी को सुरक्षित प्रमाणीकरण और नियंत्रित पहुँच के माध्यम से संरक्षित किया जाता है।",
    },
  },
};

export const getSiteTranslation = (
  language: SiteLanguage
) => {
  return siteTranslations[
    language
  ];
};