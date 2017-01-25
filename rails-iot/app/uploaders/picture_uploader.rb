# encoding: utf-8

class PictureUploader < CarrierWave::Uploader::Base
  include Cloudinary::CarrierWave

  # def default_url(*args)
  #   "/user.png"
  # end

  process :convert => 'png'
  process :tags => ['post_picture']
  
  version :hero do
    # eager
    process :resize_to_fill => [800, 400, :center]
  end
  version :original do 
  end

  version :standard do
    # process :eager => true
    resize_to_fit(600, 600 / 4 * 3)
    # process :resize_to_fill => [16 * 18, 9 * 18, :center]
  end
  
  version :large_thumbnail do
    # eager
    resize_to_fill(400, 300)
  end


  version :face_large do
    # eager
    resize_to_fill(500, 500, :face)
  end

  version :thumbnail do
    # eager
    resize_to_fill(300, 300)
  end
  # Generate a 100x150 face-detection based thumbnail, 
  # round corners with a 20-pixel radius and increase brightness by 30%.
  version :circle_thumb do
    resize_to_fill(50, 50)
    # cloudinary_transformation :width => 15, :height => 15, :gravity => :face
  end

   version :tiny do
    # eager
    resize_to_fill(50, 50, :center)
  end

  def public_id
    return model.name
  end  
  # Include RMagick or MiniMagick support:
  # include CarrierWave::RMagick
  # include CarrierWave::MiniMagick

  # Choose what kind of storage to use for this uploader:
  # storage :file
  # storage :fog

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  # def store_dir
  #   "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
  # end

  # Provide a default URL as a default if there hasn't been a file uploaded:
  # def default_url
  #   # For Rails 3.1+ asset pipeline compatibility:
  #   # ActionController::Base.helpers.asset_path("fallback/" + [version_name, "default.png"].compact.join('_'))
  #
  #   "/images/fallback/" + [version_name, "default.png"].compact.join('_')
  # end

  # Process files as they are uploaded:
  # process :scale => [200, 300]
  #
  # def scale(width, height)
  #   # do something
  # end

  # Create different versions of your uploaded files:
  # version :thumb do
  #   process :resize_to_fit => [50, 50]
  # end

  # Add a white list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  # def extension_white_list
  #   %w(jpg jpeg gif png)
  # end

  # Override the filename of the uploaded files:
  # Avoid using model.id or version_name here, see uploader/store.rb for details.
  # def filename
  #   "something.jpg" if original_filename
  # end

end
