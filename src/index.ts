import { app } from "./app.ts";

const port = Number(process.env.PORT) || 3000;

app.listen(port, "127.0.0.1", () => {
  console.log(`HabitTrack API listening on 127.0.0.1:${port}`);
});
