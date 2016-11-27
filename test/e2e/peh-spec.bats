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

@test "--smoke should show execution time on sampled table for healthy query" {
  run index.js --smoke $RES_DIR/healthy.hql 123
  log_result

  [ "$status" -eq 0 ]

  [ "${lines[0]}" = "## Sampling data" ]
  [ "${lines[1]}" = "Creating table: testdata_sampled_123" ]
  [ "${lines[2]}" = "## Smoke test" ]
  [[ "${lines[3]}" =~ ^123rows:\ [0-9\.]+ms$ ]]; [ $? -eq 0 ]
  [ "${lines[4]}" = "Finish" ]
}

@test "--smoke should show error messages for unhealthy query" {
  run index.js --smoke $RES_DIR/unhealthy.hql 123
  log_result

  [ "$status" -eq 1 ]

  [ "${lines[0]}" = "## Sampling data" ]
  [ "${lines[1]}" = "Creating table: testdata_sampled_123" ]
  [ "${lines[2]}" = "## Smoke test" ]
  [[ "${lines[3]}" =~ ^FAILED:\ .*$ ]]; [ $? -eq 0 ]
  [ "${lines[4]}" = "Finish with error" ]
}

 @test "--sample should sample table with given number of rows" {
   run index.js --sample testdata 10 20 30
   log_result

   [ "$status" -eq 0 ]

   [ "${lines[0]}" = "## Sampling data" ]
   [ "${lines[1]}" = "Creating table: testdata_sampled_10" ]
   [ "${lines[2]}" = "Creating table: testdata_sampled_20" ]
   [ "${lines[3]}" = "Creating table: testdata_sampled_30" ]
   [ "${lines[4]}" = "Finish" ]
 }
