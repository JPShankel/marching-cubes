import { tileTable } from './buildTileTable.js';

// Compatibility export for code or notes that still refer to canonicalCases.
// The implementation now uses the complete 256-entry marching-cubes table.
export const canonicalCases = tileTable.map((triangles, mask) => ({
  mask,
  triangles,
}));
