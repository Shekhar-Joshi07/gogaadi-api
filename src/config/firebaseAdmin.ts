import admin from "firebase-admin";

let initialized = false;

const getRequiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required Firebase Admin environment variable: ${key}`);
  }

  return value;
};

export const initializeFirebaseAdmin = () => {
  if (initialized) {
    return admin.app();
  }

  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = getRequiredEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  initialized = true;

  return admin.app();
};

export const getFirebaseAdminAuth = () => {
  if (!initialized) {
    initializeFirebaseAdmin();
  }

  return admin.auth();
};
