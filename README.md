# About

- Performance Estimator for Hive SQL
- _**Developing**_ project

# Requirements

- [Hive](https://hive.apache.org)
- [Node.js](https://nodejs.org)

# Usage


## Table sampling

`peh --sample tablename nrow [nrow ...]`

example:
```
peh --sample table1 123 345
```


## Smoke test

`peh --smoke hqlpath [nrow]`


example:
```
peh --smoke ./path/to/query.hql 1000
```


# Tests

Requires additional tools:

- [bats](https://github.com/sstephenson/bats)

``` sh
npm run test:init  # init data for tests
npm test           # runs all tests
npm run test:unit  # runs unit tests
npm run test:e2e   # runs e2e tests
```
