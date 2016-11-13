'use strict';
const fs = require('fs-extra');
const path = require('path');
const cproc = require('child_process');

function Peh() {}

Peh.prototype.gen = `gen`;
Peh.prototype.logfilePath = `${Peh.prototype.gen}/peh.log`;

Peh.prototype.copyFileSync = function (src, dst) {
  if (fs.existsSync(dst)) {
    fs.unlinkSync(dst);
  }
  fs.copySync(src, dst);
};

Peh.prototype.extractTables = function (givenHqlPath) {
  const hql = fs.readFileSync(givenHqlPath, 'utf8');
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

Peh.prototype.sampleTableQuery = function (table, sampledTable, sampleNum) {
  return `\
DROP TABLE IF EXISTS ${sampledTable};\n\
CREATE TABLE ${sampledTable}\n\
  AS SELECT *\n\
  FROM ${table}\n\
  DISTRIBUTE BY rand()\n\
  SORT BY rand()\n\
  LIMIT ${sampleNum};\n`;
};

Peh.prototype.createSampleQuery = function (tables, path, sampleNum) {
  const self = this;
  let query = '';

  tables.forEach( function (table) {
    const sampledTable = `${table}_sampled`;
    query += self.sampleTableQuery(table, sampledTable, sampleNum) + "\n";
  });

  fs.writeFileSync(path, query);
};

Peh.prototype.replaceTableNamesWithSampleds = function (hqlPath, testHqlPath, tables) {
  this.copyFileSync(hqlPath, testHqlPath);

  let hql = fs.readFileSync(testHqlPath, 'utf8');
  tables.forEach(function (table) {
    const target = new RegExp(table, 'g');
    const w = `${table}_sampled`;
    hql = hql.replace(target, w);
  });
  fs.writeFileSync(testHqlPath, hql);
};

Peh.prototype.sampleTable = function (sampleNum, tables) {
  var queryPath = `${this.gen}/sample.hql`;
  this.createSampleQuery(tables, queryPath, sampleNum);
  this.runHql(queryPath);
};

Peh.prototype.runHql = function (hql) {
  try {
    const out = cproc.execSync(`(hive -f '${hql}') 2>&1 1>${this.logfilePath}`);
    fs.writeFileSync(this.logfilePath, out, {flag: 'a'});
  } catch (e) {
    fs.writeFileSync(this.logfilePath, e, {flag: 'a'});
    throw e;
  }
};

Peh.prototype.smokeTest = function (givenHqlPath, sampleNum) {
  const givenHqlName = path.basename(givenHqlPath);
  const testHqlPath = `${this.gen}/_test_${givenHqlName}`
  const tables = this.extractTables(givenHqlPath);

  this.sampleTable(sampleNum, tables);
  this.replaceTableNamesWithSampleds(givenHqlPath, testHqlPath, tables);
  console.time(sampleNum);
  this.runHql(testHqlPath);
  console.timeEnd(sampleNum);
};

Peh.prototype.mkGenDir = function () {
  if (!fs.existsSync(this.gen)) {
    fs.mkdirSync(this.gen);
  }
};

Peh.prototype.performanceTest = function (givenHqlPath) {
  this.mkGenDir();
  const sampleNums = [10, 100, 1000];
  const self = this;
  sampleNums.forEach(function (sampleNum) {
    self.smokeTest(givenHqlPath, sampleNum);
  });
};

module.exports = Peh;
