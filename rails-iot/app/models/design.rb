class Design < ActiveRecord::Base
	mount_uploader :json, JsonUploader
end
