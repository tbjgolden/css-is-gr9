/* eslint-disable no-control-regex */

const fs = require('fs-extra');
const path = require('path');

fs.writeFile(
  path.join(__dirname, 'ascii.css.txt'),
  `${fs.readFileSync(path.join(__dirname, 'css.txt'))}`.replace(/[^\x09\x0A -~]+/g, '')
);
