export type TechnologyLanguage =
  | "en"
  | "kn"
  | "hi";

type TechnologyTranslation = {
  headingPrefix: string;
  headingHighlight: string;
  description: string;

  steps: {
    assessment: {
      title: string;
      description: string;
    };

    analysis: {
      title: string;
      description: string;
    };

    report: {
      title: string;
      description: string;
    };

    guidance: {
      title: string;
      description: string;
    };
  };
};

export const technologyTranslations: Record<
  TechnologyLanguage,
  TechnologyTranslation
> = {
  en: {
    headingPrefix:
      "How It",

    headingHighlight:
      "Works",

    description:
      "Complete four structured steps to receive an AI-assisted tinnitus assessment and personalised guidance.",

    steps: {
      assessment: {
        title:
          "Clinical Assessment",

        description:
          "Provide relevant hearing information, tinnitus characteristics and recognised assessment scores.",
      },

      analysis: {
        title:
          "AI-Assisted Analysis",

        description:
          "The submitted information is processed using the trained analytical model to identify relevant patterns.",
      },

      report: {
        title:
          "Assessment Report",

        description:
          "Receive a structured report containing the assessment outcome and supporting health information.",
      },

      guidance: {
        title:
          "Personalised Guidance",

        description:
          "Review appropriate management suggestions and consult a verified doctor when professional care is required.",
      },
    },
  },

  kn: {
    headingPrefix:
      "ಇದು ಹೇಗೆ",

    headingHighlight:
      "ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ",

    description:
      "ಎಐ ಸಹಾಯಕ ಟಿನಿಟಸ್ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಲು ನಾಲ್ಕು ರಚನಾತ್ಮಕ ಹಂತಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.",

    steps: {
      assessment: {
        title:
          "ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನ",

        description:
          "ಸಂಬಂಧಿತ ಶ್ರವಣ ಮಾಹಿತಿ, ಟಿನಿಟಸ್ ಲಕ್ಷಣಗಳು ಮತ್ತು ಮಾನ್ಯತೆ ಪಡೆದ ಮೌಲ್ಯಮಾಪನ ಅಂಕಗಳನ್ನು ಒದಗಿಸಿ.",
      },

      analysis: {
        title:
          "ಎಐ ಸಹಾಯಕ ವಿಶ್ಲೇಷಣೆ",

        description:
          "ಸಂಬಂಧಿತ ಮಾದರಿಗಳನ್ನು ಗುರುತಿಸಲು ಸಲ್ಲಿಸಿದ ಮಾಹಿತಿಯನ್ನು ತರಬೇತಿ ಪಡೆದ ವಿಶ್ಲೇಷಣಾ ಮಾದರಿಯ ಮೂಲಕ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತದೆ.",
      },

      report: {
        title:
          "ಮೌಲ್ಯಮಾಪನ ವರದಿ",

        description:
          "ಮೌಲ್ಯಮಾಪನ ಫಲಿತಾಂಶ ಮತ್ತು ಪೂರಕ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಒಳಗೊಂಡ ರಚನಾತ್ಮಕ ವರದಿಯನ್ನು ಪಡೆಯಿರಿ.",
      },

      guidance: {
        title:
          "ವೈಯಕ್ತಿಕ ಮಾರ್ಗದರ್ಶನ",

        description:
          "ಸೂಕ್ತ ನಿರ್ವಹಣಾ ಸಲಹೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ವೃತ್ತಿಪರ ಆರೈಕೆ ಅಗತ್ಯವಿದ್ದಾಗ ದೃಢೀಕೃತ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
      },
    },
  },

  hi: {
    headingPrefix:
      "यह कैसे",

    headingHighlight:
      "काम करता है",

    description:
      "एआई-सहायित टिनिटस मूल्यांकन और व्यक्तिगत मार्गदर्शन प्राप्त करने के लिए चार संरचित चरण पूरे करें।",

    steps: {
      assessment: {
        title:
          "चिकित्सीय मूल्यांकन",

        description:
          "संबंधित श्रवण जानकारी, टिनिटस की विशेषताएँ और मान्य मूल्यांकन स्कोर प्रदान करें।",
      },

      analysis: {
        title:
          "एआई-सहायित विश्लेषण",

        description:
          "संबंधित पैटर्न की पहचान करने के लिए जमा की गई जानकारी को प्रशिक्षित विश्लेषण मॉडल द्वारा संसाधित किया जाता है।",
      },

      report: {
        title:
          "मूल्यांकन रिपोर्ट",

        description:
          "मूल्यांकन परिणाम और सहायक स्वास्थ्य जानकारी वाली संरचित रिपोर्ट प्राप्त करें।",
      },

      guidance: {
        title:
          "व्यक्तिगत मार्गदर्शन",

        description:
          "उपयुक्त प्रबंधन सुझावों की समीक्षा करें और पेशेवर देखभाल आवश्यक होने पर सत्यापित डॉक्टर से परामर्श करें।",
      },
    },
  },
};

export const getTechnologyTranslation = (
  language: TechnologyLanguage
) => {
  return technologyTranslations[
    language
  ];
};