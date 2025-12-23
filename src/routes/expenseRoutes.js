const express = require("express");
const { body, validationResult } = require("express-validator");
const { pool } = require("../config/database");
const ExpenseService = require("../services/expenseService");
const CalculationUtils = require("../utils/calculations");

const router = express.Router();

router.post(
  "/",
  [
    body("groupId").isUUID(),
    body("description").notEmpty(),
    body("amount").isFloat({ min: 0.01 }),
    body("paidBy").isUUID(),
    body("splitType").isIn(["EQUAL", "EXACT", "PERCENTAGE"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { splitType, amount, splitBetween, splits } = req.body;

      let finalSplits;
      if (splitType === "EQUAL") {
        finalSplits = CalculationUtils.calculateEqualSplit(amount, splitBetween);
      } else if (splitType === "EXACT") {
        CalculationUtils.validateExactSplit(amount, splits);
        finalSplits = splits;
      } else {
        finalSplits = CalculationUtils.calculatePercentageSplit(amount, splits);
      }

      const expense = await ExpenseService.createExpense(client, req.body);
      await ExpenseService.createExpenseSplits(client, expense.id, finalSplits);

      await ExpenseService.updateBalances(
        client,
        req.body.groupId,
        req.body.paidBy,
        finalSplits
      );

      await client.query("COMMIT");
      res.status(201).json({ expense, splits: finalSplits });
    } catch (error) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  }
);
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const expenses = await ExpenseService.getGroupExpenses(
      groupId,
      limit,
      offset
    );

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
