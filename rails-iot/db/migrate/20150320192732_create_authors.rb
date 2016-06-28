class CreateAuthors < ActiveRecord::Migration
  def change
    create_table :authors do |t|
      t.integer :swatch_id
      t.integer :feel_id
      t.timestamps
    end
  end
end
