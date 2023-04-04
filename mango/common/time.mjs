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

export function make(string) {
    if (string == '') {
	throw new Error('Empty input.')
    }

    const TIME_RE = /^\s*((\d+)h)?((\d+)m)?((\d+)s?)?\s*$/
    const matches = string.match(TIME_RE)

    return {
	hours: (matches[2] != undefined) ? new Number(matches[2]) : 0,
	minutes: (matches[4] != undefined) ? new Number(matches[4]) : 0,
	seconds: (matches[6] != undefined) ? new Number(matches[6]) : 0
    }
}

export function asString(time) {
    let result = ''

    if (time.hours > 0) {
	result += `${time.hours}h`
    }

    if (time.minutes > 0) {
	result += `${time.minutes}m`
    }

    if (time.seconds > 0) {
	result += `${time.seconds}s`
    }

    if (result == '') {
	result = '0s'
    }

    return result
}

export function asSeconds(time) {
    return new Number((time.hours * 3600) + (time.minutes * 60) + time.seconds)
}

export function add(time1, time2) {
    return {
	hours: time1.hours + time2.hours,
	minutes: time1.minutes + time2.minutes,
	seconds: time1.seconds + time2.seconds
    }
}
