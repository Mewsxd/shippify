import { db } from "../config/firebase";
import catchAsync from "../utils/catchAsync";
import { FieldValue } from "firebase-admin/firestore";

export default async function generateOrderSerial(): Promise<string> {
  const counterRef = db.collection("admin").doc("counter"); // Reference to the counter document in Firestore
  let currentValue = 0;

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef); // Fetch the current counter document within the transaction
    if (!doc.exists) {
      throw new Error("Counter document does not exist.");
    }

    currentValue = doc.data()?.value ?? 0; // Read the current value, defaulting to 0 if undefined
    transaction.update(counterRef, { value: FieldValue.increment(1) }); // Increment the counter atomically
  });

  return String(currentValue);
}
