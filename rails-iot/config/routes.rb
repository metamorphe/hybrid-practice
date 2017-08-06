Rails.application.routes.draw do

  get 'aesthetic_development/network'

  resources :visual_blocks do 
    collection do 
      get 'selectors'
    end
  end

  get 'heat/sketch'
  get 'heat/field'
  get 'heat/generator'

  namespace :tool do
    post 'visual_block'
    get 'index'
    get 'pipeline'
    get 'lens'
    get 'splitter'
    get 'optimal_lens'
    get 'theoretical_testbed'
    get 'index'
    get 'displays'
    get 'start_server'
    get 'dope'
    get 'refract'
    get 'designer'
    get 'system_control'
    get 'aesthetic_actuation'
    get 'tester'
    get 'midi'
  end

  get 'devices/index'

  controller :stream do
    get "stream/moon", to: "streams#moon", :as => "moon"
    get "stream/tides/:place", to: "streams#tides", :as => "tides"
    get "stream/forecast/:place", to: "streams#forecast", :as => "temperature"
    get "stream/zip/:id", to: "streams#zip", :as => "zip"
    get "stream", to: "streams#index"
  end

  get 'circuit/sandbox'
  get 'circuit/june_sandbox'

  resources :designs do
    get 'interface' =>"jig#interface"
  end

  namespace :jig do
    get 'designer', :as => "designer"
    get 'generator', :as => "generator"
    get 'bom', :as => "bom"
    get 'form', :as => "form"
  end

  get 'jig/interface/:id' => "jig#interface",  :as => "jig_interface"
  devise_for :users
  resources :user, :only => ["show"]


  get 'threejs/height_displacement', :as => "pic2stl"
  get 'threejs/environment', :as => "three_env"
  get 'threejs/plane_box', :as => "plane_box"
  get 'threejs/peg', :as => "peg_designer"
  get 'threejs/weaver', :as => "weaver"

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".
  # You can have the root of your site routed with "root"
  root 'application#home'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
