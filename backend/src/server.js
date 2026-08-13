const { AppDataSource } = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Kristallball API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
