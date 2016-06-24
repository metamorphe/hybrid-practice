# t.string   "name"
# t.string   "bump_map"
# t.float    "base_height"
# t.float    "displacement"
# t.float    "height"
# t.float    "width"
# t.float    "depth"
# t.string   "stl"
# t.string   "thumbnail"
# t.integer  "user_id"
# t.integer  "layer_id"
# t.boolean  "is_dynamic"
# t.datetime "created_at"
# t.datetime "updated_at"


class Swatch < ActiveRecord::Base
	mount_uploader :thumbnail, ThumbnailUploader
	mount_uploader :bump_map, BumpMapUploader
	mount_uploader :stl, StlUploader

	belongs_to :user
	belongs_to :layer

	validates :name, :bump_map, :base_height, :displacement, :height, :width, :depth, :thumbnail, :user_id, :layer_id, :presence => true
	validates :name, :uniqueness => true 
end


