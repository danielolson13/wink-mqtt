# wink-mqtt
Enable local-control of Rooted Wink Hub running 2.66 firmware with MQTT. Integrates nicely with Home Assistant MQTT lights, switches, sensors, etc. https://home-assistant.io/

The Wink Hub version 2.49 firmware includes NodeJS, but not npm. You will need to run "npm install" on a machine with npm and then copy the files to the Wink with SSH. i.e. 

    scp -r ~/wink-mqtt/ root@[wink hub ip address]:/opt/wink-mqtt/
  
To have wink-mqtt.js application run at start up copy the "mqtt" start up script to /etc/rc.d/init.d/mqtt 

    cp /opt/wink-mqtt/mqtt /etc/rc.d/init.d/mqtt
    chmod 755 /etc/rc.d/init.d/mqtt
  
You will want to also use monit to monitor if the wink-mqtt process is running and restart if it crashes. 

    cat /opt/wink-mqtt/monit-mqtt >> /etc/monitrc

##How do I root the Wink Hub?
Matt Carrier has a good article on rooting and getting SSH access to the Wink Hub with the UART method https://mattcarrier.com/post/hacking-the-winkhub-part-1/
https://www.exploitee.rs/index.php/Wink_Hub%E2%80%8B%E2%80%8B

##How wink-mqtt works
wink-mqttt uses the "aprontest" binary on the Wink Hub to communicate with the Z-Wave, Zigbee and Lutron radios. Each paired device is given a MasterID. wink-hub subscribes to an MQTT server for 'set' events. Topics are organized by 'home/[MASTERID]/[ATTRIBUTE]/set' 

    mosquitto_pub -t 'home/20/3/set' -v 'TRUE'
    
To view MasterID and attribues you can run ```aprontest -l``` then ```aprontest -l -m20```

wink-mqtt tails the log file(there is probably a much better way) for state change messages and then querys the sqllite3 database "apron.db" for the current values of the devices, those updates are then publised back to the MQTT server 'home/MASTERID/ATTRIBUTE' with their current value.

##Why the Wink Hub?
It's cheap, rootable and has Z-Wave, Zigbee, Lutron, Wifi and Bluetooth radios.

Please feel free to contribute, this is working but by no means a perfect solution.
