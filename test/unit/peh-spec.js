'use strict';

const fs = require('fs-extra');
const cproc = require('child_process');

const Peh = require(__dirname + '/../../src/peh');

describe('Peh', function () {
  let peh;

  beforeEach(function () {
    peh = new Peh();
  });

  it('#smokeTest should run given query on sampled data', function () {
    const hql =
      "SELECT * FROM table_a a\n" +
      "JOIN table_b b\n" +
      "ON a.id = b.id;\n";
    const tables = ['table_a', 'table_b'];

    spyOn(peh, 'sampleTable');
    spyOn(peh, 'extractTables').and.returnValue(tables);
    spyOn(peh, 'queryForSampledTables').and.returnValue('return of queryForSampledTables');
    spyOn(peh, 'runHql');
    spyOn(console, 'time');
    spyOn(console, 'timeEnd');

    peh.smokeTest(hql, 123);

    expect(peh.extractTables).toHaveBeenCalledWith(hql);
    expect(peh.sampleTable).toHaveBeenCalledWith(tables, [123]);
    expect(peh.queryForSampledTables).toHaveBeenCalledWith(hql, tables, 123);
    expect(console.time).toHaveBeenCalledWith('123rows');
    expect(peh.runHql).toHaveBeenCalledWith('return of queryForSampledTables');
    expect(console.timeEnd).toHaveBeenCalledWith('123rows');
  });

  it('#extractTables should return table names in given HQL', function () {
    const hql =
      "SELECT * FROM table_a a\n" +
      "JOIN table_b b\n" +
      "ON a.id = b.id;\n";

    var tables = peh.extractTables(hql);

    expect(tables.length).toBe(2);
    expect(tables[0]).toBe('table_a');
    expect(tables[1]).toBe('table_b');
  });

  it('#extractTables should return table names in a complex HQL', function () {
    const hql =
      "SELECT array_agg(players), player_teams\n" +
      "FROM (\n" +
      "  SELECT DISTINCT t1.t1player AS players, t1.player_teams\n" +
      "  FROM (\n" +
      "    SELECT\n" +
      "      p.playerid AS t1id,\n" +
      "      concat(p.playerid,':', p.playername, ' ') AS t1player,\n" +
      "      array_agg(pl.teamid ORDER BY pl.teamid) AS player_teams\n" +
      "    FROM player p\n" +
      "    LEFT JOIN plays pl ON p.playerid = pl.playerid\n" +
      "    GROUP BY p.playerid, p.playername\n" +
      "  ) t1\n" +
      "INNER JOIN (\n" +
      "  SELECT\n" +
      "    p.playerid AS t2id,\n" +
      "    array_agg(pl.teamid ORDER BY pl.teamid) AS player_teams\n" +
      "  FROM player p\n" +
      "  LEFT JOIN plays pl ON p.playerid = pl.playerid\n" +
      "  GROUP BY p.playerid, p.playername\n" +
      ") t2 ON t1.player_teams=t2.player_teams AND t1.t1id <> t2.t2id\n" +
      ") innerQuery\n" +
      "GROUP BY player_teams;\n";

    const result = peh.extractTables(hql);

    expect(result.length).toBe(2);
    expect(result[0]).toBe('player');
    expect(result[1]).toBe('plays');
  });

  it('#queryForSampledTables should return query to be run on sampled tables', function () {
    const hql =
      "SELECT * FROM table_a a\n" +
      "JOIN table_b b\n" +
      "ON a.id = b.id;\n";

    const result = peh.queryForSampledTables(hql, ['table_a', 'table_b'], 123);

    expect(result).toBe(
      "SELECT * FROM table_a_sampled_123 a\n" +
      "JOIN table_b_sampled_123 b\n" +
      "ON a.id = b.id;\n");
  });

  it('#sampleTable should run HQL to create sampled tables', function () {
    spyOn(peh, 'runHql');

    peh.sampleTable(['table_a', 'table_b'], [123, 456]);

    expect(peh.runHql).toHaveBeenCalledWith(
      'DROP TABLE IF EXISTS table_a_sampled_123;\n' +
      'CREATE TABLE table_a_sampled_123 AS SELECT * FROM table_a LIMIT 123;\n' +
      'DROP TABLE IF EXISTS table_a_sampled_456;\n' +
      'CREATE TABLE table_a_sampled_456 AS SELECT * FROM table_a LIMIT 456;\n' +
      'DROP TABLE IF EXISTS table_b_sampled_123;\n' +
      'CREATE TABLE table_b_sampled_123 AS SELECT * FROM table_b LIMIT 123;\n' +
      'DROP TABLE IF EXISTS table_b_sampled_456;\n' +
      'CREATE TABLE table_b_sampled_456 AS SELECT * FROM table_b LIMIT 456;\n'
    );
  });

  it('runHql should run given hql', function () {
    spyOn(cproc, 'execSync');

    peh.runHql('select * from `table1`');

    var cprocArg = cproc.execSync.calls.argsFor(0)[0];
    expect(cprocArg).toMatch('hive -e "select \\* from \\\\`table1\\\\`"');
  });


  it('runHql should throw error when given HQL fails', function () {
    spyOn(cproc, 'execSync').and.callFake(function (arg) {
      if (arg.match(/hive/)) {
        throw new Error("something wrong");
      } else if (arg.match(/grep/)) {
        return 'FAILED: SomethingException Line 12:34';
      }
    });

    expect(function () {
      peh.runHql('hql to fail');
    }).toThrowError('FAILED: SomethingException Line 12:34');
  });
});
