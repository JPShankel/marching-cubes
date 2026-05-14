// Point source field: f(P) = sum( strength_i / |P - source_i|^2 )
// Gradient: ∇f(P) = sum( -2 * strength_i * (P - source_i) / |P - source_i|^4 )

export function evaluateField(sources, px, py, pz) {
  let value = 0;
  for (const { x, y, z, strength } of sources) {
    const dx = px - x, dy = py - y, dz = pz - z;
    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 < 1e-10) continue;
    value += strength / r2;
  }
  return value;
}

export function evaluateGradient(sources, px, py, pz) {
  let gx = 0, gy = 0, gz = 0;
  for (const { x, y, z, strength } of sources) {
    const dx = px - x, dy = py - y, dz = pz - z;
    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 < 1e-10) continue;
    const r4 = r2 * r2;
    const coeff = -2 * strength / r4;
    gx += coeff * dx;
    gy += coeff * dy;
    gz += coeff * dz;
  }
  return [gx, gy, gz];
}
