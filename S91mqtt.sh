#!/bin/sh

case "${1}" in
start)
echo -n "Starting mqtt..."
/usr/bin/node --max_old_space_size=5 --max-stack-size=5 --max_executable_size=5 /opt/wink-mqtt/wink-mqtt.js >> /var/log/mqtt.log 2>&1
;;
stop)
echo -n "Stopping mqtt..."
killall wink-mqtt.js
;;
restart)
${0} stop
sleep 1
${0} start
;;
*)
echo "Usage: $0 [start|stop|restart]"
;;
esac