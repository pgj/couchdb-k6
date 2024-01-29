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

import { Int, Enum, Bool } from '../common/query.mjs'
import { Compare, Is, In, NotIn, RegEx, Exists, Size, MaybeNot, OneOf, NonEmptySlice } from '../common/query.mjs'

export function genericBy(fileEnum) {
    return {
	fields: ['_id', 'user_id', 'name', 'age', 'location', 'company', 'email', 'manager', 'twitter', 'favorites'],
	selector: {
	    fields: [
		{ name: 'user_id', source: Compare(Int({ min: 0, max: 10000 })) },
		{ name: 'name.first', source: Compare(fileEnum('first_names.txt')) },
		{ name: 'name.last', source: Compare(fileEnum('last_names.txt')) },
		{ name: 'age', source: Compare(Int({ min: 14, max: 99 })) },
		{ name: 'location.state', source: Compare(fileEnum('states.txt')) },
		{ name: 'location.city', source: Compare(fileEnum('cities.txt')) },
		{ name: 'location.address.street', source: Compare(fileEnum('streets.txt')) },
		{ name: 'location.address.number', source: Compare(Int({ min: 10, max: 10000 })) },
		{ name: 'company', source: Compare(fileEnum('companies.txt')) },
		{ name: 'email', source: Compare(fileEnum('emails.txt')) },
		{ name: 'manager', source: Bool() },
		{ name: 'twitter', source: MaybeNot(RegEx('^@.*[.].*[0-9]+$')) },
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
	skip: { min: 0, max: 10000 },
	limit: { min: 1, max: 200 }
    }
}
