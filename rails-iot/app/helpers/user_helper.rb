module UserHelper
	def glyph icon, options={}
		"<span class='#{options[:class]} glyphicon glyphicon-#{icon}' type='#{options[:type]}' title='#{options[:title]}'></span>".html_safe
	end
	def image_tag_check(img, options={})
		if not img.nil? and FileTest.exist?("#{Rails.root}/public/#{img}") 
		  image_check = image_tag("#{img}",options)
		elsif Stl.load_server_development
		  image_check = image_tag("#{img}",options)
		else
			# image_check = "POPO"
	  		image_check = image_tag("placeholder.gif", options)
		end
		image_check
	end
end
