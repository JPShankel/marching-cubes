import { triTable as threeTriTable } from 'three/examples/jsm/objects/MarchingCubes.js';

// Three's table is the standard Lorensen/Cline marching-cubes tri table.
// This project uses the same edge indices, but its corner bit order has
// corners 2/3 and 6/7 swapped relative to that table.
const projectCornerToTableCorner = [0, 1, 3, 2, 4, 5, 7, 6];

function toTableMask(projectMask) {
  let tableMask = 0;
  for (let corner = 0; corner < 8; corner++) {
    if (projectMask & (1 << corner)) {
      tableMask |= 1 << projectCornerToTableCorner[corner];
    }
  }
  return tableMask;
}

function trianglesForTableMask(tableMask) {
  const triangles = [];
  const offset = tableMask * 16;

  for (let i = 0; i < 16; i += 3) {
    const e0 = threeTriTable[offset + i];
    if (e0 === -1) break;

    triangles.push([
      e0,
      threeTriTable[offset + i + 1],
      threeTriTable[offset + i + 2],
    ]);
  }

  return triangles;
}

// tileTable[configIndex] = array of triangles, each triangle = [e0, e1, e2]
export const tileTable = Array.from({ length: 256 }, (_, projectMask) =>
  trianglesForTableMask(toTableMask(projectMask))
);
