class ToolController < ApplicationController
  def system_control
    @files = get_displays()
    @ports = get_ports()
    # render :json => @ports
    render :layout => "full_screen"
  end
  def designer
    @files = get_displays()
    # render :json => @files
    render :layout => "full_screen"
  end
  def index
  	@files = get_displays()
  	render :layout => "full_screen"
  end
  def refract
     render :layout => "full_screen"
  end
  def dope
     render :layout => "full_screen"
  end
  def lens
    @files = get_displays()
    render :layout => "full_screen"
  end
  def theoretical_testbed
    @files = get_displays()
    render :layout => "full_screen"
  end
  def splitter
    @files = get_displays()
    render :layout => "full_screen"
  end
  def optimal_lens
    @files = get_displays()
    render :layout => "full_screen"
  end
  def pipeline
    @files = get_displays()
    render :layout => "full_screen"
  end

  def displays
    @files = get_displays()
    render :json => @files
  end

 def start_server
   # NOTE: currently doesn't work :(
   dir = system('ruby ./ruby_scripts/ArduinoServer.rb &')
   render :json => {msg: "I started server", debug: dir}
 end

 # HELPER METHODS
 
  def get_ports
    ports = ["/dev/tty.usbmodem*"] #"/dev/tty.HC*", 
    ports.map!{|p| Dir[p]}
    ports.flatten!
  end
end
