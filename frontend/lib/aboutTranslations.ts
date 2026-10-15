export type AboutLanguage =
  | "en"
  | "kn"
  | "hi";

type AboutTranslation = {
  title: string;
  description: string;
  clinicalNotice: string;
};

export const aboutTranslations: Record<
  AboutLanguage,
  AboutTranslation
> = {
  en: {
    title:
      "About AI Tinnitus",

    description:
      "AI Tinnitus is an intelligent hearing healthcare platform designed to support patients through structured tinnitus assessment, AI-assisted analysis, personalised therapeutic guidance and access to verified medical professionals.",

    clinicalNotice:
      "The platform supports informed healthcare decisions but does not replace diagnosis, treatment or consultation provided by a qualified healthcare professional.",
  },

  kn: {
    title:
      "ಎಐ ಟಿನಿಟಸ್ ಬಗ್ಗೆ",

    description:
      "ಎಐ ಟಿನಿಟಸ್ ರಚನಾತ್ಮಕ ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನ, ಎಐ ಸಹಾಯಕ ವಿಶ್ಲೇಷಣೆ, ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ದೃಢೀಕೃತ ವೈದ್ಯಕೀಯ ವೃತ್ತಿಪರರ ಸಂಪರ್ಕದ ಮೂಲಕ ರೋಗಿಗಳಿಗೆ ಬೆಂಬಲ ನೀಡಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಬುದ್ಧಿವಂತ ಶ್ರವಣ ಆರೋಗ್ಯ ವೇದಿಕೆಯಾಗಿದೆ.",

    clinicalNotice:
      "ಈ ವೇದಿಕೆಯು ತಿಳುವಳಿಕೆಯುಳ್ಳ ಆರೋಗ್ಯ ನಿರ್ಧಾರಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಆದರೆ ಇದು ಅರ್ಹ ಆರೋಗ್ಯ ವೃತ್ತಿಪರರು ನೀಡುವ ರೋಗನಿರ್ಣಯ, ಚಿಕಿತ್ಸೆ ಅಥವಾ ಸಮಾಲೋಚನೆಗೆ ಪರ್ಯಾಯವಲ್ಲ.",
  },

  hi: {
    title:
      "एआई टिनिटस के बारे में",

    description:
      "एआई टिनिटस एक बुद्धिमान श्रवण स्वास्थ्य मंच है, जिसे संरचित टिनिटस मूल्यांकन, एआई-सहायित विश्लेषण, व्यक्तिगत चिकित्सीय मार्गदर्शन और सत्यापित चिकित्सा विशेषज्ञों तक पहुँच के माध्यम से रोगियों की सहायता के लिए बनाया गया है।",

    clinicalNotice:
      "यह मंच सूचित स्वास्थ्य निर्णयों में सहायता करता है, लेकिन योग्य स्वास्थ्य विशेषज्ञ द्वारा प्रदान किए गए निदान, उपचार या परामर्श का विकल्प नहीं है।",
  },
};

export const getAboutTranslation = (
  language: AboutLanguage
) => {
  return aboutTranslations[
    language
  ];
};