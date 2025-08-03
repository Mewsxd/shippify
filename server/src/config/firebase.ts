import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

//@ts-ignore
const serviceAccount = JSON.parse(process.env.PROD_FIRESTORE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
