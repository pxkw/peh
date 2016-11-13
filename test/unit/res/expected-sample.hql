DROP TABLE IF EXISTS table_a_sampled;
CREATE TABLE table_a_sampled
  AS SELECT *
  FROM table_a
  DISTRIBUTE BY rand()
  SORT BY rand()
  LIMIT 123;

DROP TABLE IF EXISTS table_b_sampled;
CREATE TABLE table_b_sampled
  AS SELECT *
  FROM table_b
  DISTRIBUTE BY rand()
  SORT BY rand()
  LIMIT 123;

