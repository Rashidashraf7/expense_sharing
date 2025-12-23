const express = require("express");
const BalanceService = require("../services/balanceService");

const router = express.Router();

router.get("/group/:groupId", async (req, res) => {
  try {
    const balances = await BalanceService.getGroupBalances(req.params.groupId);
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
