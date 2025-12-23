const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");

const router = express.Router();

router.post(
  "/",
  [
    body("name").notEmpty().trim(),
    body("createdBy").isUUID(),
    body("members").isArray({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { name, description, createdBy, members } = req.body;

      const groupResult = await client.query(
        "INSERT INTO groups (name, description, created_by) VALUES ($1,$2,$3) RETURNING *",
        [name, description, createdBy]
      );

      const group = groupResult.rows[0];

      for (const userId of members) {
        await client.query(
          "INSERT INTO group_members (group_id, user_id) VALUES ($1,$2)",
          [group.id, userId]
        );
      }

      await client.query("COMMIT");
      res.status(201).json(group);
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }
);

router.get("/user/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT g.* FROM groups g JOIN group_members gm ON g.id=gm.group_id WHERE gm.user_id=$1",
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post(
  "/:groupId/members",
  [
    body("userId").isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { groupId } = req.params;
      const { userId } = req.body;

      await pool.query(
        "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
        [groupId, userId]
      );

      res.status(201).json({ message: "Member added successfully" });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "User already in group" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);


module.exports = router;
