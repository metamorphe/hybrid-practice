class VisualBlock < ActiveRecord::Base
	mount_uploader :image, PictureUploader
	validates :name, :uniqueness => true 
	def self.selectors
		VisualBlock.all
	end

end
