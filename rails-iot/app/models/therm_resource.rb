class ThermResource < ActiveRecord::Base
	mount_uploader :resource, ThermoUploader
  
end
