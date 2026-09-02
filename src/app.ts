import express, { type ErrorRequestHandler } from "express";
import { habitsRouter } from "./routes/habits.ts";

export const app = express();

app.use(express.json());
app.use("/habits", habitsRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
};
app.use(errorHandler);
