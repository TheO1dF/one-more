import {stageRaise} from './unlock-data.js';
export const tableStake = round => round >= 5 ? 12 : 8;
export function nextTarget(s, roll = s.dice?.result?.total || 0) {
  if(s.rules===2)return s.target+roll+stageRaise(s);
  return Math.max(s.target + roll, s.bank + tableStake(s.round + 1));
}
export const neededScore = s => Math.max(0, s.target - s.bank);
