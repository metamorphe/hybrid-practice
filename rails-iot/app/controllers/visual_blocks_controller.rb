class VisualBlocksController < ApplicationController
  before_action :set_visual_block, only: [:show, :edit, :update, :destroy]
  
  def selectors
    @visual_blocks = VisualBlock.selectors
    render :json => @visual_blocks
  end
  # GET /visual_blocks
  # GET /visual_blocks.json
  def index
    @visual_blocks = VisualBlock.all
  end

  # GET /visual_blocks/1
  # GET /visual_blocks/1.json
  def show
  end

  # GET /visual_blocks/new
  def new
    @visual_block = VisualBlock.new
  end

  # GET /visual_blocks/1/edit
  def edit
  end

  # POST /visual_blocks
  # POST /visual_blocks.json
  def create
    @visual_block = VisualBlock.new(visual_block_params)

    respond_to do |format|
      if @visual_block.save
        format.html { redirect_to @visual_block, notice: 'Visual block was successfully created.' }
        format.json { render :show, status: :created, location: @visual_block }
      else
        format.html { render :new }
        format.json { render json: @visual_block.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /visual_blocks/1
  # PATCH/PUT /visual_blocks/1.json
  def update
    respond_to do |format|
      if @visual_block.update(visual_block_params)
        format.html { redirect_to @visual_block, notice: 'Visual block was successfully updated.' }
        format.json { render :show, status: :ok, location: @visual_block }
      else
        format.html { render :edit }
        format.json { render json: @visual_block.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /visual_blocks/1
  # DELETE /visual_blocks/1.json
  def destroy
    @visual_block.destroy
    respond_to do |format|
      format.html { redirect_to visual_blocks_url, notice: 'Visual block was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_visual_block
      @visual_block = VisualBlock.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def visual_block_params
      params.require(:visual_block).permit(:name, :image, :data)
    end
end
