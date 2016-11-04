require 'em-websocket'
require 'json'
require 'serialport'

# sp = SerialPort.new('/dev/tty.usbmodem1421', 9600, 8, 1, SerialPort::NONE)
sp = SerialPort.new('/dev/tty.usbmodem1411', 9600, 8, 1, SerialPort::NONE)
print "Starting server at 3015\n"

def message_from(sp)
    message = sp.gets
    message.chop!
  return { "msg" => message }
end

EventMachine::WebSocket.start(:host => '0.0.0.0', :port => 3015) do |ws|
  ws.onopen    { 
    msg =  message_from(sp).to_json
    # ws.send msg
    print "MSGFA:" + msg + "\n"
  }
  # ws.onclose   { puts "WebSocket closed" }
  ws.onmessage do |msg|
      print "MSGFS:" + msg + "\n"
      sp.write(msg);
      
      msg =  message_from(sp).to_json
      print "MSGFA:" + msg + "\n"
  end
end
