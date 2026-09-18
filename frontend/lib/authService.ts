import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  setPersistence,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "./firebase";

export type UserRole =
  | "patient"
  | "caretaker"
  | "doctor"
  | "admin";

export type PublicRegistrationRole =
  | "patient"
  | "caretaker"
  | "doctor";

export type RoleVerificationStatus =
  | "not_required"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export type AuthenticatedUser = {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  role: UserRole;
  roleVerificationStatus?: RoleVerificationStatus;
  emailVerified?: boolean;
};

type UserResponse = {
  success: boolean;
  message?: string;
  user?: AuthenticatedUser;
};

type MigrationResponse =
  UserResponse & {
    customToken?: string;
    migrationRequired?: boolean;
  };

type AuthenticationError =
  Error & {
    code?: string;
  };

const createAuthenticationError = (
  code: string,
  message: string
): AuthenticationError => {
  const error = new Error(
    message
  ) as AuthenticationError;

  error.code = code;

  return error;
};

const clearStoredAuthentication =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );
  };

const storeAuthenticatedUser = (
  user: AuthenticatedUser
) => {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  /*
   * Remove the obsolete custom JWT used by
   * previous versions of the application.
   */
  localStorage.removeItem(
    "token"
  );

  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );
};

const getApiUrl = () => {
  const apiUrl =
    process.env
      .NEXT_PUBLIC_API_URL
      ?.replace(
        /\/+$/,
        ""
      );

  if (!apiUrl) {
    throw new Error(
      "The backend API URL is not configured"
    );
  }

  return apiUrl;
};

const readResponse = async <T>(
  response: Response
): Promise<T> => {
  const text =
    await response.text();

  let data:
    T & {
      message?: string;
    };

  try {
    data = text
      ? JSON.parse(text)
      : ({} as T & {
          message?: string;
        });
  } catch {
    throw new Error(
      "The server returned an invalid response"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "The authentication request failed"
    );
  }

  return data;
};

const syncFirebaseProfile =
  async (
    idToken: string,
    fullName?: string
  ) => {
    const response =
      await fetch(
        `${getApiUrl()}/api/auth/firebase-profile`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            idToken,

            ...(fullName
              ? {
                  fullName,
                }
              : {}),
          }),
        }
      );

    const data =
      await readResponse<UserResponse>(
        response
      );

    if (!data.user) {
      throw new Error(
        "User profile was not received"
      );
    }

    return data.user;
  };

const completeMigration =
  async (
    idToken: string
  ) => {
    const response =
      await fetch(
        `${getApiUrl()}/api/auth/complete-migration`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },
        }
      );

    const data =
      await readResponse<UserResponse>(
        response
      );

    if (!data.user) {
      throw new Error(
        "Authenticated user profile was not received"
      );
    }

    return data.user;
  };

const sendVerificationAndSignOut =
  async () => {
    const firebaseUser =
      auth.currentUser;

    if (!firebaseUser) {
      throw new Error(
        "Firebase authentication was not completed"
      );
    }

    try {
      await sendEmailVerification(
        firebaseUser
      );
    } finally {
      await signOut(auth);

      clearStoredAuthentication();
    }

    throw createAuthenticationError(
      "auth/email-not-verified",
      "Your email address is not verified. We sent you a new verification email. Verify your email before logging in."
    );
  };

const finishFirebaseLogin =
  async ({
    fullName,
    sendVerificationIfNeeded =
      false,
  }: {
    fullName?: string;
    sendVerificationIfNeeded?: boolean;
  } = {}) => {
    await auth.authStateReady();

    const firebaseUser =
      auth.currentUser;

    if (!firebaseUser) {
      throw new Error(
        "Firebase authentication was not completed"
      );
    }

    /*
     * Reload the Firebase user so verification
     * completed in another tab is recognized.
     */
    await reload(
      firebaseUser
    );

    const refreshedUser =
      auth.currentUser;

    if (!refreshedUser) {
      throw new Error(
        "Firebase authentication was not completed"
      );
    }

    /*
     * Email/password users must verify their
     * email before entering the application.
     */
    if (
      !refreshedUser.emailVerified
    ) {
      if (
        sendVerificationIfNeeded
      ) {
        await sendVerificationAndSignOut();
      }

      await signOut(auth);

      clearStoredAuthentication();

      throw createAuthenticationError(
        "auth/email-not-verified",
        "Verify your email address before logging in. Check your inbox and spam folder for the verification email."
      );
    }

    const idToken =
      await refreshedUser.getIdToken(
        true
      );

    /*
     * Synchronize the Firebase identity
     * with the MongoDB profile.
     */
    await syncFirebaseProfile(
      idToken,
      fullName
    );

    /*
     * Retrieve the final MongoDB profile,
     * including its verified application role.
     */
    const user =
      await completeMigration(
        idToken
      );

    storeAuthenticatedUser(
      user
    );

    return user;
  };

const shouldAttemptMigration = (
  error: unknown
) => {
  const code = (
    error as {
      code?: string;
    }
  )?.code;

  return [
    "auth/invalid-credential",
    "auth/user-not-found",
    "auth/wrong-password",
  ].includes(code || "");
};

export const loginWithEmail =
  async ({
    email,
    password,
    remember,
  }: {
    email: string;
    password: string;
    remember: boolean;
  }) => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    await setPersistence(
      auth,
      remember
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    try {
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      return await finishFirebaseLogin();
    } catch (firebaseError) {
      /*
       * Never attempt migration when the
       * Firebase email is unverified.
       */
      if (
        (
          firebaseError as AuthenticationError
        ).code ===
        "auth/email-not-verified"
      ) {
        throw firebaseError;
      }

      if (
        !shouldAttemptMigration(
          firebaseError
        )
      ) {
        throw firebaseError;
      }
    }

    /*
     * Firebase login failed. Check whether
     * this is an older MongoDB account that
     * needs Firebase migration.
     */
    const response =
      await fetch(
        `${getApiUrl()}/api/auth/migrate-login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email:
              normalizedEmail,

            password,
          }),
        }
      );

    let migrationData:
      MigrationResponse;

    try {
      migrationData =
        await readResponse<MigrationResponse>(
          response
        );
    } catch (migrationError) {
      const message =
        migrationError instanceof Error
          ? migrationError.message
          : "";

      if (
        message
          .toLowerCase()
          .includes(
            "already uses firebase authentication"
          )
      ) {
        throw createAuthenticationError(
          "auth/invalid-credential",
          "Incorrect email or password. Use Forgot Password to create a new password."
        );
      }

      throw migrationError;
    }

    if (
      !migrationData.customToken
    ) {
      throw new Error(
        "Firebase migration token was not received"
      );
    }

    await signInWithCustomToken(
      auth,
      migrationData.customToken
    );

    /*
     * Migrated users must verify their
     * Firebase email before continuing.
     */
    return finishFirebaseLogin({
      sendVerificationIfNeeded:
        true,
    });
  };

export const loginWithGoogle =
  async (
    remember = true
  ) => {
    await setPersistence(
      auth,
      remember
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    await signInWithPopup(
      auth,
      googleProvider
    );

    return finishFirebaseLogin();
  };

const recordRegistrationIntent =
  async ({
    idToken,
    fullName,
    requestedRole,
  }: {
    idToken: string;
    fullName: string;
    requestedRole: PublicRegistrationRole;
  }) => {
    const response =
      await fetch(
        `${getApiUrl()}/api/auth/registration-intent`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            idToken,
            fullName,
            requestedRole,
          }),
        }
      );

    return readResponse<UserResponse>(
      response
    );
  };

export const registerWithEmail =
  async ({
    fullName,
    email,
    password,
    requestedRole,
  }: {
    fullName: string;
    email: string;
    password: string;
    requestedRole: PublicRegistrationRole;
  }) => {
    const normalizedName =
      fullName.trim();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    await setPersistence(
      auth,
      browserSessionPersistence
    );

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

    try {
      await updateProfile(
        credential.user,
        {
          displayName:
            normalizedName,
        }
      );

      const idToken =
        await credential.user.getIdToken(
          true
        );

      /*
       * Store the selected public role on the
       * backend before the user signs out.
       */
      await recordRegistrationIntent({
        idToken,
        fullName:
          normalizedName,
        requestedRole,
      });

      await sendEmailVerification(
        credential.user
      );

      /*
       * Registration does not create an
       * authenticated application session.
       * The user must verify their email
       * and then log in.
       */
      await signOut(auth);

      clearStoredAuthentication();

      return {
        user: {
          _id:
            credential.user.uid,

          fullName:
            normalizedName,

          email:
            credential.user
              .email ||
            normalizedEmail,

          profilePicture:
            credential.user
              .photoURL ||
            "",

          role:
            requestedRole,

          emailVerified:
            false,
        },

        verificationEmailSent:
          true,

        doctorVerificationRequired:
          requestedRole ===
          "doctor",
      };
    } catch (error) {
      await signOut(
        auth
      ).catch(() => {
        /*
         * Preserve the original
         * registration error.
         */
      });

      clearStoredAuthentication();

      throw error;
    }
  };

export const getFirebaseIdToken =
  async (
    forceRefresh = false
  ) => {
    await auth.authStateReady();

    const firebaseUser =
      auth.currentUser;

    if (!firebaseUser) {
      throw createAuthenticationError(
        "auth/user-not-authenticated",
        "You are not authenticated"
      );
    }

    await reload(
      firebaseUser
    );

    const refreshedUser =
      auth.currentUser;

    if (!refreshedUser) {
      throw createAuthenticationError(
        "auth/user-not-authenticated",
        "You are not authenticated"
      );
    }

    /*
     * Protect authenticated frontend API
     * requests from unverified accounts.
     */
    if (
      !refreshedUser.emailVerified
    ) {
      await signOut(auth);

      clearStoredAuthentication();

      throw createAuthenticationError(
        "auth/email-not-verified",
        "Verify your email address before using this feature."
      );
    }

    return refreshedUser.getIdToken(
      forceRefresh
    );
  };

export const authenticatedFetch =
  async (
    input:
      | RequestInfo
      | URL,

    init:
      RequestInit = {}
  ) => {
    const sendRequest =
      async (
        forceRefresh: boolean
      ) => {
        const idToken =
          await getFirebaseIdToken(
            forceRefresh
          );

        const headers =
          new Headers(
            init.headers
          );

        headers.set(
          "Authorization",
          `Bearer ${idToken}`
        );

        return fetch(input, {
          ...init,
          headers,
        });
      };

    let response =
      await sendRequest(
        false
      );

    /*
     * Retry once with a new token if
     * the backend rejects an expired token.
     */
    if (
      response.status ===
      401
    ) {
      response =
        await sendRequest(
          true
        );
    }

    return response;
  };

export const resendVerificationEmail =
  async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      throw createAuthenticationError(
        "auth/missing-credentials",
        "Enter your email and password to resend the verification email."
      );
    }

    await setPersistence(
      auth,
      browserSessionPersistence
    );

    const credential =
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

    try {
      await reload(
        credential.user
      );

      if (
        credential.user
          .emailVerified
      ) {
        throw createAuthenticationError(
          "auth/email-already-verified",
          "Your email is already verified. You can log in now."
        );
      }

      await sendEmailVerification(
        credential.user
      );

      return {
        success: true,

        message:
          "A new verification email was sent. Check your inbox and spam folder.",
      };
    } finally {
      await signOut(auth);

      clearStoredAuthentication();
    }
  };

export const logoutUser =
  async () => {
    await signOut(auth);

    clearStoredAuthentication();

    if (
      typeof window !==
      "undefined"
    ) {
      localStorage.removeItem(
        "prediction"
      );
    }
  };

export const getAuthenticationErrorMessage =
  (
    error: unknown
  ) => {
    const firebaseError =
      error as {
        code?: string;
        message?: string;
      };

    switch (
      firebaseError.code
    ) {
      case "auth/invalid-email":
        return "Enter a valid email address.";

      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";

      case "auth/email-not-verified":
        return (
          firebaseError.message ||
          "Verify your email address before logging in."
        );

      case "auth/email-already-verified":
        return "Your email is already verified. You can log in now.";

      case "auth/missing-credentials":
        return "Enter your email and password.";

      case "auth/email-already-in-use":
        return "An account already exists with this email.";

      case "auth/weak-password":
        return "Choose a stronger password.";

      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";

      case "auth/popup-blocked":
        return "Allow popups and try Google sign-in again.";

      case "auth/too-many-requests":
        return "Too many attempts. Wait before trying again.";

      case "auth/network-request-failed":
        return "Unable to connect. Check your internet connection.";

      case "auth/unauthorized-domain":
        return "This website is not authorized in Firebase.";

      case "auth/user-not-authenticated":
        return "Your session has ended. Please log in again.";

      default:
        return (
          firebaseError.message ||
          "Authentication failed. Please try again."
        );
    }
  };
