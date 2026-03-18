import dotenv from "dotenv";

import app from "./app";
import { connectToMongo } from "./config/mongo";

dotenv.config();

const port = Number(process.env.PORT || 4000);

const startServer = async () => {
  await connectToMongo();

  app.listen(port, () => {
    console.log(`GoGaadi backend listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start GoGaadi backend", error);
  process.exit(1);
});
