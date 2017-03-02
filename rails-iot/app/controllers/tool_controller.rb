class ToolController < ApplicationController
  
  # def actuator
  #   @files = get_displays()
  #   @ports = get_ports()
  #   # render :json => @ports
  #   render :layout => "full_screen"
  # end
  def composer
    @files = get_displays()
    @ports = get_ports()
    # render :json => @ports
    render :layout => "full_screen"
  end
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



  def visual_block
    directory = "public/uploads/tmp/"
    search = VisualBlock.where('name = ?', params[:name])
    
    @block = search.length > 0 ? search.first : VisualBlock.new
    
    # if params[:json] then
    #   path = File.join(directory, params[:name] + ".json")
    #   File.open(path, "wb") { |f| f.write(params[:json]) }
      
    #   @block.name = params[:name]
    #   @block.data = File.open(path)
    #   @block.save!
    # end

    # if params[:svg] then
    #   path = File.join(directory, params[:name] + ".svg")
    #   File.open(path, "wb") { |f| f.write(params[:svg]) }
      
    #   @block.name = params[:name]
    #   @block.data = File.open(path)
    #   @block.save!
    # end

    if params[:image] then
      path = File.join(directory, params[:name] + ".png")
      image_data = Base64.decode64(params[:image]['data:image/png;base64,'.length .. -1])
      File.open(path, "wb") { |f| f.write(image_data) }
      
      @block.name = params[:name]
      print @block.name
      @block.image.store!( File.open(path))
      if params[:data] then
        @block.data = params[:data];
      end 
      @block.save!
    end

    render :json => params[:name]
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
