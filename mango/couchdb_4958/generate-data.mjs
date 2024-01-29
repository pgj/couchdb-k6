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

import { faker } from '@faker-js/faker'
import * as fs from 'fs'

const documentCount = 100000
const documentsJSON = 'documents.json'

function generateDocument(index) {
    let docid = faker.helpers.unique(faker.datatype.uuid)
    let firstName = faker.name.firstName()
    let lastName = faker.name.lastName()
    let email = faker.helpers.unique(() => faker.internet.email(firstName, lastName))
    return {
	_id: docid,
	user_id: index,
	name: {
	    first: firstName,
	    last: lastName
	},
	age: faker.datatype.number({ min: 18, max: 90 }),
	location: {
	    state: faker.address.state(),
	    city: faker.address.cityName(),
	    address: {
		street: faker.address.street(),
		number: faker.datatype.number({ min: 10, max: 10000 })
	    }
	},
	company: faker.company.name(),
	email: email,
	manager: faker.datatype.boolean(),
	twitter: "@" + email.split("@")[0],
	favorites: faker.helpers.arrayElements(['C', 'C++', 'Python', 'Ruby', 'Erlang', 'Lisp'])
    }
}

let container = {}
container.docs = []

for (let i = 0; i < documentCount; i++) {
    container.docs.push(generateDocument(i))
}

fs.writeFileSync(documentsJSON, JSON.stringify(container))

const plural = documentCount > 1 ? 's were' : ' was'
console.log(`${documentCount} randomly generated document${plural} saved to "${documentsJSON}".`)

console.log('Collecting dictionaries for adaptive query generation: ')

let firstNames = new Set()
let lastNames = new Set()
let states = new Set()
let cities = new Set()
let streets = new Set()
let companies = new Set()
let emails = new Set()
let twitters = new Set()

container.docs.forEach((item) => {
    firstNames.add(item.name.first)
    lastNames.add(item.name.last)
    states.add(item.location.state)
    cities.add(item.location.city)
    streets.add(item.location.address.street)
    companies.add(item.company)
    emails.add(item.email)
    twitters.add(item.twitter)
})

function dump(output, set) {
    const writeStream = fs.createWriteStream(output)

    writeStream.on('finish', () => {
	console.log(`- ${output}`);
    })

    writeStream.on('error', (err) => {
	console.error(`There was an error writing the file "${output}": "${err}".`)
    })

    set.forEach((value) => { writeStream.write(`${value}\n`) })
    writeStream.end()
}

dump('first_names.txt', firstNames)
dump('last_names.txt', lastNames)
dump('states.txt', states)
dump('cities.txt', cities)
dump('streets.txt', streets)
dump('companies.txt', companies)
dump('emails.txt', emails)
dump('twitters.txt', twitters)
