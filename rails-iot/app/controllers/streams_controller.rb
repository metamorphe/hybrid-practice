class StreamsController < ApplicationController
  @@main_api = "http://api.aerisapi.com"
  @@moon_api = "/sunmoon/moonphases/"
  @@sun_api = "/sunmoon/"
  @@tides_api = "/tides/"
  @@forecast_api = "/forecasts/"
  @@zip = "/places/postalcodes/"


  @@default_places = [79936, 94709, 10021, 98101, 33101]
  # @@default_places = [79936]
  # @@default_places = []



  def index
  	@forecasts = {}
  	@@default_places.each do |z|
  		zip_info = get_zip(z) 
  		# name = zip_info[:name]

  		@forecasts[zip_info[:name].gsub(', ', "_").gsub(" ", "_")] = {name: zip_info[:name],  forecast: get_forecast_from_zip(z)}
  	end
  	# @zips = {:el_paso => get_zip(79936)}
  	# @forecast = {:el_paso => get_forecast_from_zip(79936)}
  	# render :json => @forecasts
  	render :layout => "tesla"
  end
  def zip
    zip = params[:id]
    rtn = get_zip(zip)
    # 37.25,-97.25
    render :json => rtn
  end

  def moon
  	p = params['p'] ? params['p']: "berkeley,ca" ;
  	params = {"p" => p}
  	ds = DataStream.new("Moon Phase", "Aeris API point.", @@main_api + @@moon_api, params)
  	@data = ds.to_hash
  	# render :layout => "side-panel"
  	render :json => ds.to_hash
  end

  def tides
  	p = params['place'] ? params['place']: "berkeley,ca" ;
  	params = {"p" => p, "from"=> "-7days", "to" => "now"}
  	ds = DataStream.new("Forecast", "Aeris API point.", @@main_api + @@tides_api, params)
  	@data = ds.ping


    rtn = @data["error"].nil?
    if @data["error"].nil?
      @data = @data["response"][0]
      rtn = @data["periods"].map{|p|  p["heightM"] } #Height in meters
  	else
      rtn = []
    end
    render :json => rtn
  end

  def forecast
    p = params['place'] ? params['place']: "berkeley,ca" ;
    rtn = get_forecast(p)
    render :json => rtn
  end
  private
  def get_forecast_from_zip(id)
  	get_forecast(get_zip(id)[:name])
  end
  def get_forecast(id)
  	params = {"p" => id, "from"=> "now", "to" => "7days", "filter" => "1hr"}
    ds = DataStream.new("Forecast", "Aeris API point.", @@main_api + @@forecast_api, params)
    
    @data = ds.ping
    
    rtn = @data["error"].nil?
    if @data["error"].nil?
      @data = @data["response"][0]
      rtn = @data["periods"].map{|p|  p["avgTempF"] } #Height in meters
    else
      rtn = []
    end
    return rtn
  end
  def get_zip(id)
  	zip = DataStream.new("Zip", "Zip code", @@main_api + @@zip + id.to_s, {})
    @data = zip.ping
    success = @data["error"].nil?
    rtn = {}
    if success
      @data = @data["response"]
      rtn = {code: @data['id'], loc: @data['loc'], name: "#{@data['place']['name']}, #{@data['place']["state"]}, #{@data['place']["country"]}"}
    else
      rtn = {}
    end
    return rtn
  end
end

class DataStream < ApplicationController
	@@client_id = "LIIIK6fH7VH7pAJf2qmeF"
	@@client_secret = "wGiJbBBDghcVKaaa4397IoaR2Ppnm7C3JX2DNCL9"

	def initialize(n, d, api, params)
		@name, @description, @api, @params, @response = n, d, api, params
	end
	
	def authenticate
		@full_params = @params.clone
		@full_params["client_id"] = @@client_id
		@full_params["client_secret"] = @@client_secret
	end

	def get_api_pt
		authenticate
		uri = @full_params.empty? ? @api : @api + "?" + @full_params.map{|k,v| "#{k}=#{v}"}.join('&')
		return URI.escape(uri) 
	end

	def to_hash
    return ping
		# return {"name"=>  @name, "description"=>  @description, "api"=> get_api_pt, "params" => @params,  "response"=>  ping}      
	end

	def ping
		response = JSON.parse(getAPIdata(get_api_pt, false))

		# response = {"success"=>true, "error"=>nil, "response"=>[{"timestamp"=>1394285228, "dateTimeISO"=>"2014-03-08T05:27:08-08:00", "code"=>1, "name"=>"first quarter"}]}
		
  #   if response["success"]
		# 	response = response['response'][0]
	 #  else 
		#   response = response['error'];
		# end
  		return response
  	end 
end