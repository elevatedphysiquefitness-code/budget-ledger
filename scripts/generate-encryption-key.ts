import crypto from "node:crypto";

const key = crypto.randomBytes(32).toString("base64");
console.log("Add this to .env.local as ENCRYPTION_KEY:\n");
console.log(`ENCRYPTION_KEY=${key}`);
