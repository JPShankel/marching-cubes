// Corner index = x + y*2 + z*4
//     6----7
//    /|   /|
//   4----5 |
//   | 2--|-3
//   |/   |/
//   0----1

export const cornerPositions = [
  [0, 0, 0], // 0
  [1, 0, 0], // 1
  [0, 1, 0], // 2
  [1, 1, 0], // 3
  [0, 0, 1], // 4
  [1, 0, 1], // 5
  [0, 1, 1], // 6
  [1, 1, 1], // 7
];

export const edgeCorners = [
  [0, 1], // 0  X bottom-front
  [1, 3], // 1  Y right-front
  [2, 3], // 2  X bottom-back
  [0, 2], // 3  Y left-front
  [4, 5], // 4  X top-front
  [5, 7], // 5  Y right-back
  [6, 7], // 6  X top-back
  [4, 6], // 7  Y left-back
  [0, 4], // 8  Z left-front
  [1, 5], // 9  Z right-front
  [3, 7], // 10 Z right-back
  [2, 6], // 11 Z left-back
];
