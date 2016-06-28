class RenameAuthorToAuthorId < ActiveRecord::Migration
  def change
  	rename_column(:swatches, :author, :user_id)
  end
end
