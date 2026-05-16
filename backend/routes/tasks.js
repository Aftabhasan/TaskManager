import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("project").isInt().withMessage("Valid project ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { title, description, status, priority, dueDate, assignedTo, project: projectId } = req.body;

      const member = db.prepare("SELECT userId FROM project_members WHERE projectId = ? AND userId = ?").get(projectId, req.user.id);
      if (!member) return res.status(403).json({ error: "Not a member of this project" });

      const result = db.prepare(
        "INSERT INTO tasks (title, description, status, priority, dueDate, projectId, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(title, description || "", status || "todo", priority || "medium", dueDate || null, projectId, assignedTo || null, req.user.id);

      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
      if (task.assignedTo) task.assignedTo = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.assignedTo);
      task.createdBy = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.createdBy);
      task.project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(task.projectId);
      delete task.projectId;
      res.status(201).json(task);
    } catch {
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    let tasks;
    if (req.query.project) {
      const member = db.prepare("SELECT userId FROM project_members WHERE projectId = ? AND userId = ?").get(req.query.project, req.user.id);
      if (!member) return res.status(403).json({ error: "Not a member of this project" });
      tasks = db.prepare("SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt DESC").all(req.query.project);
    } else {
      const projectIds = db.prepare("SELECT projectId FROM project_members WHERE userId = ?").all(req.user.id).map(r => r.projectId);
      if (projectIds.length === 0) return res.json([]);
      tasks = db.prepare(`SELECT * FROM tasks WHERE projectId IN (${projectIds.map(() => "?").join(",")}) ORDER BY createdAt DESC`).all(...projectIds);
    }

    if (req.query.status) tasks = tasks.filter(t => t.status === req.query.status);
    if (req.query.assignedTo) tasks = tasks.filter(t => t.assignedTo == req.query.assignedTo);

    for (const task of tasks) {
      if (task.assignedTo) task.assignedTo = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.assignedTo);
      task.createdBy = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.createdBy);
      task.project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(task.projectId);
      delete task.projectId;
    }
    res.json(tasks);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", [param("id").isInt()], async (req, res) => {
  try {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const member = db.prepare("SELECT userId FROM project_members WHERE projectId = ? AND userId = ?").get(task.projectId, req.user.id);
    if (!member) return res.status(403).json({ error: "Not a member of this project" });
    if (task.assignedTo) task.assignedTo = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.assignedTo);
    task.createdBy = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(task.createdBy);
    task.project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(task.projectId);
    delete task.projectId;
    res.json(task);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", [param("id").isInt()], async (req, res) => {
  try {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const member = db.prepare("SELECT userId FROM project_members WHERE projectId = ? AND userId = ?").get(task.projectId, req.user.id);
    if (!member) return res.status(403).json({ error: "Not a member of this project" });

    const allowed = ["title", "description", "status", "priority", "dueDate", "assignedTo"];
    for (const field of allowed) {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    }

    db.prepare(
      "UPDATE tasks SET title=?, description=?, status=?, priority=?, dueDate=?, assignedTo=?, updatedAt=datetime('now') WHERE id=?"
    ).run(task.title, task.description, task.status, task.priority, task.dueDate, task.assignedTo, task.id);

    const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(task.id);
    if (updated.assignedTo) updated.assignedTo = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(updated.assignedTo);
    updated.createdBy = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(updated.createdBy);
    updated.project = db.prepare("SELECT id, name FROM projects WHERE id = ?").get(updated.projectId);
    delete updated.projectId;
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", [param("id").isInt()], async (req, res) => {
  try {
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const member = db.prepare("SELECT userId FROM project_members WHERE projectId = ? AND userId = ?").get(task.projectId, req.user.id);
    if (!member) return res.status(403).json({ error: "Not a member of this project" });
    if (task.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the creator or admin can delete tasks" });
    }
    db.prepare("DELETE FROM tasks WHERE id = ?").run(task.id);
    res.json({ message: "Task deleted" });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
