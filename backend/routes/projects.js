import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Project name is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }
      const { name, description } = req.body;
      const result = await db.prepare("INSERT INTO projects (name, description, createdBy) VALUES (?, ?, ?)").run(name, description || "", req.user.id);
      await db.prepare("INSERT INTO project_members (projectId, userId) VALUES (?, ?)").run(result.lastInsertRowid, req.user.id);
      const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
      project.members = await db.prepare("SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON u.id = pm.userId WHERE pm.projectId = ?").all(project.id);
      project.createdBy = await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(project.createdBy);
      res.status(201).json(project);
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const projects = await db.prepare(`
      SELECT p.* FROM projects p
      JOIN project_members pm ON pm.projectId = p.id
      WHERE pm.userId = ?
      ORDER BY p.updatedAt DESC
    `).all(req.user.id);
    for (const project of projects) {
      project.createdBy = await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(project.createdBy);
      project.members = await db.prepare("SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON u.id = pm.userId WHERE pm.projectId = ?").all(project.id);
    }
    res.json(projects);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", [param("id").isInt()], async (req, res) => {
  try {
    const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const membership = await db.prepare("SELECT userId FROM project_members WHERE projectId = ? AND userId = ?").get(project.id, req.user.id);
    if (!membership) return res.status(403).json({ error: "Not a member of this project" });
    project.createdBy = await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(project.createdBy);
    project.members = await db.prepare("SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON u.id = pm.userId WHERE pm.projectId = ?").all(project.id);
    res.json(project);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/:id",
  [param("id").isInt(), body("name").trim().notEmpty().withMessage("Project name is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
      const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only the creator or admin can update the project" });
      }
      await db.prepare("UPDATE projects SET name = ?, description = ?, updatedAt = datetime('now') WHERE id = ?")
        .run(req.body.name, req.body.description ?? project.description, project.id);
      const updated = await db.prepare("SELECT * FROM projects WHERE id = ?").get(project.id);
      updated.createdBy = await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(updated.createdBy);
      updated.members = await db.prepare("SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON u.id = pm.userId WHERE pm.projectId = ?").all(updated.id);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.delete("/:id", [param("id").isInt()], async (req, res) => {
  try {
    const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the creator or admin can delete the project" });
    }
    await db.prepare("DELETE FROM projects WHERE id = ?").run(project.id);
    res.json({ message: "Project deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/:id/members",
  [param("id").isInt(), body("email").isEmail().withMessage("Valid email is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
      const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.createdBy !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only the creator or admin can add members" });
      }
      const user = await db.prepare("SELECT id, name, email FROM users WHERE email = ?").get(req.body.email);
      if (!user) return res.status(404).json({ error: "User not found" });
      const existing = await db.prepare("SELECT * FROM project_members WHERE projectId = ? AND userId = ?").get(project.id, user.id);
      if (existing) return res.status(409).json({ error: "User is already a member" });
      await db.prepare("INSERT INTO project_members (projectId, userId) VALUES (?, ?)").run(project.id, user.id);
      const updated = await db.prepare("SELECT * FROM projects WHERE id = ?").get(project.id);
      updated.createdBy = await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(updated.createdBy);
      updated.members = await db.prepare("SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON u.id = pm.userId WHERE pm.projectId = ?").all(updated.id);
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.delete("/:id/members/:userId", [param("id").isInt(), param("userId").isInt()], async (req, res) => {
  try {
    const project = await db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the creator or admin can remove members" });
    }
    await db.prepare("DELETE FROM project_members WHERE projectId = ? AND userId = ?").run(project.id, req.params.userId);
    const updated = await db.prepare("SELECT * FROM projects WHERE id = ?").get(project.id);
    updated.createdBy = await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(updated.createdBy);
    updated.members = await db.prepare("SELECT u.id, u.name, u.email FROM project_members pm JOIN users u ON u.id = pm.userId WHERE pm.projectId = ?").all(updated.id);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
