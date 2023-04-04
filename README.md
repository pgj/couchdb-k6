# CouchDB Performance Tests via k6

This repository contains a set of scripts to orchestrate various kinds
of performance tests for works related to
[CouchDB](https://couchdb.apache.org/).  It uses [k6](https://k6.io/)
from Grafana Labs and two dialects of JavaScript:

- Scripts for `k6` assumed its own JavaScript engine,
  [`goja`](https://github.com/dop251/goja).

- Scripts outside `k6` are implemented using
  [Node.js](https://nodejs.org/).

On macOS, `k6` can be installed via Homebrew as follows, along with
`yarn` and `nodejs`:

```shell
brew install k6 yarn nodejs
```
