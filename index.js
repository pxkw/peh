#!/usr/bin/env node
'use strict';

const Peh = require('./src/peh')

if (process.argv.length < 3) {
  console.error('Usage: peh $hql');
  process.exit(1);
}

const hqlPath = process.argv[2];
const peh = new Peh();

try {
  peh.performanceTest(hqlPath);
} catch (e) {
  console.log('NG');
  process.exit(1);
}
