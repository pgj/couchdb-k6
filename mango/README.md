# Mango Performance Tests

This folder contains JavaScript modules and pull-request-specific
configurations for different kind of tests on CouchDB's [Mango query
interface](https://docs.couchdb.org/en/latest/api/database/find.html).

## Test Configuration

All the parameters that control the behavior of the test can be found
in the `config.js` file.  Revisit and modify them as needed.  Ideally,
nothing should be changed.  The default configuration assumes a
running CouchDB instance on `http://127.0.0.1:15984` with the `adm`
admin user and `pass` password.

## Generation of Test Data

Before running the performance test with `k6`, the data has to be
prepared first:

```shell
yarn generate-data
```

## Running the Performance Test

The benchmark itself could be run as follows:

```shell
yarn test
```

## Post-processing Test Results

Upon running the benchmark, `k6` itself will show a summary of a
relatively detailed set of statistics, but the detailed results will
be saved as `results.json`.  This can be fed into any other tool for
visualization or further analysis.

## Cleaning Up Test Data and Results

The generated test data and results can be wiped by the following
command:

```shell
yarn clean
```

This is ideal for starting over with the measurements.  Note that the
other steps will individually overwrite the corresponding parts as
well.
