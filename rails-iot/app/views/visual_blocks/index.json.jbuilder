json.array!(@visual_blocks) do |visual_block|
  json.extract! visual_block, :id, :name, :image, :data
  json.url visual_block_url(visual_block, format: :json)
end
