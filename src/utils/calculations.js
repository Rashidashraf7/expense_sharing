class CalculationUtils {
  static calculateEqualSplit(amount, users) {
    const perPerson = Math.floor((amount / users.length) * 100) / 100;
    const splits = users.map((userId) => ({
      userId,
      amount: perPerson,
    }));

    const total = perPerson * users.length;
    const diff = Math.round((amount - total) * 100) / 100;
    if (diff !== 0) {
      splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;
    }

    return splits;
  }

  static validateExactSplit(amount, splits) {
    const total = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
    const diff = Math.abs(total - amount);
    if (diff > 0.01) {
      throw new Error(`Split amounts (${total}) don't match expense total (${amount})`);
    }
    return splits;
  }

  static calculatePercentageSplit(amount, splits) {
    const totalPercentage = splits.reduce((sum, split) => sum + parseFloat(split.percentage), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Percentages must sum to 100');
    }

    const result = [];
    let remaining = amount;

    splits.forEach((split, index) => {
      let splitAmount;
      if (index === splits.length - 1) {
        splitAmount = remaining;
      } else {
        splitAmount = Math.round((amount * split.percentage / 100) * 100) / 100;
        remaining = Math.round((remaining - splitAmount) * 100) / 100;
      }

      result.push({
        userId: split.userId,
        amount: splitAmount,
        percentage: split.percentage,
      });
    });

    return result;
  }

  static simplifyDebts(balances) {
    const netBalances = {};
    
    balances.forEach((balance) => {
      if (!netBalances[balance.user_id]) {
        netBalances[balance.user_id] = { 
          id: balance.user_id, 
          name: balance.user_name, 
          amount: 0 
        };
      }
      if (!netBalances[balance.owes_to_user_id]) {
        netBalances[balance.owes_to_user_id] = { 
          id: balance.owes_to_user_id, 
          name: balance.owes_to_name, 
          amount: 0 
        };
      }
      
      netBalances[balance.user_id].amount -= parseFloat(balance.amount);
      netBalances[balance.owes_to_user_id].amount += parseFloat(balance.amount);
    });

    const creditors = Object.values(netBalances)
      .filter(b => b.amount > 0.01)
      .sort((a, b) => b.amount - a.amount);
    
    const debtors = Object.values(netBalances)
      .filter(b => b.amount < -0.01)
      .map(b => ({ ...b, amount: -b.amount }))
      .sort((a, b) => b.amount - a.amount);

    const simplifiedDebts = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
      const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);
      
      simplifiedDebts.push({
        from: debtors[j].id,
        fromName: debtors[j].name,
        to: creditors[i].id,
        toName: creditors[i].name,
        amount: Math.round(settleAmount * 100) / 100,
      });

      creditors[i].amount -= settleAmount;
      debtors[j].amount -= settleAmount;

      if (creditors[i].amount < 0.01) i++;
      if (debtors[j].amount < 0.01) j++;
    }

    return simplifiedDebts;
  }
}

module.exports = CalculationUtils;