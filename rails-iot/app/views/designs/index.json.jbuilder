json.array!(@designs) do |design|
  json.extract! design, :id, :name, :bom, :json
  json.url design_url(design, format: :json)
end
