class CreateVisualBlocks < ActiveRecord::Migration
  def change
    create_table :visual_blocks do |t|
      t.string :name
      t.string :image
      t.string :data

      t.timestamps
    end
  end
end
