#!/usr/bin/env bash

set -e

RC="/opt/wink-mqtt/.wink-mqttrc"
[ ! -f "$RC" ] || source "$RC"
exec /usr/bin/node --max_old_space_size=5 --max-stack-size=5 --max_executable_size=5 /opt/wink-mqtt/wink-mqtt.js
