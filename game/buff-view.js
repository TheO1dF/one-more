export function foodWaiverIcon() {
  return `<svg class="food-waiver-icon" viewBox="0 0 64 64" aria-hidden="true"><path fill="var(--violet)" d="M5 8h3v12h3V8h3v12h3V8h3v17l-6 5v27H9V30l-4-5Z"/><ellipse cx="40" cy="33" rx="22" ry="25" fill="var(--paper)"/><ellipse cx="40" cy="33" rx="16" ry="19" fill="var(--violet)"/><ellipse cx="40" cy="33" rx="12" ry="15" fill="var(--paper)"/><path fill="var(--scarlet)" d="m29 32 8 8 16-20 5 5-21 26-13-13Z"/></svg>`;
}

export function foodWaiverHTML(count,lang='zh') {
  if (!(count>0)) return '';
  const en=lang==='en',label=en?`No food cost · ${count} uses left`:`无需食材费用 · 剩余${count}次`;
  return `<button class="food-waiver" data-action="food-waiver" data-count="${count}" title="${label}" aria-label="${label}">${foodWaiverIcon()}<span class="food-waiver-count" aria-hidden="true"><small>×</small><b>${count}</b></span></button>`;
}

export function foodWaiverDetails(count,lang='zh') {
  const en=lang==='en';
  return `<div class="food-waiver-details">${foodWaiverIcon()}<strong>${count}<small>${en?' uses left':' 次剩余'}</small></strong><p>${en?'Your next '+count+' tool food costs are 0. Each waived cost uses one charge.':'接下来'+count+'次工具的食材费用为0，每抵扣一次减少1次。'}</p><p>${en?'Tools with no food cost do not use a charge. Consuming food as an effect, such as with the Juicer, still requires that food.':'本来没有食材费用的工具不占次数。榨汁机等卡牌效果要求消耗的食材仍需消耗。'}</p></div>`;
}
