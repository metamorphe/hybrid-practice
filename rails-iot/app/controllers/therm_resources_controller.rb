class ThermResourcesController < ApplicationController
  before_action :set_therm_resource, only: [:show, :edit, :update, :destroy]
  # GET /therm_resources
  # GET /therm_resources.json
  def index
    @therm_resources = ThermResource.all
  end

  # GET /therm_resources/1
  # GET /therm_resources/1.json
  def show
  end

  # GET /therm_resources/new
  def new
    @therm_resource = ThermResource.new
  end

  # GET /therm_resources/1/edit
  def edit
  end

  # POST /therm_resources
  # POST /therm_resources.json
  def create
    @therm_resource = ThermResource.new(therm_resource_params)

    respond_to do |format|
      if @therm_resource.save
        format.html { redirect_to @therm_resource, notice: 'Therm resource was successfully created.' }
        format.json { render :show, status: :created, location: @therm_resource }
      else
        format.html { render :new }
        format.json { render json: @therm_resource.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /therm_resources/1
  # PATCH/PUT /therm_resources/1.json
  def update
    respond_to do |format|
      puts "THERM #{therm_resource_params}"
      if @therm_resource.update(therm_resource_params)
        format.html { redirect_to @therm_resource, notice: 'Therm resource was successfully updated.' }
        format.json { render :show, status: :ok, location: @therm_resource }
      else
        format.html { render :edit }
        format.json { render json: @therm_resource.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /therm_resources/1
  # DELETE /therm_resources/1.json
  def destroy
    @therm_resource.destroy
    respond_to do |format|
      format.html { redirect_to therm_resources_url, notice: 'Therm resource was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_therm_resource
      @therm_resource = ThermResource.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def therm_resource_params
      params.require(:therm_resource).permit(:user_id, :category, :resource, :tags, :string)
    end
end
