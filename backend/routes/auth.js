import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { generateToken, authenticate } from "../middleware/auth.js";

const router = Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { name, email, password } = req.body;
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return res.status(409).json({ error: "Email already in use" });
      }
      const hashed = await bcrypt.hash(password, 12);
      const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashed);
      const user = db.prepare("SELECT id, name, email, role, createdAt FROM users WHERE id = ?").get(result.lastInsertRowid);
      const token = generateToken(user.id);
      res.status(201).json({ user, token });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { email, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = generateToken(user.id);
      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, token });
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
