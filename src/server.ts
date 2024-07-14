import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app";

const DB = process.env.DATABASE!;
(async () => {
  try {
    await mongoose.connect(DB);
    console.log(`Connected to MongoDB Database.`);
  } catch (err) {
    console.log(`Error connecting with MongoDB Database.`);
  }
})();

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
