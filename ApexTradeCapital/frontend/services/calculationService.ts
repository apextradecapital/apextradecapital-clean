
const FEE_RATE = 0.05;
const FEE_CAP_HTG = 10000;

/**
 * Calculates the 5% accompaniment fee, capped at 10,000 HTG.
 * @param investmentAmountHTG The principal investment amount in HTG.
 * @returns The calculated fee in HTG.
 */
export const calculateAccompanimentFee = (investmentAmountHTG: number): number => {
  return Math.min(investmentAmountHTG * FEE_RATE, FEE_CAP_HTG);
};

/**
 * Calculates the total amount to be invested (principal + fee).
 * @param investmentAmountHTG The principal investment amount in HTG.
 * @returns The total investment amount in HTG.
 */
export const calculateTotalInvestment = (investmentAmountHTG: number): number => {
  return investmentAmountHTG + calculateAccompanimentFee(investmentAmountHTG);
};

/**
 * Calculates the total payout, which is 4x the total invested amount.
 * @param investmentAmountHTG The principal investment amount in HTG.
 * @returns The projected total payout in HTG.
 */
export const calculateExpectedPayout = (investmentAmountHTG: number): number => {
  return calculateTotalInvestment(investmentAmountHTG) * 4;
};

