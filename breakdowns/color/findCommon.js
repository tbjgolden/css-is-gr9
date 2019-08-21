const fs = require('fs-extra');
const path = require('path');
const colorString = require('color-string');

const distribution = require('./distribution.json');

let total = 0;

const common = Object.entries(distribution)
  .sort(([, a], [, b]) => b - a)
  .map(entry => {
    total += entry[1];
    return entry;
  })
  .filter(([, count]) => Math.round(count * 1000 / total))
  .map(([color, count], i) => {
    let textColor = [];
    color = color.split(',').map(n => parseFloat(n));
    const alpha = color.pop();
    if (alpha === 0) {
      textColor.push('transparent');
    } else if (alpha === 1) {
      const keyword = colorString.to.keyword(color);
      if (keyword) textColor.push(keyword);
      const hex = colorString.to.hex(color);
      const [, a, b, c, d, e, f] = hex;
      if (a === b && c === d && e === f) {
        textColor.push(`#${a}${c}${e}`);
      } else {
        textColor.push(hex);
      }
    } else {
      textColor.push(colorString.to.rgb(
        color,
        alpha
      ));
    }

    return [
      textColor,
      count,
      Math.round(count * 1000 / total)
    ];
  });

fs.writeFileSync(
  path.join(__dirname, 'common.json'),
  JSON.stringify({
    common,
    total
  })
);
