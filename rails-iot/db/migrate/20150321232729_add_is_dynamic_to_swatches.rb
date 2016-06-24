class AddIsDynamicToSwatches < ActiveRecord::Migration
  def change
    add_column :swatches, :is_dynamic, :boolean, default: false
  end
end
