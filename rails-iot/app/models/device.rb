class Device < ActiveRecord::Base
    
    def self.data()
        begin
            data = YAML.load_file(Rails.root.join("app/models/device.yml"))
            json = data.to_json
            return JSON.parse(json)#, object_class: OpenStruct)[:devices]
        rescue
         return nil
        end
    end
end