SELECT
  type,
  concat( cast(min(`date`) as STRING), '-->', cast(max(`date`) as STRING) ) AS date_range,
  count(flag) AS num_trues,
  avg(degree) AS avg_degree
FROM testdata t1
JOIN (
  SELECT abs(type) AS type
  FROM testdata
  GROUP BY abs(type)
) t2
ON t1.type = t2.type
GROUP BY t1.type, t1.flag
HAVING t1.flag = 1
ORDER BY type;
