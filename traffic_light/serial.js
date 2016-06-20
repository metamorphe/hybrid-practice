var SerialPortLib = require('serialport');
var SerialPort = SerialPortLib.SerialPort;
var SERIAL_PORT = '/dev/tty.usbmodem1421';
var BAUDRATE = 9600;
var serialPort = new SerialPort(SERIAL_PORT, {
        baudrate: BAUDRATE,
        parser: SerialPortLib.parsers.readline('\n')
    }, false)

    .on('error', function(err) {
        console.log(err);
    })

    .on('open', function(err) {
        console.log('Serielforbindelse lavet via ' + SERIAL_PORT);
        /* Listen for incoming data */
        // serialPort.on('data', function(data) {
        //    console.log('' + data);
        // });
    })

    .on('data', function (data) {
        console.log('Data: ' + data);
    });

serialPort.openSerialPort = function() {
    serialPort.open();
};

module.exports = serialPort;
