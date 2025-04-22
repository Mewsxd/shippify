import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// const serviceAccount = require("../../prod-sdk-key.json");
// console.log(process.env.PROD_FIRESTORE_KEY);
//@ts-ignore

const serviceAccount = JSON.parse(process.env.PROD_FIRESTORE_KEY || "{}");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
