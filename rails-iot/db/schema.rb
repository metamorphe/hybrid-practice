# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20171024212040) do

  create_table "authors", force: :cascade do |t|
    t.integer  "swatch_id"
    t.integer  "feel_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "designs", force: :cascade do |t|
    t.string   "name"
    t.string   "bom"
    t.string   "json"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "feel_swatches", force: :cascade do |t|
    t.string   "name"
    t.integer  "skin"
    t.integer  "structure"
    t.integer  "author"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "layers", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "structure_swatches", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "swatches", force: :cascade do |t|
    t.string   "name"
    t.string   "bump_map"
    t.float    "base_height"
    t.float    "displacement"
    t.float    "height"
    t.float    "width"
    t.float    "depth"
    t.string   "stl"
    t.string   "thumbnail"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "layer_id"
    t.boolean  "is_dynamic",   default: false
  end

  create_table "texture_swatches", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "therm_resources", force: :cascade do |t|
    t.integer  "user_id"
    t.string   "category"
    t.string   "resource"
    t.string   "tags"
    t.string   "string"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string   "email",                  default: "", null: false
    t.string   "encrypted_password",     default: "", null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name"
    t.string   "username"
    t.integer  "level",                  default: 0
    t.string   "provider"
    t.string   "uid"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true

  create_table "videos", force: :cascade do |t|
    t.string   "file"
    t.integer  "user_id"
    t.integer  "pad"
    t.integer  "slot"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "visual_blocks", force: :cascade do |t|
    t.string   "name"
    t.string   "image"
    t.text     "data"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
