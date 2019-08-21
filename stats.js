const fs = require('fs-extra');
const path = require('path');
const colorString = require('color-string');
const hueToRgb = (p, q, t) => {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};
const hslaToRgba = (h, s, l, a) => {
  let [r, g, b] = [l, l, l];
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }
  return [~~(r * 255), ~~(g * 255), ~~(b * 255), a];
};

const VALID = new Set(require('./properties.json'));
const NONSTANDARD = new Set(require('./nonstandard.json'));
const DRAFTS = new Set(require('./drafts.json'));
const RE_COMMENT = /^\/\//;
const RE_VARIABLE = /^--/;
const RE_IE6 = /^_/;
const RE_IE7 = /^\*/;
const RE_VENDOR = /^-(o|moz|webkit|ms|khtml|gtk|gtkwidget|apple|xv|wap|epub)-/;

const propValMap = require('./propValMap.json');

const results = {
  valid: [],
  drafts: [],
  nonstandard: [],
  variables: [],
  ie6: [],
  ie7: [],
  vendor: [],
  comments: [],
  invalid: []
};

const colors = {};
const colorNotations = {};

Object.entries(propValMap)
  .sort(([, a], [, b]) => b.$$count$$ - a.$$count$$)
  .forEach(([key, values]) => {
    const top10 = Object.entries(values)
      .sort(([, a], [, b]) => b - a)
      .filter(([, count], i, arr) => count > ((arr[1][1] > 2) ? 1 : 0))
      .map(([a, b], i, arr) => (i ? `${`${b}`.padStart(`${arr[1][1]}`.length, ' ')} ${a}` : b))
      .slice(0, 50);
    const result = [key, top10.shift(), top10];

    const property = result[0];
    if (['color', 'background-color', 'border-color', 'outline-color'].includes(property)) {
      Object.entries(values)
        .forEach(([color, freq]) => {
          const colorValues = colorString.get(color);
          if (colorValues) {
            // find color syntaxes
            const match = color.match(/(?:rgb|rgba|hsl|hsla|hwb)\(|#/i);
            let type = ({
              'rgb(': 'rgb',
              'rgba(': 'rgba',
              'hsl(': 'hsl',
              'hsla(': 'hsla',
              'hwb(': 'hwb'
            })[match && match[0].toLowerCase()] || 'keyword';
            if (match && match[0] === '#') type = `hex${color.length - 1}`;
            colorNotations[type] = (colorNotations[type] || 0) + freq;

            // find color distribution
            if (colorValues.model === 'hsl') {
              // convert hsl to rgb
              colorValues.value = hslaToRgba(...colorValues.value);
              colorValues.model = 'rgb';
            }
            if (colorValues.model === 'rgb') {
              const serializedColor = colorValues.value.join(',');
              colors[serializedColor] = (colors[serializedColor] || 0) + freq;
            }
          }
        });
    }

    if (VALID.has(property)) results.valid.push(result);
    else if (DRAFTS.has(property)) results.drafts.push(result);
    else if (NONSTANDARD.has(property)) results.nonstandard.push(result);
    else if (RE_VARIABLE.test(property)) results.variables.push(result);
    else if (RE_IE6.test(property)) results.ie6.push(result);
    else if (RE_IE7.test(property)) results.ie7.push(result);
    else if (RE_VENDOR.test(property)) results.vendor.push(result);
    else if (RE_COMMENT.test(property)) results.comments.push(result);
    else results.invalid.push(result);
  });

for (let part in results) {
  fs.writeFileSync(
    path.join(__dirname, `statistics/${part}.json`),
    JSON.stringify(results[part], null, 2)
  );
}

fs.writeFileSync(
  path.join(__dirname, 'breakdowns/color/distribution.json'),
  JSON.stringify(colors)
);

fs.writeFileSync(
  path.join(__dirname, 'breakdowns/color/notations.json'),
  JSON.stringify(colorNotations)
);
