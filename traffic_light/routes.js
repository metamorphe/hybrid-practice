// var Device = require('./models/device.js');
var path = require('path');
var serialPort = require('./serial.js');
// var db = require(__dirname + '/../config/db');
// var mongoose = require('mongoose');

module.exports = function(app) {
  // Backend Routes ===============
  /**
   * Expect a json in the form
   * { color_string: 'c,<id>,<r>,<g>,<b>' }
   * Send the string to serial
   */
    app.post('/update', function(req, res) {
        if (req.body === null) {
            res.send('No JSON provided. .').status(400).end();
        } else {
          var json = req.body;
          serialPort.write(json.rgb_string + '\n');
          res.status(200).send(json.rgb_string).end();
        }
    });

    // Frontend Routes ===============
    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
    });
}
