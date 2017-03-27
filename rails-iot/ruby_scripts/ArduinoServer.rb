require 'em-websocket'
require 'json'
require 'serialport'

EventMachine.run do
  @channel = EM::Channel.new
  @port = 3015
  baud_fast = 9600 * 12
  baud_normal = 9600
  @baud = baud_fast
  @usb = Dir.glob("/dev/tty.usb*")
  if @usb.length == 0 
    puts "NO PORTS DETECTED"
    return
  else
    puts "RUNNING " + @usb[0]
    @usb = @usb[0]
  end

  @sp = SerialPort.new(@usb, @baud, 8, 1, SerialPort::NONE)
  @sid = nil
  EM::defer do
    loop do
      puts data = @sp.readline("\n")
      next if !data or data.to_s.size < 1
      @channel.push data
    end
  end
  EM::WebSocket.start(:host => "0.0.0.0", :port => @port) do |ws|
    ws.onopen{
      print "OPENED!\n"
      @sid = @channel.subscribe { |msg| ws.send msg }
      @channel.push "#{@sid} connected!"
      
    }
    ws.onclose{
      print "CLOSING\n"
      if @sid
        @channel.unsubscribe(@sid)
      end
    }
    ws.onmessage do |msg|
        print "SERVER SAYS:" + msg + "\n"
        @sp.write(msg);
    end
  end

  puts "SERVER STARTED"
end
