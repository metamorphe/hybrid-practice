require 'em-websocket'
require 'json'
require 'serialport'

EventMachine.run do
  @channel = EM::Channel.new
  @port = 3015
  baud_fast = 9600 * 12
  baud_normal = 9600 * 2
  baud_slow = 9600
  @baud = baud_normal
  # @usb = Dir.glob("/dev/tty.usb*")
  @usb = Dir.glob("/dev/tty.AestheticAquarium-DevB")
  if @usb.length == 0 
    puts "NO PORTS DETECTED"
    return
  else
    puts "RUNNING " + @usb[0]
    puts "@ "+ @baud.to_s
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
  # ip = Socket.ip_address_list.find {|a| a.ipv4? ? !(a.ipv4_private? || a.ipv4_loopback?) : !(a.ipv6_sitelocal? || a.ipv6_linklocal? || a.ipv6_loopback?) }.ip_address

  # print ip + "\n"
  ip="localhost"
  EM::WebSocket.start(:host => ip, :port => @port) do |ws|
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
