class AddMetadataUsers < ActiveRecord::Migration
  def change
  	add_column :users, :name, :string
  	add_column :users, :username, :string
  	add_column :users, :level, :integer, :default => 0
  	add_column :users, :provider, :string
  	add_column :users, :uid, :string

  end
end
