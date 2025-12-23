const { pool } = require('../config/database');
const CalculationUtils = require('../utils/calculations');

class BalanceService {
  static async getGroupBalances(groupId) {
    const result = await pool.query(
      `SELECT 
        b.user_id,
        u1.name as user_name,
        b.owes_to_user_id,
        u2.name as owes_to_name,
        b.amount
       FROM balances b
       JOIN users u1 ON b.user_id = u1.id
       JOIN users u2 ON b.owes_to_user_id = u2.id
       WHERE b.group_id = $1
       ORDER BY b.user_id, b.amount DESC`,
      [groupId]
    );

    const balancesByUser = {};
    
    result.rows.forEach((row) => {
      if (!balancesByUser[row.user_id]) {
        balancesByUser[row.user_id] = {
          userId: row.user_id,
          userName: row.user_name,
          totalOwing: 0,
          totalOwed: 0,
          details: [],
        };
      }

      balancesByUser[row.user_id].totalOwing += parseFloat(row.amount);
      balancesByUser[row.user_id].details.push({
        owesTo: row.owes_to_user_id,
        owesToName: row.owes_to_name,
        amount: parseFloat(row.amount),
      });
    });

    result.rows.forEach((row) => {
      if (!balancesByUser[row.owes_to_user_id]) {
        balancesByUser[row.owes_to_user_id] = {
          userId: row.owes_to_user_id,
          userName: row.owes_to_name,
          totalOwing: 0,
          totalOwed: 0,
          details: [],
        };
      }
      balancesByUser[row.owes_to_user_id].totalOwed += parseFloat(row.amount);
    });

    Object.values(balancesByUser).forEach((user) => {
      user.netBalance = user.totalOwed - user.totalOwing;
      user.totalOwing = Math.round(user.totalOwing * 100) / 100;
      user.totalOwed = Math.round(user.totalOwed * 100) / 100;
      user.netBalance = Math.round(user.netBalance * 100) / 100;
    });

    return Object.values(balancesByUser);
  }

  static async getSimplifiedDebts(groupId) {
    const result = await pool.query(
      `SELECT b.*, u1.name as user_name, u2.name as owes_to_name
       FROM balances b
       JOIN users u1 ON b.user_id = u1.id
       JOIN users u2 ON b.owes_to_user_id = u2.id
       WHERE b.group_id = $1`,
      [groupId]
    );

    return CalculationUtils.simplifyDebts(result.rows);
  }
}

module.exports = BalanceService;