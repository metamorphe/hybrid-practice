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

ActiveRecord::Schema.define(version: 20171024175501) do

  create_table "authors", force: :cascade do |t|
    t.integer  "swatch_id"
    t.integer  "feel_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "designs", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.string   "bom",        limit: 255
    t.string   "json",       limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "feel_swatches", force: :cascade do |t|
    t.string   "name",        limit: 255
    t.integer  "skin"
    t.integer  "structure"
    t.integer  "author"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "layers", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "structure_swatches", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "swatches", force: :cascade do |t|
    t.string   "name",         limit: 255
    t.string   "bump_map",     limit: 255
    t.float    "base_height"
    t.float    "displacement"
    t.float    "height"
    t.float    "width"
    t.float    "depth"
    t.string   "stl",          limit: 255
    t.string   "thumbnail",    limit: 255
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "layer_id"
    t.boolean  "is_dynamic",               default: false
  end

  create_table "texture_swatches", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "users", force: :cascade do |t|
    t.string   "email",                  limit: 255, default: "", null: false
    t.string   "encrypted_password",     limit: 255, default: "", null: false
    t.string   "reset_password_token",   limit: 255
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",                      default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip",     limit: 255
    t.string   "last_sign_in_ip",        limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name"
    t.string   "username"
    t.integer  "level",                              default: 0
    t.string   "provider"
    t.string   "uid"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true

  create_table "visual_blocks", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.string   "image",      limit: 255
    t.text     "data"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
