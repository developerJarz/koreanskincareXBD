import mongoose, { Schema, type Model } from "mongoose";
import { refreshModelInDev } from "./dev-refresh";

/** Atomic sequence numbers (invoice numbers). */
interface CounterDocument {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDocument>(
  { _id: { type: String, required: true }, seq: { type: Number, default: 0 } },
  { versionKey: false },
);

refreshModelInDev("Counter");

export const Counter: Model<CounterDocument> =
  mongoose.models.Counter || mongoose.model<CounterDocument>("Counter", counterSchema);

/** Returns the next number in the named sequence (1, 2, 3…), safe under concurrent requests. */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc!.seq;
}
