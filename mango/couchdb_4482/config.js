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

import { Int, Enum, Bool } from '../common/query.mjs'
import { Compare, Is, In, NotIn, RegEx, Exists, Size, MaybeNot, OneOf, NonEmptySlice } from '../common/query.mjs'
import { generateFindQuery } from '../common/query.mjs'

const byAge = {
    fields: ['_id', 'age'],
    selector: {
	fields: [
	    { name: 'age', source: Compare(Int({ min: 18, max: 99 })) }
	],
	width: 3,
	depth: 1
    },
    skip: { min: 0, max: 1000 },
    limit: { min: 1, max: 100 },
    sort: [{'age': 'asc'}]
}

const managers = {
    fields: ['_id', 'company'],
    selector: {
	verbatim: {
	    '$and': [{ 'manager': true }, { 'company': {'$exists': true }}]
	}
    },
    skip: { min: 0, max: 1000 },
    limit: { min: 1, max: 100 },
    sort: [{'company': 'asc'}]
}

const generic = {
    fields: ['_id', 'user_id', 'name', 'age', 'location', 'company', 'email', 'manager', 'twitter', 'favorites'],
    selector: {
	fields: [
	    { name: 'user_id', source: Compare(Int({ min: 0, max: 10000 })) },
	    { name: 'name.first', source: Compare(Enum('first_names.txt')) },
	    { name: 'name.last', source: Compare(Enum('last_names.txt')) },
	    { name: 'age', source: Compare(Int({ min: 14, max: 99 })) },
	    { name: 'location.state', source: Compare(Enum('states.txt')) },
	    { name: 'location.city', source: Compare(Enum('cities.txt')) },
	    { name: 'location.address.street', source: Compare(Enum('streets.txt')) },
	    { name: 'location.address.number', source: Compare(Int({ min: 10, max: 10000 })) },
	    { name: 'company', source: Compare(Enum('companies.txt')) },
	    { name: 'email', source: Compare(Enum('emails.txt')) },
	    { name: 'manager', source: Bool() },
	    { name: 'twitter', source: MaybeNot(RegEx('^@.*\.*[0-9]+$')) },
	    { name: 'favorites',
	      source: OneOf([In(NonEmptySlice(['Erlang', 'Lisp', 'Javascript'])),
			     NotIn(NonEmptySlice(['C', 'C++', 'Java'])),
			     Size(Int({ min: 1, max: 3 }))
	      ])
	    }
	],
	width: 4,
	depth: 2
    },
    skip: { min: 0, max: 1000 },
    limit: { min: 1, max: 100 }
}

let config = {
    k6_options: {
	summaryTimeUnit: 'ms',
	summaryTrendStats: ['min', 'max', 'p(95)', 'p(98)', 'p(99)', 'count'],
	discardResponseBodies: true
    },
    workloads: {
	'warm_up': {
	    generator: () => JSON.stringify(generateFindQuery(generic)),
	    duration: '2m',
	    vus: 4
	},
	'covering_index1': {
	    generator: () => JSON.stringify(generateFindQuery(byAge)),
	    duration: '2m',
	    vus: 4,
	    latencyTrend: new Trend('_find_latency (covering index 1)', true)
	},
	'covering_index2': {
	    generator: () => JSON.stringify(generateFindQuery(managers)),
	    duration: '2m',
	    vus: 4,
	    latencyTrend: new Trend('_find_latency (covering index 2)', true)
	},
	'generic': {
	    generator: () => JSON.stringify(generateFindQuery(generic)),
	    duration: '2m',
	    vus: 4,
	    latencyTrend: new Trend('_find_latency (generic)', true)
	}
    },
    protocol: 'http',
    host: '127.0.0.1',
    port: 15984,
    database: 'test',
    username: 'adm',
    password: 'pass',
    randomSeed: 42,
    documentCount: 10000,
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
