require 'em-websocket'
require 'json'
require 'serialport'

# sp = SerialPort.new('/dev/tty.usbmodem1421', 19200 * 6, 8, 1, SerialPort::NONE)
sp = SerialPort.new('/dev/tty.usbmodem1421', 9600, 8, 1, SerialPort::NONE)
print "Starting server at 3015\n"

def message_from(sp)
    message = sp.gets
    message.chop!
    print "MSG:" +  message
  return { "msg" => message }
end

EventMachine::WebSocket.start(:host => '0.0.0.0', :port => 3015) do |ws|
  ws.onopen    { puts "WebSocket opened";}
  ws.onclose   { puts "WebSocket closed" }
 
  ws.onmessage do |msg|
            # ws.send message_from(sp).to_json
      ws.send(msg);
      sp.write(msg)
            print "MSGFS:" + msg
  end
end
