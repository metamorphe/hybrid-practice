class Resource < ActiveRecord::Base
	mount_uploader :file, ThermoUploader
end
