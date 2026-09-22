import {stageRaise} from './unlock-data.js';
import {growthRaise} from './growth-lab.js';
import {effectiveTarget} from './dealer-events.js';
import {skipTargetPenalty} from './momentum.js';
export const tableStake = round => round >= 5 ? 12 : 8;
export const targetFactor=s=>growthRaise(s,1)+skipTargetPenalty(s);
export const targetSurcharge = s => stageRaise(s) + (s.round === 1 && !s.practice ? 4 : 0);
export function nextTarget(s, roll = s.dice?.result?.total || 0) {
  if(s.endless)return s.target*2;
  if(s.rules===2)return s.target+roll*targetFactor(s)+targetSurcharge(s);
  return Math.max(s.target + roll, s.bank + tableStake(s.round + 1));
}
export const neededScore = s => Math.max(0, effectiveTarget(s) - s.bank);
