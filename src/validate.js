import { tileTable } from './buildTileTable.js';
import { edgeCorners } from './cornerTable.js';

export function validateTileTable() {
  const errors = [];

  for (let i = 0; i < 256; i++) {
    if (!Array.isArray(tileTable[i])) errors.push(`Config ${i}: missing entry`);
  }

  if (tileTable[0].length !== 0) errors.push('Config 0 should have no triangles');
  if (tileTable[255].length !== 0) errors.push('Config 255 should have no triangles');

  for (let config = 0; config < 256; config++) {
    const tris = tileTable[config];
    const complement = 255 - config;
    const compTris = tileTable[complement];

    if (tris.length > 5) errors.push(`Config ${config}: ${tris.length} triangles > 5`);

    if (tris.length !== compTris.length) {
      errors.push(`Config ${config} (${tris.length} tris) vs complement ${complement} (${compTris.length} tris): count mismatch`);
    }

    for (const [e0, e1, e2] of tris) {
      for (const e of [e0, e1, e2]) {
        if (e < 0 || e > 11) errors.push(`Config ${config}: edge ${e} out of range`);
      }

      for (const e of [e0, e1, e2]) {
        const [a, b] = edgeCorners[e];
        const aIn = !!(config & (1 << a));
        const bIn = !!(config & (1 << b));
        if (aIn === bIn) {
          errors.push(`Config ${config}: edge ${e} corners both ${aIn ? 'inside' : 'outside'}`);
        }
      }
    }
  }

  return errors;
}

export function diagnoseTileTable() {
  console.group('=== Tile Table Diagnostics ===');

  // Coverage: how many of the 256 entries have triangles
  const triCounts = tileTable.map(t => t.length);
  const empty = triCounts.filter((n, i) => n === 0).length;
  const byCount = [0,1,2,3,4,5].map(n => triCounts.filter(c => c === n).length);
  console.log(`Coverage: ${256 - empty}/256 entries non-empty`);
  console.log(`Triangle distribution: ${byCount.map((n,i) => `${i}t:${n}`).join(' ')}`);

  // Which canonical cases produced how many rotated configs
  // (diagnose if a canonical case's mask had bad edges and so its rotations were all skipped/overwritten)
  const errors = validateTileTable();
  const badEdgeConfigs = new Set(
    errors.filter(e => e.includes('corners both')).map(e => parseInt(e.split(' ')[1].replace(':','')))
  );
  console.log(`Configs with bad-edge errors: ${badEdgeConfigs.size}`);
  if (badEdgeConfigs.size > 0 && badEdgeConfigs.size <= 20) {
    console.log('  Bad configs:', [...badEdgeConfigs].join(', '));
  }

  // Empty non-trivial configs (not 0 or 255)
  const emptyMid = triCounts.map((n,i) => ({ n, i })).filter(({ n, i }) => n === 0 && i !== 0 && i !== 255);
  if (emptyMid.length > 0) {
    console.warn(`${emptyMid.length} non-trivial configs have 0 triangles (should all be > 0)`);
    if (emptyMid.length <= 10) console.log('  Empty configs:', emptyMid.map(e => e.i).join(', '));
  }

  // Sample a few configs with known geometry to sanity-check
  const spot = (config, desc) => {
    const tris = tileTable[config];
    const edgeErrors = tris.flatMap(t => t.filter(e => {
      const [a,b] = edgeCorners[e];
      return !(config & (1<<a)) === !(config & (1<<b)); // both same side
    }));
    console.log(`Config ${config} (${desc}): ${tris.length} tris, bad edges: [${edgeErrors}]`);
  };
  spot(0b00000001, '1 corner in');
  spot(0b00000011, '2 adj corners in');
  spot(0b00001111, 'full face in');
  spot(0b10100101, 'tetrahedral');
  spot(0b11111110, 'complement of 1 corner');

  console.groupEnd();
}
