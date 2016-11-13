LOGFILE=e2e.log
RES_DIR=test/e2e/res

function setup {
  hive -f $RES_DIR/create-table-testdata.hql 1>>$LOGFILE 2>&1
  export PATH=`realpath .`:$PATH
}

function log_result {
  echo "status: $status" >> $LOGFILE
  echo "output:" >> $LOGFILE
  echo "$output" >> $LOGFILE
}

@test "peh should show computing time for healthy query" {
  run index.js $RES_DIR/healthy.hql
  log_result
  [ "$status" -eq 0 ]
  [ "${#lines[@]}" -eq 3 ]
  [[ "${lines[0]}" =~ "10 [0-9]+$" ]]
  [ "$status" -eq 0 ]
  [[ "${lines[1]}" =~ "100 [0-9]+$" ]]
  [ "$status" -eq 0 ]
  [[ "${lines[2]}" =~ "1000 [0-9]+$" ]]
  [ "$status" -eq 0 ]
}

@test "peh should show NG for unhealthy query" {
  run index.js $RES_DIR/unhealthy.hql
  log_result
  [ "$status" -eq 1 ]
  [ "$output" = "NG" ]
}
