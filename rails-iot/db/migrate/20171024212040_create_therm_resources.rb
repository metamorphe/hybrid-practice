class CreateThermResources < ActiveRecord::Migration
  def change
    create_table :therm_resources do |t|
      t.integer :user_id
      t.string :category
      t.string :resource
      t.string :tags
      t.string :string

      t.timestamps null: false
    end
  end
end
