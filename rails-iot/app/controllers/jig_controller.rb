class JigController < ApplicationController
  def designer

  	render :layout => "full_screen"
  end

  def generator
    render :layout => "full_screen"
  end
  def form
  	@files = get_primitives()
  	render :layout => "full_screen"
  end
  def interface
    @design = Design.find(params[:id]).to_json.html_safe
    @files = get_primitives()
    render :layout => "full_screen"
  	# render :json => @files
  end

  def bom
  end


  # HELPER METHODS
  def get_primitives
    files = {path: "/primitives/", filenames: Dir.glob("public/primitives/*").collect!{|c| c.split('/')[2..-1].join('/')}}
    files[:filenames].collect!{|f| {:collection => f.split('.')[0].split('-')[0].split('_')[0].titlecase, :filename => f, :title => f.split(".")[0].titlecase}}
    files
  end
end
