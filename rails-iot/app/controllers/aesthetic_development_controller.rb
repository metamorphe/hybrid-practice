class AestheticDevelopmentController < ApplicationController
  def network
  	@files = get_displays()
  	render :layout => "full_screen"
  end
end
