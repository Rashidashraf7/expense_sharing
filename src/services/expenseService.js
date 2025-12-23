const { pool } = require('../config/database');

class ExpenseService {
  static async createExpense(client, expenseData) {
    const { groupId, description, amount, currency, paidBy, splitType } = expenseData;

    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, description, amount, currency, paid_by, split_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [groupId, description, amount, currency, paidBy, splitType]
    );

    return expenseResult.rows[0];
  }

  static async createExpenseSplits(client, expenseId, splits) {
    const values = splits.map((split) => [
      expenseId,
      split.userId,
      split.amount,
      split.percentage || null,
    ]);

    const query = `
      INSERT INTO expense_splits (expense_id, user_id, amount, percentage)
      VALUES ${values.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ')}
      RETURNING *
    `;

    const flatValues = values.flat();
    const result = await client.query(query, flatValues);
    return result.rows;
  }

  static async updateBalances(client, groupId, paidBy, splits) {
    for (const split of splits) {
      if (split.userId !== paidBy) {
        await this.updateBalance(client, groupId, split.userId, paidBy, parseFloat(split.amount));
      }
    }
  }

  static async updateBalance(client, groupId, userId, owesToUserId, amount) {
    const reverseResult = await client.query(
      `SELECT * FROM balances 
       WHERE group_id = $1 AND user_id = $2 AND owes_to_user_id = $3`,
      [groupId, owesToUserId, userId]
    );

    if (reverseResult.rows.length > 0) {
      const reverseBalance = reverseResult.rows[0];
      const reverseAmount = parseFloat(reverseBalance.amount);

      if (reverseAmount >= amount) {
        const newAmount = reverseAmount - amount;
        if (newAmount < 0.01) {
          await client.query('DELETE FROM balances WHERE id = $1', [reverseBalance.id]);
        } else {
          await client.query(
            'UPDATE balances SET amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newAmount, reverseBalance.id]
          );
        }
      } else {
        await client.query('DELETE FROM balances WHERE id = $1', [reverseBalance.id]);
        const newAmount = amount - reverseAmount;
        await client.query(
          `INSERT INTO balances (group_id, user_id, owes_to_user_id, amount)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (group_id, user_id, owes_to_user_id)
           DO UPDATE SET amount = balances.amount + $4, updated_at = CURRENT_TIMESTAMP`,
          [groupId, userId, owesToUserId, newAmount]
        );
      }
    } else {
      await client.query(
        `INSERT INTO balances (group_id, user_id, owes_to_user_id, amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (group_id, user_id, owes_to_user_id)
         DO UPDATE SET amount = balances.amount + $4, updated_at = CURRENT_TIMESTAMP`,
        [groupId, userId, owesToUserId, amount]
      );
    }
  }

  static async getGroupExpenses(groupId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT e.*, u.name as paid_by_name,
              json_agg(json_build_object(
                'userId', es.user_id,
                'amount', es.amount,
                'percentage', es.percentage
              )) as splits
       FROM expenses e
       JOIN users u ON e.paid_by = u.id
       LEFT JOIN expense_splits es ON e.id = es.expense_id
       WHERE e.group_id = $1
       GROUP BY e.id, u.name
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    return result.rows;
  }
}

module.exports = ExpenseService;