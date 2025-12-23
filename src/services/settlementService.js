const { pool } = require('../config/database');
const ExpenseService = require('./expenseService');

class SettlementService {
  static async recordSettlement(groupId, fromUserId, toUserId, amount, notes) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const settlementResult = await client.query(
        `INSERT INTO settlements (group_id, from_user_id, to_user_id, amount, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [groupId, fromUserId, toUserId, amount, notes]
      );

      await ExpenseService.updateBalance(client, groupId, fromUserId, toUserId, -amount);

      await client.query('COMMIT');
      return settlementResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getSettlementHistory(groupId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT s.*, 
              u1.name as from_user_name,
              u2.name as to_user_name
       FROM settlements s
       JOIN users u1 ON s.from_user_id = u1.id
       JOIN users u2 ON s.to_user_id = u2.id
       WHERE s.group_id = $1
       ORDER BY s.settled_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    return result.rows;
  }
}

module.exports = SettlementService;