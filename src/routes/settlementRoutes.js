const express = require("express");
const { body, validationResult } = require("express-validator");
const SettlementService = require("../services/settlementService");

const router = express.Router();

/**
 * POST /settlements
 * Record a settlement (payment)
 */
router.post(
  "/",
  [
    body("groupId").isUUID(),
    body("fromUserId").isUUID(),
    body("toUserId").isUUID(),
    body("amount").isFloat({ min: 0.01 }),
    body("notes").optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { groupId, fromUserId, toUserId, amount, notes } = req.body;

      const settlement = await SettlementService.recordSettlement(
        groupId,
        fromUserId,
        toUserId,
        amount,
        notes
      );

      res.status(201).json(settlement);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /settlements/group/:groupId
 * Get settlement history
 */
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await SettlementService.getSettlementHistory(
      groupId,
      limit,
      offset
    );

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
