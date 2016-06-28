class AddLayerToSwatches < ActiveRecord::Migration
  def change
    add_column :swatches, :layer_id, :integer
  end
end
