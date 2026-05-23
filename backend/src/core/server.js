import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { loadModules } from "./module-loader.js";
import { errorHandler } from "../shared/http/errors.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

await loadModules(app);

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", loadedAt: new Date().toISOString() });
});

app.use(errorHandler);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
