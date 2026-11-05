require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT is invalid");
  await connectDB();
  app.listen(port, () => console.log(`API listening on port ${port}`));
}

start().catch((error) => {
  console.error("Unable to start API:", error);
  process.exitCode = 1;
});
