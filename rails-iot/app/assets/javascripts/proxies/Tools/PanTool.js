
var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 5
};

var selectionRectangleScaleNormalized=null;


function PanTool(paper){
	this.paper = paper;
	this.selectedCanvasItem = null;
	this.selectedPoint = null;
	this.selectedHandle = null;
	this.selectedStroke = null;
	this.selectedCluster = null;
	this.activeSelectionRectangle = null;


	this.tool = new paper.Tool();
	this.tool.distanceThreshold = 10;

	var scope = this;



	this.tool.onMouseDown = function(event){
		hitResult = scope.paper.project.hitTest(event.point, hitOptions);
		
		if(_.isNull(hitResult)) scope.canvas_item_type = "canvas";
		else{
			path = hitResult.item;
			if(path.name == "selection rectangle") scope.canvas_item_type = "transform";
			else scope.canvas_item_type = "pan";
		} 
		console.log("MouseDown", scope.canvas_item_type);
		scope[scope.canvas_item_type].onMouseDown(event, hitResult, scope);
		scope.update();
	}

	this.tool.onMouseUp = function(event){
		console.log("MouseUp", scope.canvas_item_type);
		scope[scope.canvas_item_type].onMouseUp(event, scope);
		scope.canvas_item_type = null;
		scope.update();
	}

	this.tool.onMouseDrag = function(event){
		console.log("MouseDrag", scope.canvas_item_type);
		scope[scope.canvas_item_type].onMouseDrag(event, scope);
		scope.update();
	}	
	this.tool.onKeyDown = function(event){
		scope.onKeyDownDefault(event);

		if(event.key == "-" ||event.key == "backspace"){
			if(scope.selectedCluster != null){
				console.log("SC", scope.selectedCluster.name, scope.selectedCluster)
				scope.selectedCluster.canvasItem.e_layer.remove(scope.selectedCluster.canvasItem.guid);
				scope.clear();
			}
		}
		
		scope.copy_mode = event.key == "option";
		return true;
	}	
}


PanTool.prototype = {
	enable: function(){

	},
	disable: function(){

	},
	update: function(){
		this.paper.view.update();
	}, 
	clear: function(){
		if(!_.isNull(this.activeSelectionRectangle)){
    		this.activeSelectionRectangle.remove();
    		this.activeSelectionRectangle = null;
    		this.selectAll(false);
			this.selectedStroke = null;
        }
		this.selectedStroke = null;
	},
	selectAll: function(flag){
		this.paper.project.activeLayer.selected = flag;
	}, 
	setSVG: function(svg){
		this.svg = svg;
	},
	transform: {
		onMouseDown: function(event, hitResult, scope){
			console.log(scope.selectedCluster);
			if(scope.selectedCluster && scope.selectedCluster.canvasItem.type == "ArtworkLayerElement"){
				if(designer.art_layer.lock_mode) return;
			}
			// console.log("Transforming");
			// console.log(hitResult.type);


			if(["segment"].indexOf(hitResult.type) != -1){
				scope.activeItem = scope.activeSelectionRectangle.item;
				scope.activeSelectionRectangle.prevScale = scope.activeSelectionRectangle.ppath.scaling;
				
			   	scope.activeSegment = hitResult.segment;

			    if(hitResult.segment.index >= 2 && hitResult.segment.index <= 4)
                    scope.rotating = 0;
                else
					scope.scaling = 0;
			}
		},
		onMouseDrag: function(event, scope){
			if(scope.selectedCluster && scope.selectedCluster.canvasItem.type == "ArtworkLayerElement"){
				if(designer.art_layer.lock_mode) return;
			}
			if(scope.activeSegment){
				var path_bounds = scope.activeSelectionRectangle.ppath.bounds.clone();       
				var diag = event.point.subtract(path_bounds.center.clone()).length;
				var init_diag =  scope.activeSelectionRectangle.item.init_size;
				var ratio = diag/init_diag;
				var rect_ratio = ratio;
				rect_ratio /= scope.activeSelectionRectangle.prevScale.x;
			
				scaling = new paper.Point(ratio, ratio );
				rect_scaling = new paper.Point(rect_ratio, rect_ratio);

				scope.activeSelectionRectangle.scaling = rect_scaling;
				scope.activeSelectionRectangle.ppath.scaling = scaling;
			}	

		},
		onMouseUp: function(event, scope){
			if(scope.selectedCluster && scope.selectedCluster.canvasItem.type == "ArtworkLayerElement"){
				if(designer.art_layer.lock_mode) return;
			}

		}
	},
	canvas: {
		onMouseDown: function(event, hitResult, scope){
			scope.clear();
		},
		onMouseDrag: function(event, scope){
			scope.clear();
		},
		onMouseUp: function(event, scope){
			scope.clear();
		}
	},
	pan:  {
		onMouseDown: function(event, hitResult, scope){
			console.log("PANNING", hitResult.type);
			if(scope.selectedCluster && scope.selectedCluster.canvasItem.type == "ArtworkLayerElement"){
				if(designer.art_layer.lock_mode) return;
			}
			console.log(hitResult.type);
			if(["stroke", "fill", "segment"].indexOf(hitResult.type) != -1){
			
				var cluster = hitResult.item;
				while(_.isUndefined(cluster.canvasItem))
					cluster = cluster.parent;

				if(cluster.canvasItem.type == "ArtworkLayerElement"){
					if(designer.art_layer.lock_mode) return;
				}
				scope.selectedCluster = cluster;

				if(scope.activeSelectionRectangle) scope.activeSelectionRectangle.remove();
				scope.activeSelectionRectangle = cluster.canvasItem.selection_rectangle;
				scope.activeSelectionRectangle.position = cluster.canvasItem.getBounds().center.clone();
				scope.paper.project.activeLayer.addChild(scope.activeSelectionRectangle);

				
				
				
			}
		},
		onMouseDrag: function(event, scope){
			if(scope.selectedCluster && scope.selectedCluster.canvasItem.type == "ArtworkLayerElement"){
				if(designer.art_layer.lock_mode) return;
			}
			if(scope.selectedCluster){
				scope.selectedCluster.position.x += event.delta.x;
				scope.selectedCluster.position.y += event.delta.y;
				scope.activeSelectionRectangle.position.x += event.delta.x;
				scope.activeSelectionRectangle.position.y += event.delta.y;
			}
		},
		onMouseUp: function(event, scope){
			// scope.selectedCluster = null;
		}
	}
}