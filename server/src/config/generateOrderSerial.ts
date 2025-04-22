import { db } from "../config/firebase";
import catchAsync from "../utils/catchAsync";
import { FieldValue } from "firebase-admin/firestore";

export default async function generateOrderSerial(): Promise<string> {
  const counterRef = db.collection("admin").doc("counter");
  let currentValue = 0;

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    if (!doc.exists) {
      throw new Error("Counter document does not exist.");
    }

    currentValue = doc.data()?.value ?? 0;
    transaction.update(counterRef, { value: FieldValue.increment(1) });
  });

  return String(currentValue);
}
