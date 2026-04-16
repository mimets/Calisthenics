export function calcFinancials(lordo) {
  const total = Math.max(Number(lordo) || 0, 0);
  const netto = total / 1.22;
  const iva = total - netto;

  return {
    lordo: Math.round(total * 100) / 100,
    netto: Math.round(netto * 100) / 100,
    iva: Math.round(iva * 100) / 100,
  };
}

export function getExpenseTotals(expenses) {
  return (expenses || []).reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
}

export function getGymTotals(clients, expenses = []) {
  const totalLordo = clients.reduce((sum, client) => sum + (Number(client.price) || 0), 0);
  const revenue = calcFinancials(totalLordo);
  const totalExpenses = getExpenseTotals(expenses);

  return {
    ...revenue,
    expenses: Math.round(totalExpenses * 100) / 100,
    balance: Math.round((revenue.netto - totalExpenses) * 100) / 100,
  };
}

export function getGrandTotals(gyms) {
  const totalLordo = gyms.reduce((sum, gym) => {
    return sum + gym.clients.reduce((clientSum, client) => clientSum + (Number(client.price) || 0), 0);
  }, 0);
  const totalExpenses = gyms.reduce((sum, gym) => {
    return sum + getExpenseTotals(gym.expenses || []);
  }, 0);
  const revenue = calcFinancials(totalLordo);

  return {
    ...revenue,
    expenses: Math.round(totalExpenses * 100) / 100,
    balance: Math.round((revenue.netto - totalExpenses) * 100) / 100,
    totalClients: gyms.reduce((sum, gym) => sum + gym.clients.length, 0),
    totalGyms: gyms.length,
  };
}
