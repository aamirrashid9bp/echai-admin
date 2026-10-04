// Automatic business logic and calculations for echaii

/**
 * Total Revenue = Cups Sold × Selling Price Per Cup
 */
export const calculateTotalRevenue = (cupsSold, pricePerCup) => {
  const cups = parseInt(cupsSold, 10) || 0;
  const price = parseFloat(pricePerCup) || 0;
  return cups * price;
};

/**
 * Total Purchase = Cups Purchased × Purchase Price Per Cup
 */
export const calculateTotalPurchase = (cupsPurchased, pricePerCup) => {
  const cups = parseInt(cupsPurchased, 10) || 0;
  const price = parseFloat(pricePerCup) || 0;
  return cups * price;
};

/**
 * Closing Stock = Opening Stock + Purchased Cups - Sold Cups - Wastage
 */
export const calculateClosingStock = (openingStock, purchasedCups, soldCups, wastage) => {
  const opening = parseInt(openingStock, 10) || 0;
  const purchased = parseInt(purchasedCups, 10) || 0;
  const sold = parseInt(soldCups, 10) || 0;
  const waste = parseInt(wastage, 10) || 0;
  return Math.max(0, opening + purchased - sold - waste);
};

/**
 * Net Profit = Total Revenue - Total Expenses
 */
export const calculateNetProfit = (revenue, expenses) => {
  const rev = parseFloat(revenue) || 0;
  const exp = parseFloat(expenses) || 0;
  return rev - exp;
};

/**
 * Profit Margin = (Net Profit / Total Revenue) × 100
 */
export const calculateProfitMargin = (netProfit, revenue) => {
  const profit = parseFloat(netProfit) || 0;
  const rev = parseFloat(revenue) || 0;
  if (rev <= 0) return 0;
  return (profit / rev) * 100;
};
