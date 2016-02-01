# wink-mqtt
Enable local-control of Rooted Wink Hub running 2.19 firmware with MQTT. Integrates nicely with Home Assistant MQTT lights, switches and sensors. https://home-assistant.io/

The Wink Hub version 2.19 firmware includes Node, but not npm. You will need to run "npm install" on a machine with npm and then copy the files to the Wink with SSH. i.e. ```scp -r ~/wink-mqtt/ root@[wink hub ip address]:/opt/local_control/wink-mqtt/```

For information on rooting the Wink Hub with the UART method https://mattcarrier.com/post/hacking-the-winkhub-part-1/
