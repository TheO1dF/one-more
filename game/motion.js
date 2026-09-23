// An explicit game setting wins; standalone views may follow the system default.
export function reducedMotion(setting = globalThis.document?.documentElement?.dataset.motion) {
  if (setting === 'full' || setting === true) return false;
  if (setting === 'reduced' || setting === false) return true;
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
