const fs = require('fs-extra');
const path = require('path');

const totals = fs.readdirSync(__dirname)
  .filter(s => /\.json$/gi.test(s))
  .map(filename => [
    filename,
    fs.readFileSync(
      path.join(__dirname, filename)
    )
  ])
  .map(([filename, fileJSON]) => [
    filename.substring(0, filename.length - 5),
    JSON.parse(fileJSON).reduce((a, b) => a + b[1], 0)
  ]);

const sum = totals.reduce((a, b) => a + b[1], 0);

console.log(sum, totals);

const niceName = {
  'valid': 'Valid CSS Properties',
  'vendor': 'Vendor Prefixes',
  'drafts': 'Old Proposed Properties',
  'variables': 'Variables',
  'ie6': 'Internet Explorer 3-6',
  'ie7': 'Internet Explorer 7',
  'nonstandard': 'Non-Standard Properties',
  'comments': 'Unsuccessful Comments',
  'invalid': 'Misc Broken CSS'
};

console.log(
  totals.sort((a, b) => b[1] - a[1]).map(([name, count]) => (
    `${niceName[name] || name}`.padEnd(24, ' ') +
    `${Number(100 * count / sum).toFixed(3)}%`.padStart(8, ' ') +
    `(${count})`.padStart(11, ' ')
  )).join('\n')
);
