export type AuthLanguage =
  | "en"
  | "kn"
  | "hi";

type AuthTranslation = {
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    forgotPassword: string;
    requiredFields: string;
    login: string;
    loggingIn: string;
    or: string;
    continueWithGoogle: string;
    connectingGoogle: string;
    noAccount: string;
    signUp: string;
    loginFailed: string;
    googleLoginFailed: string;
  };
};

export const authTranslations: Record<
  AuthLanguage,
  AuthTranslation
> = {
  en: {
    login: {
      title:
        "Welcome Back",

      subtitle:
        "Sign in to your AI Tinnitus account",

      email:
        "Email Address",

      password:
        "Password",

      forgotPassword:
        "Forgot Password?",

      requiredFields:
        "Please enter your email address and password.",

      login:
        "Login",

      loggingIn:
        "Securing Account...",

      or:
        "OR",

      continueWithGoogle:
        "Continue with Google",

      connectingGoogle:
        "Connecting to Google...",

      noAccount:
        "Do not have an account?",

      signUp:
        "Sign Up",

      loginFailed:
        "Unable to sign in. Verify your credentials and try again.",

      googleLoginFailed:
        "Unable to sign in with Google. Please try again.",
    },
  },

  kn: {
    login: {
      title:
        "ಮತ್ತೆ ಸ್ವಾಗತ",

      subtitle:
        "ನಿಮ್ಮ ಎಐ ಟಿನಿಟಸ್ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",

      email:
        "ಇಮೇಲ್ ವಿಳಾಸ",

      password:
        "ಪಾಸ್‌ವರ್ಡ್",

      forgotPassword:
        "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?",

      requiredFields:
        "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ.",

      login:
        "ಲಾಗಿನ್",

      loggingIn:
        "ಖಾತೆಯನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ...",

      or:
        "ಅಥವಾ",

      continueWithGoogle:
        "Google ಮೂಲಕ ಮುಂದುವರಿಸಿ",

      connectingGoogle:
        "Google ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...",

      noAccount:
        "ಖಾತೆ ಇಲ್ಲವೇ?",

      signUp:
        "ನೋಂದಾಯಿಸಿ",

      loginFailed:
        "ಸೈನ್ ಇನ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",

      googleLoginFailed:
        "Google ಮೂಲಕ ಸೈನ್ ಇನ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    },
  },

  hi: {
    login: {
      title:
        "पुनः स्वागत है",

      subtitle:
        "अपने एआई टिनिटस खाते में साइन इन करें",

      email:
        "ईमेल पता",

      password:
        "पासवर्ड",

      forgotPassword:
        "पासवर्ड भूल गए?",

      requiredFields:
        "कृपया अपना ईमेल पता और पासवर्ड दर्ज करें।",

      login:
        "लॉगिन",

      loggingIn:
        "खाता सुरक्षित रूप से खोला जा रहा है...",

      or:
        "या",

      continueWithGoogle:
        "Google के साथ जारी रखें",

      connectingGoogle:
        "Google से जोड़ा जा रहा है...",

      noAccount:
        "क्या आपका खाता नहीं है?",

      signUp:
        "साइन अप करें",

      loginFailed:
        "साइन इन नहीं किया जा सका। अपनी जानकारी जाँचें और पुनः प्रयास करें।",

      googleLoginFailed:
        "Google के साथ साइन इन नहीं किया जा सका। कृपया पुनः प्रयास करें।",
    },
  },
};

export const getAuthTranslation = (
  language: AuthLanguage
) => {
  return authTranslations[
    language
  ];
};