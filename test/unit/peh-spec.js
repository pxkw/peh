'use strict';
const fs = require('fs-extra');
const Peh = require(__dirname + '/../../src/peh');

describe('Peh', function () {
  let peh;

  beforeEach(function () {
    peh = new Peh();
  });

  it('#performanceTest should run smokeTests with varied datasizes', function () {
    spyOn(peh, 'mkGenDir');
    spyOn(peh, 'smokeTest');

    const hqlPath = __dirname + '/res/simple.hql';
    peh.performanceTest(hqlPath);

    expect(peh.mkGenDir).toHaveBeenCalled();
    expect(peh.smokeTest.calls.count()).toBe(3);
    expect(peh.smokeTest.calls.argsFor(0)).toEqual([hqlPath, 10]);
    expect(peh.smokeTest.calls.argsFor(1)).toEqual([hqlPath, 100]);
    expect(peh.smokeTest.calls.argsFor(2)).toEqual([hqlPath, 1000]);
  });

  it('#smokeTest should run given query on sapmled data', function () {
    const hqlPath = __dirname + '/res/simple.hql';
    const testHqlPath = 'gen/_test_simple.hql';
    const tables = ['table_a', 'table_b'];

    spyOn(peh, 'sampleTable');
    spyOn(peh, 'extractTables').and.returnValue(tables);
    spyOn(peh, 'replaceTableNamesWithSampleds');
    spyOn(peh, 'runHql');
    spyOn(console, 'time');
    spyOn(console, 'timeEnd');

    peh.smokeTest(hqlPath, 123);

    expect(peh.sampleTable).toHaveBeenCalledWith(123, tables);
    expect(peh.replaceTableNamesWithSampleds).toHaveBeenCalledWith(
      hqlPath, testHqlPath, tables);
    expect(console.time).toHaveBeenCalledWith(123);
    expect(peh.runHql).toHaveBeenCalledWith(testHqlPath);
    expect(console.timeEnd).toHaveBeenCalledWith(123);
  });

  it('#extractTables should return table names in given HQL', function () {
    var tables = peh.extractTables(__dirname + '/res/simple.hql');
    expect(tables.length).toBe(1);
    expect(tables[0]).toBe('table_a')
  });

  it('#extractTables should return table names in a complex HQL', function () {
    var tables = peh.extractTables(__dirname + '/res/complex.hql');
    expect(tables.length).toBe(2);
    expect(tables[0]).toBe('player');
    expect(tables[1]).toBe('plays');
  });

  it('#sampleTable should run HQL to create sampled tables', function () {
    spyOn(peh, 'runHql');
    spyOn(fs, 'writeFileSync');

    peh.sampleTable(123, ['table_a', 'table_b']);

    var expectedHql = fs.readFileSync(__dirname + '/res/expected-sample.hql', 'utf8');
    expect(fs.writeFileSync.calls.argsFor(0)[0]).toEqual('gen/sample.hql')
    expect(fs.writeFileSync.calls.argsFor(0)[1]).toEqual(expectedHql);
    expect(peh.runHql).toHaveBeenCalledWith('gen/sample.hql');
  });
});
