const fs = require('fs-extra');
const path = require('path');

const totals = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'valid.json')
  )
);

const sum = totals.reduce((a, b) => a + b[1], 0);

let includedSum = 0;

console.log(sum);
console.log(
  totals.filter(([, count]) => count >= 0.02 * sum).map(([name, count]) => (
    includedSum += count,
    `${name}`.padEnd(24, ' ') +
    `${Number(100 * count / sum).toFixed(3)}%`.padStart(8, ' ') +
    `${count}`.padStart(11, ' ')
  )).join('\n') + '\n' +
  `(the rest)               ${Number(100 * (sum - includedSum) / sum).toFixed(3)}%    ${includedSum}`
);
