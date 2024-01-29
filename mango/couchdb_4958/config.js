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

import encoding from 'k6/encoding'
import { Trend } from 'k6/metrics'

import { genericBy, byAge, managers } from './config.queries.mjs'
import { Enum, generateFindQuery } from '../common/query.mjs'

function fileEnum(filename) {
    return Enum(open(filename, 't'))
}

const generic = genericBy(fileEnum)

let config = {
    k6_options: {
	summaryTimeUnit: 'ms',
	summaryTrendStats: ['min', 'max', 'p(95)', 'p(98)', 'p(99)', 'count'],
	discardResponseBodies: true,
	setupTimeout: '120s'
    },
    workloads: {
	'warm_up': {
	    generator: () => JSON.stringify(generateFindQuery(generic)),
	    duration: '2m',
	    vus: 2
	},
	'generic': {
	    generator: () => JSON.stringify(generateFindQuery(generic)),
	    duration: '5m',
	    vus: 2,
	    latencyTrend: new Trend('_find_latency (generic)', true)
	}
    },
    protocol: 'http',
    host: '127.0.0.1',
    port: 15984,
    database: 'test',
    username: 'adm',
    password: 'pass',
    randomSeed: 4958,
    documents: 'documents.json'
}

config.baseUri = `${config.protocol}://${config.host}:${config.port}`

config.parameters = {
    headers: {
	Authorization: `Basic ${encoding.b64encode(config.username + ":" + config.password)}`,
	'Content-Type': 'application/json',
	Accept: 'application/json',
	Host: `${config.host}:${config.port}`
    }
}

config.indexes = [
    { index: { fields: ['user_id'] }, name: 'user_id' },
    { index: { fields: ['name.last', 'name.first'] }, name: 'name' },
    { index: { fields: ['age'] }, name: 'age' },
    { index: { fields: ['location.state',
			'location.city',
			'location.address.street',
			'location.address.number'] }, name: 'location' },
    { index: { fields: ['company', 'manager'] }, name: 'company_and_manager' },
    { index: { fields: ['manager'] }, name: 'manager' },
    { index: { fields: ['favorites'] }, name: 'favorites' },
    { index: { fields: ['favorites.3'] }, name: 'favorites_3' },
    { index: { fields: ['twitter'] }, name: 'twitter' }
]

export function getConfig() {
    return config
}
