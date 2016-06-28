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
end
