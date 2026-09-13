const CHINESE_TIME_ZONES = new Set([
  'Asia/Shanghai', 'Asia/Urumqi', 'Asia/Chongqing', 'Asia/Chungking',
  'Asia/Harbin', 'Asia/Hong_Kong', 'Asia/Macau', 'Asia/Macao', 'Asia/Taipei',
  'PRC', 'Hongkong', 'ROC',
]);

export function defaultLanguage(readZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone) {
  try { return CHINESE_TIME_ZONES.has(readZone()) ? 'zh' : 'en'; }
  catch { return 'en'; }
}

export function initialPreferences(saved, readZone) {
  const defaults = { lang: defaultLanguage(readZone), sound: true, motion: true, music: true, volume: 0.38 };
  let parsed;
  try { parsed = JSON.parse(saved || '{}'); } catch { return defaults; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;
  return { ...defaults, ...parsed, lang: ['zh', 'en'].includes(parsed.lang) ? parsed.lang : defaults.lang };
}
