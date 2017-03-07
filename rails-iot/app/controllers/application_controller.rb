class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def home 
  end
  def getAPIdata(url, isJSON)
    url = URI(url.to_s)
    # if @@cache.exist?(url.to_s)
    #   p "Loading cache #{url.to_s}"
    #   return @@cache.read(url.to_s)
    # else
      http = Net::HTTP.new(url.host, url.port)  
      request = Net::HTTP::Get.new url.request_uri  
      res = http.request request
      res = res.code == "200" ? (isJSON ? JSON.parse(res.body) : res.body) : -1
      # @@cache.write(url.to_s, res)
      # p "Storing cache #{url.to_s}"
      return res
    # end  
  end
  private
  def get_displays
    files = {filenames: Dir.glob("public/luminaires/*.svg").collect!{|c| c.split('/')[2..-1].join('/')}}
    files[:filenames].collect!{|f| {:collection => f.split('.')[0].split('-')[0].split('_')[0].titlecase, path: "/luminaires/", :name => f, :title => f.split(".")[0].titlecase}}
    
    files1 = {filenames: Dir.glob("public/actuation/*.svg").collect!{|c| c.split('/')[2..-1].join('/')}}
    files1[:filenames].collect!{|f| {:collection => f.split('.')[0].split('-')[0].split('_')[0].titlecase, path: "/actuation/", :name => f, :title => f.split(".")[0].titlecase}}
   

    files2 = {filenames: Dir.glob("public/userstudy/examples/*.svg").collect!{|c| c.split('/')[2..-1].join('/')}}
    files2[:filenames].collect!{|f| {:collection => f.split('.')[0].split('-')[0].split('_')[0].titlecase, path: "/userstudy/", :name => f, :title => f.split(".")[0].titlecase}}
    
    [files[:filenames], files1[:filenames], files2[:filenames]].flatten
  end
end
