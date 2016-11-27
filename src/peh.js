'use strict';
const fs = require('fs-extra');
const path = require('path');
const cproc = require('child_process');

function Peh() {}

Peh.prototype.logfilePath = `peh.log`;

Peh.prototype.extractTables = function (hql) {
  const tokens = hql
    .replace(/\n/g, ' ')
    .replace(/;/g, ' ')
    .replace(/ +/g, ' ')
    .split(' ');
  const tables = [];
  const keyword = new RegExp('^([Jj][Oo][Ii][Nn]|[Ff][Rr][Oo][Mm])$');
  const tableName = new RegExp("^[a-zA-Z0-9_]+$");

  let keywordDetected = false;
  tokens.forEach(function (token) {
    if (token.match(keyword)) {
      keywordDetected = true;
    } else if (keywordDetected && token.match(tableName)) {
      if (tables.indexOf(token) == -1) {
        tables.push(token);
      }
      keywordDetected = false;
    } else {
      keywordDetected = false;
    }
  });

  return tables;
};

Peh.prototype.sampleQuery = function (table, nrow) {
  let newTable = `${table}_sampled_${nrow}`
  return `DROP TABLE IF EXISTS ${newTable};\n`
    + `CREATE TABLE ${newTable} AS SELECT * FROM ${table} LIMIT ${nrow};\n`;
};

Peh.prototype.queryForSampledTables = function (hql, tables, nrow) {
  tables.forEach(function (table) {
    const target = new RegExp(table, 'g');
    const w = `${table}_sampled_${nrow}`;
    hql = hql.replace(target, w);
  });
  return hql;
};

Peh.prototype.sampleTable = function (tables, nrows) {
  let query = '';
  let self = this;

  console.log('\n## Sampling data');
  tables.forEach(function (table) {
    nrows.forEach(function (nrow) {
      console.log(`Creating table: ${table}_sampled_${nrow}`);
      query += self.sampleQuery(table, nrow);
    })
  });

  this.runHql(query);
};

Peh.prototype.runHql = function (_hql) {
  let hql = _hql.replace(/`/g, '\\`');
  let tmpLog = this.logfilePath + '.tmp';
  let failMsg;

  try {
    cproc.execSync(`(hive -e "${hql}" 2>&1) 1> ${tmpLog}`);
  } catch (err) {
    failMsg = cproc.execSync(`grep --color=never "FAILED" ${tmpLog}`)
      .toString()
      .replace(/\n$/, '');
  }

  cproc.execSync(`cat ${tmpLog} >> ${this.logfilePath}`);
  cproc.execSync(`rm -f ${tmpLog}`);

  if (failMsg) {
    throw new Error(failMsg);
  }
};

Peh.prototype.smokeTest = function (hql, nrow) {
  const tables = this.extractTables(hql);

  this.sampleTable(tables, [nrow]);
  let smokeTestHql = this.queryForSampledTables(hql, tables, nrow);

  console.log("\n## Smoke test");
  console.time(`${nrow}rows`);
  this.runHql(smokeTestHql);
  console.timeEnd(`${nrow}rows`);
};

module.exports = Peh;
