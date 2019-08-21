const fs = require('fs-extra');
const path = require('path');

const distribution = require('./distribution.json');

const R = new Array(256).fill(0);
const G = new Array(256).fill(0);
const B = new Array(256).fill(0);
const A = new Array(256).fill(0);

let total = 0;

Object.entries(distribution)
  .forEach(([color, count]) => {
    const [r, g, b, a] = color.split(',').map(n => ~~n);
    R[r] += count;
    G[g] += count;
    B[b] += count;
    A[a] += count;
    total += count;
  });

console.log(`Generating from ${total} colors...`);

const cols = [];
for (let i = 0; i < 256; i++) {
  const arr = [[2, R[i]], [3, G[i]], [5, B[i]]]; /* , [7, A[i]] */
  let factor = 1;
  cols.push(
    arr.sort(([, a], [, b]) => b - a).map(([n, count]) => {
      factor *= n;
      return [factor, count];
    }).reduceRight((a, [n, count]) => {
      if (!a.length || a[a.length - 1][1] !== count) a.push([n, count]);
      return a;
    }, [])
  );
}

fs.writeFile(
  path.join(__dirname, 'histogram.json'),
  JSON.stringify(cols)
);
