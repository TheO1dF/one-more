// The bank still pays for events and tools; each table must earn its own stake.
export const tableStake = round => round >= 5 ? 12 : 8;
export function nextTarget(s, roll = s.dice?.result?.total || 0) {
  return Math.max(s.target + roll, s.bank + tableStake(s.round + 1));
}
export const neededScore = s => Math.max(0, s.target - s.bank);
