#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const Peh = require('./src/peh')
const peh = new Peh();


var mode = process.argv[2];
var args = process.argv.slice(3, process.argv.length);

try {
  if (mode === '--smoke') {
    runSmoke(args);
  } else if (mode === '--sample') {
    runSample(args);
   } else {
    throw new Error('Undefined execution name: ' + mode);
  }
  console.log("\nFinish");
} catch (e) {
  console.log(e.message);
  console.log("\nFinish with error");
  process.exit(1);
}

function runSmoke(arg) {
  let hqlFiles = [];
  let nrows = [];

  args.forEach(function (arg) {
    if (isNaN(arg)) {
      hqlFiles.push(arg);
    } else {
      nrows.push(parseInt(arg));
    }
  });

  if (hqlFiles.length === 0) {
    throw new Error('No HQL file is given.')
  }

  if (nrows.length === 0) {
    nrows = [100];
  }

  hqlFiles.forEach(function (hqlFile) {
    var hql = fs.readFileSync(hqlFile, 'utf8');
    nrows.forEach(function (nrow) {
      peh.smokeTest(hql, nrow);
    });
  });
}

function runSample(args) {
  let tables = [];
  let nrows = [];

  args.forEach(function (arg) {
   if (isNaN(arg)) {
     tables.push(arg);
   } else {
     nrows.push(parseInt(arg));
   }
  });

  if (tables.length === 0) {
    throw new Error('No table is given.')
  }
  if (nrows.length === 0) {
    nrows = [100, 1000, 10000];
  }

  peh.sampleTable(tables, nrows);
}