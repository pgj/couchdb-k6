#!/usr/bin/env bash

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

source couchdb.conf

# The number of maximum concurrent file handles needs to be increased
# due to how `--keep-order` is implemented for `parallel`.  By
# default, that is 256 on macOS, and `parallel` takes 4 handles per
# job, which only allows 64 concurrent requests.  This configuration
# might not be sufficient when some of the responses take a long time
# and the count of execution units is high, e.g. 10 on a recent
# MacBook Pro.  Making long-running requests time out could be another
# solution but that would complicate the logic further.
ulimit -n 10240

parallel --eta --bar --progress --keep-order \
	 curl -sS -X POST http://"$user":"$password"@"$host":"$port"/"$db"/_find -H \"Content-Type: application/json\" --data '{}' \
    | jq -rc '.'
