# Mango Validation Tools

This folder holds a set of utilitites that can be used to validate the
behavior of the CouchDB's [Mango query
interface](https://docs.couchdb.org/en/latest/api/database/find.html).
Validation is composed of the following steps:

- Generate a random list of queries.
- Collect reference results from the reference cluster setup.
- Collect results from the system-under-validation.
- Compare the two sets of results to get the verdict.

## Prerequisites

Those programs are assumed to be present for running the scripts
below.

- [Node.js](https://nodejs.org/)
- [k6.io](https://k6.io/)
- [`curl`](https://curl.se/)
- [`jq`](https://stedolan.github.io/jq/)
- [`parallel`](https://www.gnu.org/software/parallel/)

Each validation is bound to a given scenario.  A scenario is a set of
configuration data that describes the functionality that one wants to
test, benchmark, and validate.  So, first find a scenario to which the
validation applies and enter its directory.  For example, let us
choose `../couchdb_4482` for the demonstration.

## Random Query Generation

All the sample test data must be generated first by the
`generate-data` task.  Then the `generate-queries` script could be
used to derive a sample set of queries by the scenario settings, when
available.

```shell
yarn generate-data
yarn generate-queries
```

## Collecting Results

Start a CouchDB cluster to receive the queries.  First choose a
version which is going to be considered the reference version.  This
is the version that establishes a base for the comparison therefore
used to decide if the responses from the system-under-valiation are
acceptable.

### Reference Setup

For example, using the latest version of CouchDB from `git`:

```console
$ mkdir /tmp/couchdb
$ git clone https://github.com/apache/couchdb /tmp/couchdb
$ cd /tmp/couchdb
<a build a working version of CouchDB per the installation instructions>
$ dev/run -a adm:pass -n 3
...
```

### Creating the Database

The database can be created using the benchmarking setup, i.e. by
running `k6` directly in the scenario directory, via the
`create-database` task.  For example:

```shell
yarn create-database
```

### Running Queries

The queries that were generated in the previous step can be submitted
to the running CouchDB cluster by the `run_queries.sh` script.  This
uses a `couchdb.conf` file that holds the values for the various
parameters.  For example:

```shell
user=adm
password=pass
host=127.0.0.1
port=15984
db=test
```

The queries could be then run as follows.  Note that they run in
parallel, on all the CPUs that are available on the system.

```shell
cat queries.json | ../validation/run_parallel.sh > responses.json
```

### Custom Cluster Setup (Optional)

Sometimes it is desired to launch nodes from multiple versions of
CouchDB that are configured as a single cluster.  In this case, place
and build each of the CouchDB versions in different directories and
start them.

First version, which will create `http://127.0.0.1:15984`:

```console
$ cd /tmp/couchdb1
$ dev/run -a adm:pass -n 1 --no-join
...
```

Second version, which will create `http://127.0.0.1:25984` and
`http://127.0.0.1:35984` effectively:

```console
$ cd /tmp/couchdb2
$ dev/run -a adm:pass -n 3 --no-join
...
```

If the different versions are run on the same computer, the first one
that starts to listen on a specific port will only be assigned to it.
As a consequence, if the clusters are started after each other with
increasing number of nodes, the unusued ports will be gradually
allocated for the newer nodes.

The configure the cluster among the nodes, run `setup_cluster.sh`.
This script uses the `couchdb.conf` configuration file has the values
for the necessary parameters.  For example:

```shell
user=adm
password=pass
host=127.0.0.1
port=15984
node_ports="25984 35984"
```

Here the `ports` tells on which port the setup coordinator node could
be found, and `node_ports` gives information about the ports for the
rest of the nodes.  Currently, it is assumed that all the nodes are
run on the same host.

## Result Comparison

The results can be compared as regular plain-text files, for example,
with the help of the `diff` tool.  When the exact responses do not
matter, it is recommended the discard the fields other than `docs` and
use that version for the comparison.

```shell
jq -rc '.docs' responses.ref.json > responses.ref.docs.json
jq -rc '.docs' responses.exp.json > responses.exp.docs.json
diff -u responses.ref.docs.json responses.exp.docs.json
```
