import express, { type ErrorRequestHandler } from "express";
import { habitsRouter } from "./routes/habits.ts";
import { gamificationRouter } from "./routes/gamification.ts";
import { settingsRouter } from "./routes/settings.ts";

export const app = express();

app.use(express.json());
app.use("/habits", habitsRouter);
app.use("/gamification", gamificationRouter);
app.use("/settings", settingsRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
};
app.use(errorHandler);
