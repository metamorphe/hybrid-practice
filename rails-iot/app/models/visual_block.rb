class VisualBlock < ActiveRecord::Base
	mount_uploader :image, PictureUploader
	validates :name, :uniqueness => true 
end
