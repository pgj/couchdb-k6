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

setup() {
    _port="$1"
    _body="$2"
    curl -sS -X POST http://"$user":"$password"@"$host":"$_port"/_cluster_setup -H "Content-Type: application/json" \
	 --data "$_body"
}

_nodes=$(echo "$port $node_ports" | wc -w | sed 's/[[:space:]]*//')

for _port in $port $node_ports; do
    echo -n 'Enable clustering for '"$host"':'"$_port"' '
    setup "$_port" '{"action":"enable_cluster","bind_address":"0.0.0.0","username":"'"$user"'","password":"'"$password"'","port":'"$_port"',"node_count":'"$_nodes"'}'
done

for _port in $node_ports; do
    echo -n 'Add node '"$host"':'"$_port"' '
    setup "$port" '{"action":"add_node","host":"'"$host"'","port":'"$_port"',"username":"'"$user"'","password":"'"$password"'"}'
done

echo -n 'Finish cluster '
setup "$port" '{"action": "finish_cluster"}'
