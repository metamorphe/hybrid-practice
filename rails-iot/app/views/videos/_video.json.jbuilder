json.extract! video, :id, :file, :user_id, :pad, :slot, :created_at, :updated_at
json.url video_url(video, format: :json)
