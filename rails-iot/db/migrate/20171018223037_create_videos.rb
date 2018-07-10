class CreateVideos < ActiveRecord::Migration
  def change
    create_table :videos do |t|
      t.string :file
      t.integer :user_id
      t.integer :pad
      t.integer :slot

      t.timestamps null: false
    end
  end
end
