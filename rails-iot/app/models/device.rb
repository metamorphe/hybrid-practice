require "ostruct"
class OpenStruct
  def as_json(options = nil)
    @table.as_json(options)
  end
end
class Device < ActiveRecord::Base
    
    def self.data()
        begin
            data = YAML.load_file(Rails.root.join("app/models/device.yml"))
            json = data.to_json
            return JSON.parse(json, object_class: OpenStruct)
        rescue
         return nil
        end
    end
end