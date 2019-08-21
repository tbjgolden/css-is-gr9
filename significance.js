const fs = require('fs-extra');
const path = require('path');

const VALID = new Set(require('./properties.json'));
const NONSTANDARD = new Set(require('./nonstandard.json'));
const DRAFTS = new Set(require('./drafts.json'));
// const RE_VARIABLE = /^--/;

const propValMap = require('./propValMap.json');

// generate zipf frequencies
const N = 0.7;
const maxFreq = Object.values(propValMap)
  .sort((a, b) => b.$$count$$ - a.$$count$$)[0].$$count$$;
const freqSums = [null, [1, 1]];
for (let i = 2; i <= maxFreq; i++) {
  const next = Math.pow(i, -N);
  freqSums.push([
    next,
    freqSums[i - 1][1] + next
  ]);
}

const significantValid = [];
const significantNonStandard = [];
const significantDrafts = [];

Object.entries(propValMap)
  .sort(([, a], [, b]) => b.$$count$$ - a.$$count$$)
  .forEach(([property, values]) => {
    values = Object.entries(values)
      .sort(([, a], [, b]) => b - a);

    const [, total] = values.shift();
    const min = Math.sqrt(total);

    for (let i = 0; i < values.length; i++) {
      const [value, count] = values[i];

      const approximation = freqSums[i + 1][0] / freqSums[total][1];
      const measured = count / total;

      const expectedMore = approximation >= measured;
      const lessThanSqrt = count < min;
      const lessThan4 = count < 4;
      const lessThanPercent = measured < 0.01;

      if (expectedMore || lessThanSqrt || lessThan4 || lessThanPercent) break;

      if (VALID.has(property)) {
        significantValid.push(`[${total}] ${property}: ${value} [${Math.round(1000 * measured) / 10}%]`);
      } else if (DRAFTS.has(property)) {
        significantNonStandard.push(`${property}: ${value}`);
      } else if (NONSTANDARD.has(property)) {
        significantDrafts.push(`${property}: ${value}`);
      }
    }
  });

fs.writeFileSync(
  path.join(__dirname, 'breakdowns/significance/valid.txt'),
  significantValid.join(';\n')
);

fs.writeFileSync(
  path.join(__dirname, 'breakdowns/significance/drafts.txt'),
  significantNonStandard.join(';\n')
);

fs.writeFileSync(
  path.join(__dirname, 'breakdowns/significance/nonstandard.txt'),
  significantDrafts.join(';\n')
);
