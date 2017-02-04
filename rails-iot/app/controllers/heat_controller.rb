class HeatController < ApplicationController
  def sketch
  	@files = get_displays()
  	render :layout => "full_screen"
  end
  def field
  	@files = get_displays()
  	render :layout => "full_screen"
  end
  def generator
  	@files = get_displays()
  	render :layout => "full_screen"
  end
end
