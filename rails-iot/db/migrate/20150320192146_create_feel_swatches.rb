class CreateFeelSwatches < ActiveRecord::Migration
  def change
    create_table :feel_swatches do |t|
      t.string :name
      t.integer :skin
      t.integer :structure
      t.integer :author
      t.text :description

      t.timestamps
    end
  end
end
