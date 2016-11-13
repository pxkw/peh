DROP TABLE IF EXISTS testdata;

CREATE TABLE testdata (
  id       BIGINT,
  `date`   TIMESTAMP,
  type     TINYINT,
  flag     BOOLEAN,
  degree   DOUBLE,
  message  STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ',';

LOAD DATA LOCAL INPATH 'test/e2e/res/testdata.csv'
  OVERWRITE INTO TABLE testdata;
