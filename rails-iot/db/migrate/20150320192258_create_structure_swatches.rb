class CreateStructureSwatches < ActiveRecord::Migration
  def change
    create_table :structure_swatches do |t|

      t.timestamps
    end
  end
end
