/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import http from 'k6/http'
import { check, randomSeed } from 'k6'
import { Counter } from 'k6/metrics'
import exec from 'k6/execution'

import * as time from './time.mjs'

export function optionsFrom(config) {
    let options = config.k6_options
    let startTime = time.make('0s')

    options.scenarios = {}

    Object.entries(config.workloads).forEach(([name, workload]) => {
	options.scenarios[name] = {
	    executor: 'constant-vus',
	    startTime: time.asString(startTime),
	    duration: workload.duration,
	    vus: workload.vus
	}
	startTime = time.add(startTime, time.make(workload.duration))
    })

    if (config.randomSeed != undefined) {
	randomSeed(config.randomSeed)
    }

    return options
}

export function setupFrom(config) {
    const documents = open(config.documents)
    return () => {
	const url = `${config.baseUri}/${config.database}`
	const exists = http.head(url, config.parameters)

	// Without an empty body, the Content-Type will be changed from `application/json` :-(
	if (exists.status == 200) {
	    http.del(url, '', config.parameters)
	}
	else if (exists.status != 404) {
	    throw new Error(`Failed to remove existing database, status: ${exists.status}.`)
	}

	const create = http.put(url, '', config.parameters)

	if (create.status != 201) {
	    throw new Error(`Failed to properly create the database, status: ${create.status}.`)
	}

	const bulkDocsUrl = `${url}/_bulk_docs`
	const bulkBatchSize = 500
	const docs = JSON.parse(documents)['docs']

	for (let offset = 0; offset < docs.length; offset += bulkBatchSize) {
	    const batch = JSON.stringify({
		'docs': docs.slice(offset, offset + bulkBatchSize)
	    })
	    const docsCreated = http.post(bulkDocsUrl, batch, config.parameters)

	    if (docsCreated.status != 201) {
		throw new Error(`Failed to populate the database with documents, offset: ${offset}, status: ${docsCreated.status}.`)
	    }
	}

	const indexUrl = `${url}/_index`

	config.indexes.forEach((index) => {
	    const body = JSON.stringify(index)
	    const indexCreated = http.post(indexUrl, body, config.parameters)

	    if (indexCreated.status != 200) {
		throw new Error(`Failed to create index: ${index.name}`)
	    }
	})

	return {
	    dbUrl: url,
	    findUrl: `${url}/_find`,
	}
    }
}

export function teardownFrom(config) {
    return (data) => {
	http.del(data.dbUrl, '', config.parameters)
    }
}

const httpStatus = {
    200: new Counter('HTTP 200 OK'),
    400: new Counter('HTTP 400 Bad Request'),
    401: new Counter('HTTP 401 Unauthorized'),
    404: new Counter('HTTP 404 Not Found'),
    500: new Counter('HTTP 500 Internal Server Error'),
    misc: new Counter('HTTP XXX Should Not Happen')
}

export function defaultFrom(config) {
    return (data) => {
	const scenario = config.workloads[exec.vu.tags['scenario']]
	const body = scenario.generator()
	const result = http.post(data.findUrl, body, config.parameters)
	check(result, { 'OK': (r) => r.status === 200 })

	switch (result.status) {
	case 200:
	case 400:
	case 401:
	case 404:
	case 500:
	    httpStatus[result.status].add(1)
	    break
	default:
	    httpStatus.misc.add(1)
	    break
	}

	switch (result.status) {
	case 400:
	    console.log(`Bad parameters: ${body}`)
	    break
	case 500:
	    console.log(`Internal error: ${body}`)
	    break
	}

	if (scenario.latencyTrend != undefined) {
	    scenario.latencyTrend.add(result.timings.duration)
	}
    }
}
