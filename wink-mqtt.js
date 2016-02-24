var mqtt = require('mqtt');
var cp = require('child_process');
var fs = require("fs");
var Tail = require('always-tail');
var mqttBrokerIP = '192.168.0.6';
var mqttBrokerPort = '1883';
var mqttusername = '';
var mqttpassword = '';
var zigbeeAttributes = '1,2';
var zwaveAttributes = '2,3,7,8';
var sqlQuery = 'select d.masterId, s.attributeId, s.value_GET FROM zigbeeDeviceState AS s,zigbeeDevice AS d WHERE d.globalId=s.globalId AND s.attributeId IN (' + zigbeeAttributes + ') UNION select d.masterId, s.attributeId, s.value_SET FROM zwaveDeviceState AS s,zwaveDevice AS d WHERE d.nodeId=s.nodeId AND s.attributeId IN (' + zwaveAttributes + ');';

var client = mqtt.createClient(mqttBrokerPort, mqttBrokerIP, {
    username: mqttusername,
    password: mqttpassword
});
var deviceStatus = {};
// ******* apron database location for 2.19 firmware ********
var aprondatabase = '/database/apron.db';
// ******* apron database location for 2.49 firmware ************
var aprondatabase = '/var/lib/database/apron.db';

var filename = "/tmp/all.log";

var notLocked = true;

var baseMQTT = 'home';
var subscribeTopic = '+/+/+/set';

if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, "");
}

var tail = new Tail(filename, '\n');
tail.on('line', function(data) {
    if (data.indexOf('state changed in device') > 0) {
        checkDatabase();
    }
});

tail.on('error', function(data) {
    console.log("error:", data);
});

var publishStatus = function(d, m, t, v) {
    deviceStatus[d + '/' + m + '/' + t] = v;
    client.publish(d + '/' + m + '/' + t, v, {
        retain: true
    });
};
var runApron = function(args) {
    if (args.length) {
        var options = {
            timeout: 10000,
            killSignal: 'SIGKILL'
        };
        cp.execFile('aprontest', args, options, function(error, stdout, stderr) {
            return (stdout);
        });
    }
}
var setStatus = function(ar, v) {
    if (ar[0] == 'group') {
        var args = ['-u', '-x', ar[1], '-t', ar[2], '-v', v];
    } else if (ar[0] == baseMQTT) {
        var args = ['-u', '-m', ar[1], '-t', ar[2], '-v', v];
    }
    if (typeof args !== 'undefined') {
        runApron(args);
    }
    publishStatus(ar[0], ar[1], ar[2], v);
};
var checkDatabase = function() {
    if (notLocked) {
        notLocked = false;
        var options = {
            timeout: 10000,
            killSignal: 'SIGKILL'
        };
        var theexec = cp.execFile('sqlite3', ['-csv', aprondatabase, sqlQuery], options, function(error, stdout, stderr) {
            if (stdout !== null) {
                notLocked = true;
                var lines = stdout.trim().split("\n");
                for (var i = 0; i < lines.length; i++) {
                    var s = lines[i].split(",");
                    var mqttTerm = baseMQTT + '/' + s[0] + '/' + s[1];

                    if (mqttTerm in deviceStatus) {
                        //console.log(mqttTerm + ':' + deviceStatus[mqttTerm] + ':' + s[2]);
                        if (deviceStatus[mqttTerm] !== s[2]) {
                            //console.log('different#############################################');
                            deviceStatus[mqttTerm] = s[2];
                            publishStatus(baseMQTT, s[0], s[1], s[2]);
                        }
                    } else if (s.length == 3) {
                        deviceStatus[mqttTerm] = s[2];
                        publishStatus(baseMQTT, s[0], s[1], s[2]);
                    }
                }

            }
            //manual check of database every 60 seconds, incase we missed an update in the log
            //timer = setTimeout(checkDatabase, 60000);
            lines = s = mqttTerm = theexec = null;
        });
    }
};

client.on('connect', function() {
    client.subscribe(subscribeTopic);
    checkDatabase();
});

client.on('message', function(topic, message) {
    setStatus(topic.split('/'), message.toString());
});

tail.watch();