require("dotenv").config();
require("reflect-metadata");

const { AppDataSource } = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

function getDatabaseHost() {
  try {
    return new URL(process.env.DATABASE_URL).hostname;
  } catch {
    return "MISSING_OR_INVALID";
  }
}

async function start() {
  try {
    console.log("DATABASE HOST:", getDatabaseHost());

    await AppDataSource.initialize();

    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(
        `Kristallball API listening on port ${PORT}`
      );
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();