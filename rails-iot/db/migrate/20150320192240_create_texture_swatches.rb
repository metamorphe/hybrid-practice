class CreateTextureSwatches < ActiveRecord::Migration
  def change
    create_table :texture_swatches do |t|

      t.timestamps
    end
  end
end
