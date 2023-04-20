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

function enumGenerator(input) {
    const t = typeof(input)
    let values = undefined
    switch (t) {
    case 'object':
	values = new Array(...input)
	break
    case 'string':
	const contents = open(input, 't')
	values = contents.split(/\r?\n/)
	break
    default:
    }
    return {
	id: Symbol('enum'),
	generator: (_) => { return randomElem(values) }
    }
}

export const Int = (range) => {
    return {
	idq: Symbol('integer'),
	generator: (_) => { return randomInt(new Number(range.min), new Number(range.max)) }
    }
}

export const Enum = enumGenerator
export const Bool = () => enumGenerator([true, false])
export const Constant = (x) => enumGenerator([x])

export const Compare = (input) => {
    const operand = input.pivot || input
    return {
	id: Symbol('compare'),
	generator: (context) => {
	    let overlay = {}
	    if (input.operators != undefined) {
		overlay.comparisonOperators = input.operators
	    }
	    return randomComparison(Object.assign(context, overlay), operand)
	}
    }
}

export const Is = (value) => {
    return {
	id: Symbol('is'),
	generator: (_) => { return value }
    }
}

export const In = (values) => {
    return {
	id: Symbol('in'),
	generator: (context) => { return { '$in': values.generator(context) } }
    }
}

export const NotIn = (values) => {
    return {
	id: Symbol('nin'),
	generator: (context) => { return { '$nin': values.generator(context) } }
    }
}

export const Size = (operand) => {
    return {
	id: Symbol('size'),
	generator: (context) => { return { '$size': new Number(operand.generator(context)) } }
    }
}

export const Exists = (shouldExist) => {
    return {
	id: Symbol('exists'),
	generator: (_) => { return { '$exists': new Boolean(shouldExist) } }
    }
}

export const RegEx = (regex) => {
    return {
	id: Symbol('regex'),
	generator: (_) => { return { '$regex': new RegExp(regex).source } }
    }
}

export const OneOf = (operands) => {
    return {
	id: Symbol('one_of'),
	generator: (context) => { return randomElem(new Array(...operands)).generator(context) }
    }
}

export const Not = (operation) => {
    return {
	id: Symbol('not'),
	generator: (context) => { return { '$not': operation.generator(context) } }
    }
}

export const MaybeNot = (operation) => {
    return {
	id: Symbol('maybe_not'),
	generator: (context) => {
	    if (randomInt(0, 100) < 50)
		return { '$not': operation.generator(context) }
	    else
		return operation.generator(context)
	}
    }
}

export const NonEmptySlice = (array) => {
    return {
	id: Symbol('non_empty_slice'),
	generator: (_) => { return randomNonEmptySlice(new Array(...array)) }
    }
}

function randomInt(low, high) {
    const l = Math.min(low, high)
    const h = Math.max(low, high)
    return l + Math.round(Math.random() * (h - l))
}

function randomElem(array) {
    return array[randomInt(0, array.length - 1)]
}

function subarrays(array) {
    return array.reduce((subs, x) => subs.concat(subs.map(y => [x,...y])), [[]])
}

function randomNonEmptySlice(array) {
    return randomElem(subarrays(array).slice(1))
}

function randomComparison(context, t) {
    const operator = randomElem(context.comparisonOperators)
    const operand = t.generator(context)
    let object = {}
    object[operator] = operand
    return object
}

function randomPrimitive(context) {
    let object = {}
    const f = randomElem(context.fields)
    object[f.name] = f.source.generator(context)
    return object
}

function randomCombination(context, level) {
    if (level <= 0 || randomInt(0, 100) < context.depthCutChance)
	return randomPrimitive(context)

    let object = {}
    let operands = []
    let operandsCount = randomInt(2, context.width)

    for (let i = 0; i < operandsCount; i++)
	operands.push(randomCombination(context, level - 1))

    object[randomElem(context.combinatorOperators)] = operands
    return object
}

const defaults = {
    fields: ['_id'],
    selector: {
	fields: [],
	width: 2,
	depth: 0,
	combinatorOperators: ['$and'],
	comparisonOperators: ['$lt', '$lte', '$eq', '$ne', '$gte', '$gt'],
	depthCutChance: 50 // %
    },
    skip: { min: 0, max: 1000 },
    limit: { min: 5, max: 25 }
}

export function defaultParameters() {
    return defaults
}

export function generateFindQuery(userParameters) {
    let parameters = Object.assign(Object.assign({}, defaults), userParameters)
    parameters.selector = Object.assign(Object.assign({}, defaults.selector), userParameters.selector)
    let response = parameters
    if (parameters.selector.verbatim != undefined) {
	response.selector = parameters.selector.verbatim
    }
    else {
	response.selector = randomCombination(
	    parameters.selector,
	    randomInt(0, parameters.selector.depth)
	)
    }
    response.fields = randomNonEmptySlice(parameters.fields)
    response.limit = randomInt(parameters.limit.min, parameters.limit.max)
    response.skip = randomInt(parameters.skip.min, parameters.skip.max)
    return response
}

export function generateFindQueries(parameters, count) {
    let queries = []

    for (let i = 0; i < count; i++)
	queries.push(generateFindQuery(parameters))

    return queries
}

export function dump(item) {
    console.log(JSON.stringify(item))
}
