import { Router } from "express";
import db from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const memberRows = await db.prepare("SELECT projectId FROM project_members WHERE userId = ?").all(req.user.id);
    const projectIds = memberRows.map(r => r.projectId);

    const projectCount = projectIds.length;
    if (projectCount === 0) {
      return res.json({
        projectCount: 0,
        totalTasks: 0,
        overdueTasks: 0,
        statusData: [
          { name: "To Do", value: 0, color: "#6b7280" },
          { name: "In Progress", value: 0, color: "#3b82f6" },
          { name: "Review", value: 0, color: "#f59e0b" },
          { name: "Done", value: 0, color: "#10b981" },
        ],
        myTasks: [],
      });
    }

    const placeholders = projectIds.map(() => "?").join(",");

    const totalTasks = (await db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE projectId IN (${placeholders})`).get(...projectIds)).count;
    const todoTasks = (await db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE projectId IN (${placeholders}) AND status = 'todo'`).get(...projectIds)).count;
    const inProgressTasks = (await db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE projectId IN (${placeholders}) AND status = 'in_progress'`).get(...projectIds)).count;
    const reviewTasks = (await db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE projectId IN (${placeholders}) AND status = 'review'`).get(...projectIds)).count;
    const doneTasks = (await db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE projectId IN (${placeholders}) AND status = 'done'`).get(...projectIds)).count;

    const overdueTasks = (await db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE projectId IN (${placeholders}) AND dueDate IS NOT NULL AND dueDate < datetime('now') AND status != 'done'`
    ).get(...projectIds)).count;

    const myTasks = await db.prepare(
      `SELECT * FROM tasks WHERE projectId IN (${placeholders}) AND assignedTo = ? AND status != 'done' ORDER BY dueDate ASC LIMIT 10`
    ).all(...projectIds, req.user.id);

    for (const task of myTasks) {
      task.project = await db.prepare("SELECT id, name FROM projects WHERE id = ?").get(task.projectId);
      delete task.projectId;
    }

    const statusData = [
      { name: "To Do", value: todoTasks, color: "#6b7280" },
      { name: "In Progress", value: inProgressTasks, color: "#3b82f6" },
      { name: "Review", value: reviewTasks, color: "#f59e0b" },
      { name: "Done", value: doneTasks, color: "#10b981" },
    ];

    res.json({ projectCount, totalTasks, overdueTasks, statusData, myTasks });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
