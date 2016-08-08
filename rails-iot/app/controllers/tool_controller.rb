class ToolController < ApplicationController
  def index
  	@files = get_displays()
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
  def get_displays
    files = {path: "/artwork/", filenames: Dir.glob("public/artwork/*.svg").collect!{|c| c.split('/')[2..-1].join('/')}}
    files[:filenames].collect!{|f| {:collection => f.split('.')[0].split('-')[0].split('_')[0].titlecase, :filename => f, :title => f.split(".")[0].titlecase}}
    files
  end
end
