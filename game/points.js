// Keep the HUD legible as endless targets grow.
export const points=n=>Math.abs(n)<1e6?String(n):n.toExponential(2).replace('e+','e');
