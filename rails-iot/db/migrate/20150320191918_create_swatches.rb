class CreateSwatches < ActiveRecord::Migration
  def change
    create_table :swatches do |t|
      t.string :name
      t.string :bump_map
      t.float :base_height
      t.float :displacement
      t.float :height
      t.float :width
      t.float :depth
      t.string :stl
      t.string :thumbnail
      t.integer :author

      t.timestamps
    end
  end
end
