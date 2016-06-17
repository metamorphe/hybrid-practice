// var Device = require('./models/device.js');
var path = require('path');
// var db = require(__dirname + '/../config/db');
// var mongoose = require('mongoose');

module.exports = function(app) {
    // Frontend Routes ===============
    app.get('*', function (req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
    });
}
