#!/usr/bin/env bash

set -e

BASE="/opt/wink-mqtt"
RC="$BASE/.wink-mqttrc"
CONF="$BASE/wink-mqtt.conf"

# Enable rsyslog.d
grep -q '$IncludeConfig /etc/rsyslog.d/' /etc/rsyslog.conf || echo '$IncludeConfig /etc/rsyslog.d/' >> /etc/rsyslog.conf

# Link wink-mqtt rsyslog config
mkdir -p /etc/rsyslog.d
ln -sf "$CONF" /etc/rsyslog.d/

# Refine monit local-control process matching
sed -i 's/matching "node"/matching "node.*local_control"/' /etc/monitrc

# Ensure at least the server url is set in config
[ -f "$RC" ] && grep -q 'export MQTT_SERVER' "$RC" || {
  echo -n 'Enter mqtt Server url: '
  read MQTT_SERVER
  echo "export MQTT_SERVER=\"$MQTT_SERVER\"" >> "$RC"
}

# Restart rsyslogd
monit restart rsyslogd
