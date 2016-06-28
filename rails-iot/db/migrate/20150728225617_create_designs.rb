class CreateDesigns < ActiveRecord::Migration
  def change
    create_table :designs do |t|
      t.string :name
      t.string :bom
      t.string :json

      t.timestamps
    end
  end
end
