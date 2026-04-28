import mongoose from "mongoose";
import { DATABASE_URL } from "./env";

const connect = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      dbName: "kost-db",
    });

    return Promise.resolve("Database connected!");
  } catch (error) {
    return Promise.reject("Database connection failed!");
  }
};

export default connect;
