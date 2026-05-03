import express from "express";
import cookieParser from "cookie-parser";
import router from "./routes/api";
import connect from "./utils/database";
import { connectRedis } from "./utils/redis";
import cors from "cors";

async function init() {
  try {
    const app = express();
    const PORT = 3000;

    await connect();
    console.log("Database connected!");

    await connectRedis();

    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use("/api", router);

    app.get("/", (req, res) => {
      res.status(200).json({ message: "Server Menyala" });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}
init();
