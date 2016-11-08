require 'em-websocket'
require 'json'
require 'serialport'

ports_config = {

}
# sp = SerialPort.new('/dev/tty.usbmodem1421', 9600, 8, 1, SerialPort::NONE)
sp = SerialPort.new('/dev/tty.usbmodem1411', 9600, 8, 1, SerialPort::NONE)


def message_from(sp)
    message = sp.gets
    message.chop!
  return { "msg" => message }
end

def start_connection(sp, port)
  print "Starting server at #{port}\n"
  EM::WebSocket.start(:host => "0.0.0.0", :port => port) do |ws|
    ws.onopen{
      print "OPENED!\n"
    }
    ws.onclose{
      print "CLOSING\n"
    }
    ws.onmessage do |msg|
        print "SERVER SAYS:" + msg + "\n"
        sp.write(msg);
        
        msg =  message_from(sp).to_json
        print "ARDUINO SAYS:" + msg + "\n"
        ws.send "ARDUINO SAYS:" + msg + "\n"
    end
  end
end

start_connection(sp, 3015)

