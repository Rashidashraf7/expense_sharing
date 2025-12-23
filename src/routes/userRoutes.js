const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");

const router = express.Router();

router.post(
  "/",
  [
    body("email").isEmail(),
    body("name").notEmpty().trim(),
    body("phone").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, name, phone } = req.body;
      const result = await pool.query(
        "INSERT INTO users (email, name, phone) VALUES ($1,$2,$3) RETURNING *",
        [email, name, phone]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE id=$1",
      [req.params.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
