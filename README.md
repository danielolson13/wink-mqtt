# wink-mqtt
Enable local-control of Rooted Wink Hub running 2.19 firmware with MQTT. Integrates nicely with Home Assistant MQTT lights, switches, sensors, etc. https://home-assistant.io/

The Wink Hub version 2.19 firmware includes Node, but not npm. You will need to run "npm install" on a machine with npm and then copy the files to the Wink with SSH. i.e. ```scp -r ~/wink-mqtt/ root@[wink hub ip address]:/opt/local_control/wink-mqtt/```

For information on rooting the Wink Hub with the UART method https://mattcarrier.com/post/hacking-the-winkhub-part-1/

wink-mqttt uses "aprontest" on the Wink Hub to communicate with the Z-Wave, Zigbee and lutron radios. Each paired device is given a MasterID. wink-hub subscribes to an MQTT server for 'set' events. Topics are organized by 'home/[MASTERID]/[ATTRIBUTE]/set' ```mosquitto_pub -t 'home/20/3/set' -v 'TRUE'```
To view MasterID and attribues you can run ```aprontest -l``` then ```aprontest -l -m20```

wink-mqtt tails the log file(there is probably a much better way) for updates and then querys the sqllite3 database /database/apron.db for the current values of the devices
