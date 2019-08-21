const fs = require('fs-extra');
const path = require('path');
const csstree = require('css-tree');

const INTERVAL = 131072;
const FILEPATH = path.join(__dirname, 'ascii.css.txt');
const WHITESPACE_REGEX = /[\t\n\r]+| {2,}/g;

const { length } = fs.readFileSync(FILEPATH, 'utf8');

const file = fs.createReadStream(FILEPATH, { highWaterMark: INTERVAL });
file.setEncoding('utf8');

const properties = {};
let processed = 0;
let lastPercent = '0%';

file.on('data', chunk => {
  const chunkLength = chunk.length;
  processed += chunkLength;

  csstree.walk(csstree.parse(chunk), {
    visit: 'Declaration',
    enter: node => {
      const property = normalizeProperty(node.property);
      const value = normalizeValue(node.value);

      let values = properties[property];
      if (!values) properties[property] = values = { $$count$$: 0 };
      values[value] = ~~values[value] + 1;
      values.$$count$$ += 1;
    }
  });

  const percent = Math.floor((100 * processed) / length) + '%';
  if (lastPercent !== percent) {
    console.log(percent);
    lastPercent = percent;
  }
});

file.on('end', chunk => {
  console.log('writing results');
  fs.writeFile(
    path.join(__dirname, 'propValMap.json'),
    JSON.stringify(properties)
  );
  console.log('done');
});

function normalizeProperty (property) {
  return property.toLowerCase();
}

function normalizeValue (value) {
  return csstree
    .generate(value)
    .trim()
    .replace(WHITESPACE_REGEX, ' ')
    .toLowerCase();
}
