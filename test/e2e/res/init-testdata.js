'use strict';
const Random = require('random-js');
const rand = new Random();
const fs = require('fs');
const cproc = require('child_process');

const dateRange = {
  min: new Date("2000-01-01 00:00:00"),
  max: new Date("2100-01-01 00:00:00")
};
const dst = `${__dirname}/testdata.csv`;

if (fs.existsSync(dst)) {
  fs.unlinkSync(dst);
}

console.log('Start.')
console.time('Data generation');
for (var i = 0; i < 1000000; i++) {
  const id = i;  // BIGINT
  const date = rand.date(dateRange.min, dateRange.max)
    .toISOString().replace('T', ' ').replace('Z', ''); // TIMESTAMP
  const type = rand.integer(-128, 127); // SMALLINT
  const flag = rand.bool(); // BOOLEAN
  const degree = rand.real(-1000000, 1000000); // DOUBLE
  const message = rand.string(64); // STRING
  const row = `${id},${date},${type},${flag},${degree},${message}\n`;
  fs.writeFileSync(dst, row, {flag: 'a'});
}
console.timeEnd('Data generation');

console.time('Table creation');
cproc.execSync('hive -f test/e2e/res/create-table-testdata.hql');
console.timeEnd('Table creation');

console.log('Finish.');
