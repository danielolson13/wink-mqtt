
var mqtt = require('mqtt')
var readline = require('readline')
var child_process = require('child_process')

function intEnv (name, def) {
  var val = parseInt(process.env[name], 10)
  return isNaN(val) ? def : val
}

var MQTT_SERVER = process.env.MQTT_SERVER || 'mqtt://localhost'
var TOPIC_BASE = process.env.WINK_MQTT_TOPIC_BASE || 'home'
var APRON_BIN = process.env.WINK_MQTT_APRON_BIN || '/usr/sbin/aprontest'
var APRON_TIMEOUT = intEnv('WINK_MQTT_APRON_TIMEOUT', 10000)
var DELAY = intEnv('WINK_MQTT_DELAY', 100)
var DEBOUNCE = intEnv('WINK_MQTT_DEBOUNCE', 1000)

var client
var cache = {}
var syncing = {}

function bail (err) {
  if (!err) return process.exit(0)
  console.error(err)
  process.exit(1)
}

function apron (args, done) {
  child_process.execFile(APRON_BIN, args, {
    timeout: APRON_TIMEOUT,
    killSignal: 'SIGKILL'
  }, function (err, stdout, stderr) {
    if (err) return bail(err)
    if (done) done(stdout, stderr)
  })
}

function publish (dev, key, val) {
  var topic = [TOPIC_BASE, dev, key].join('/')
  if (!client || !client.connected || cache[topic] === val) return
  cache[topic] = val
  client.publish(topic, val, {retain: true})
}

function _sync (dev) {
  var start = syncing[dev]
  apron(['-l', '-m', dev], function (stdout) {
    var m, re = /^\s*(\d+) \|(?:[^|]+\|){3}\s*([^|]+) \|.*$/gm
    while (m = re.exec(stdout)) {
      publish(dev, m[1], m[2])
    }
    if (syncing[dev] > start) return setTimeout(_sync.bind(undefined, dev), DEBOUNCE)
    delete syncing[dev]
  })
}

function sync (dev) {
  var sync = !syncing[dev]
  syncing[dev] = (syncing[dev] || 0) + 1
  if (sync) _sync(dev)
}

function syncAll () {
  apron(['-l'], function (stdout) {
    stdout.split('\n\n')[0].split('\n').forEach(function (line, i) {
      var m = line.match(/^\s*(\d+) \|/)
      if (m) setTimeout(sync.bind(undefined, m[1]), i * DELAY)
    })
  })
}

client = mqtt.connect(MQTT_SERVER, {keepalive: 120})
  .on('error', bail)
  .on('close', function () {
    cache = {}
  })
  .on('connect', function () {
    client.subscribe(TOPIC_BASE + '/+/+/set')
    syncAll()
  })
  .on('message', function (topic, msg) {
    var m = topic.replace(TOPIC_BASE, '').split('/')
    apron(['-u', '-m', m[1], '-t', m[2], '-v', msg.toString()])
  })

readline.createInterface({input: process.stdin, output: process.stdout})
  .on('close', bail)
  .on('line', function (line) {
    var m = line.match(/state changed in device (\d+)$/)
    if (m) sync(m[1])
  })
