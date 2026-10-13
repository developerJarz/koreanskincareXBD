import mongoose from "mongoose";

/**
 * During `next dev`, editing a schema file re-runs it, but Mongoose still holds the model it
 * compiled from the old schema, so new fields are silently dropped and old validation rules
 * keep applying. Call this before compiling a model so the edited schema always takes effect.
 * Production runs each model file once, so there it does nothing.
 */
export function refreshModelInDev(name: string) {
  if (process.env.NODE_ENV !== "production" && mongoose.models[name]) {
    mongoose.deleteModel(name);
  }
}
