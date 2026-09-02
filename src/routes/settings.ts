import { Router } from "express";
import { prisma } from "../db.ts";

export const settingsRouter = Router();

settingsRouter.post("/reset", async (req, res, next) => {
  // Requiring a JSON content-type blocks simple cross-site form CSRF: browsers
  // can't set this content-type on a plain <form> POST, so an attacker page
  // can't trigger this destructive reset without a JS fetch, which CORS blocks.
  // req.is() only recognizes a type when a body is present, so this request
  // (which has none) is checked against the raw header instead.
  if (!req.headers["content-type"]?.startsWith("application/json")) {
    res.status(415).json({ error: "Content-Type must be application/json" });
    return;
  }
  try {
    await prisma.$transaction([
      prisma.completion.deleteMany(),
      prisma.habit.deleteMany(),
      prisma.unlockedBadge.deleteMany(),
      prisma.weeklyChallenge.deleteMany(),
      prisma.profile.deleteMany(),
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
