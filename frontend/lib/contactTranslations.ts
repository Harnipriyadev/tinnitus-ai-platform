export type ContactLanguage =
  | "en"
  | "kn"
  | "hi";

type ContactTranslation = {
  title: string;
  description: string;
  emailLabel: string;
  sendEmail: string;
};

export const contactTranslations: Record<
  ContactLanguage,
  ContactTranslation
> = {
  en: {
    title:
      "Contact Us",

    description:
      "Contact the support team for assistance with your account, assessment, consultation or platform access.",

    emailLabel:
      "Support Email",

    sendEmail:
      "Send Email",
  },

  kn: {
    title:
      "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",

    description:
      "ನಿಮ್ಮ ಖಾತೆ, ಮೌಲ್ಯಮಾಪನ, ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆ ಅಥವಾ ವೇದಿಕೆ ಪ್ರವೇಶಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಸಹಾಯಕ್ಕಾಗಿ ಬೆಂಬಲ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ.",

    emailLabel:
      "ಬೆಂಬಲ ಇಮೇಲ್",

    sendEmail:
      "ಇಮೇಲ್ ಕಳುಹಿಸಿ",
  },

  hi: {
    title:
      "हमसे संपर्क करें",

    description:
      "अपने खाते, मूल्यांकन, चिकित्सीय परामर्श या मंच तक पहुँच से संबंधित सहायता के लिए सहयोग टीम से संपर्क करें।",

    emailLabel:
      "सहयोग ईमेल",

    sendEmail:
      "ईमेल भेजें",
  },
};

export const getContactTranslation = (
  language: ContactLanguage
) => {
  return contactTranslations[
    language
  ];
};