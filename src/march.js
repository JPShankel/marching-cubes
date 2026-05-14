import * as THREE from 'three';
import { tileTable } from './buildTileTable.js';
import { cornerPositions, edgeCorners } from './cornerTable.js';
import { evaluateField, evaluateGradient } from './field.js';

export function marchCubes(sources, threshold, gridSize, worldSize) {
  const N = gridSize; // number of cubes per axis
  const step = worldSize / N;

  // Precompute field values at all (N+1)^3 grid vertices
  const fieldValues = new Float32Array((N + 1) * (N + 1) * (N + 1));
  const idx = (i, j, k) => i + (N + 1) * (j + (N + 1) * k);

  for (let k = 0; k <= N; k++) {
    for (let j = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++) {
        const wx = (i / N) * worldSize - worldSize / 2;
        const wy = (j / N) * worldSize - worldSize / 2;
        const wz = (k / N) * worldSize - worldSize / 2;
        fieldValues[idx(i, j, k)] = evaluateField(sources, wx, wy, wz);
      }
    }
  }

  const positions = [];
  const normals = [];

  for (let k = 0; k < N; k++) {
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        // 8 corner grid indices
        const ci = [
          idx(i,   j,   k),
          idx(i+1, j,   k),
          idx(i,   j+1, k),
          idx(i+1, j+1, k),
          idx(i,   j,   k+1),
          idx(i+1, j,   k+1),
          idx(i,   j+1, k+1),
          idx(i+1, j+1, k+1),
        ];

        // Config bitmask
        let config = 0;
        for (let c = 0; c < 8; c++) {
          if (fieldValues[ci[c]] >= threshold) config |= (1 << c);
        }

        const tris = tileTable[config];
        if (tris.length === 0) continue;

        // World-space corner positions
        const cx = (i / N) * worldSize - worldSize / 2;
        const cy = (j / N) * worldSize - worldSize / 2;
        const cz = (k / N) * worldSize - worldSize / 2;

        // Interpolate vertex for each of the 12 edges (lazy, only compute used ones)
        const edgeVerts = new Array(12).fill(null);
        const edgeNorms = new Array(12).fill(null);

        const usedEdges = new Set(tris.flat());
        for (const e of usedEdges) {
          const [a, b] = edgeCorners[e];
          const valueA = fieldValues[ci[a]];
          const valueB = fieldValues[ci[b]];
          const denom = valueB - valueA;
          const alpha = Math.abs(denom) > 1e-12 ? (threshold - valueA) / denom : 0.5;

          const [ax, ay, az] = cornerPositions[a];
          const [bx, by, bz] = cornerPositions[b];

          const wx = cx + (ax + alpha * (bx - ax)) * step;
          const wy = cy + (ay + alpha * (by - ay)) * step;
          const wz = cz + (az + alpha * (bz - az)) * step;

          edgeVerts[e] = [wx, wy, wz];

          const grad = evaluateGradient(sources, wx, wy, wz);
          const len = Math.sqrt(grad[0]**2 + grad[1]**2 + grad[2]**2) || 1;
          // outward normal = negative gradient (gradient points toward higher field)
          edgeNorms[e] = [-grad[0] / len, -grad[1] / len, -grad[2] / len];
        }

        for (const [e0, e1, e2] of tris) {
          for (const e of [e0, e1, e2]) {
            positions.push(...edgeVerts[e]);
            normals.push(...edgeNorms[e]);
          }
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geo;
}
