

var values = {
	paths: 5,
	minPoints: 5,
	maxPoints: 15,
	minRadius: 30,
	maxRadius: 90
};

var hitOptions = {
	segments: true,
	stroke: true,
	fill: false,
	tolerance: 5
};

var selectionRectangleScale=null;
var selectionRectangleScaleNormalized=null;
var selectionRectangleRotation=null;

var segment, path;
var movePath = false;


function TransformTool(paper){
	this.paper = paper;
	this.selectedPoint = null;
	this.selectedHandle = null;
	this.selectedStroke = null;
	this.activeSelectionRectangle = null;
	this.tool = new paper.Tool();
	this.copy_mode = false;

	this.tool.distanceThreshold = 10;

	var scope = this;

	this.tool.onMouseDown = function(event){
		segment = path = null;
		var hitResult = paper.project.hitTest(event.point, hitOptions);
		
		if (!hitResult){
			scope.clear();
			return;
		}
		
		if (hitResult) {
			console.log("MD", hitResult.type, hitResult.item.name);
			path = hitResult.item;

			if(!_.isNull(scope.activeSelectionRectangle) && scope.activeSelectionRectangle.id != path.id && scope.selectedStroke.id != path.id){
				scope.activeSelectionRectangle.remove();
				scope.activeSelectionRectangle = null;	
			}	


			if(_.isNull(scope.activeSelectionRectangle)){

				scope.activeSelectionRectangle = designer.nodes.at(path.id).selection_rectangle;
				scope.activeSelectionRectangle.position = path.bounds.center.clone();
				
				scope.activeSelectionRectangle.rotation = 0;

				var ref_x = scope.activeSelectionRectangle.wire.ref_x ? -1 : 1;
				var ref_y = scope.activeSelectionRectangle.wire.ref_y ? -1 : 1;

				scope.activeSelectionRectangle.prevScale = scope.activeSelectionRectangle.ppath.scaling;
				scope.activeSelectionRectangle.prevRot = scope.activeSelectionRectangle.ppath.rotation;
				scope.paper.project.activeLayer.addChild(scope.activeSelectionRectangle);
				scope.selectedStroke = path;
			}

			if((hitResult.type == "stroke" || hitResult.type == "segment") && path.name != "selection rectangle"){ //&& {
				
				console.log("wire select");
				var selected = hitResult.item.selected;

				// toggle selection
				scope.selectAll(false);
				hitResult.item.selected = true;

				scope.selectedStroke = hitResult.item;
				designer.activePath = scope.selectedStroke.id;
				designer.nodes.at(designer.activePath).updateDOM();
			}

			if (hitResult.type == 'segment') {
				if(scope.activeSelectionRectangle != null && path.name == "selection rectangle")
				{
	                console.log('selectionRectangle');
	                if(hitResult.segment.index >= 2 && hitResult.segment.index <= 4)
	                {
	                    selectionRectangleRotation = 0;
	                }
	                else{
						selectionRectangleScale =  0;
	                }
				}
	            else
	                segment = hitResult.segment;
			} 
		}
	
	}
	this.tool.onKeyDown = function(event){
		scope.onKeyDownDefault(event);

		if(event.key == "-" ||event.key == "backspace"){
			if(scope.selectedStroke != null){
				designer.activePath = scope.selectedStroke.id;
				designer.nodes.at(designer.activePath).remove();
				scope.clear();
			}
		}

		if(event.key == "d"){
			if(scope.selectedStroke != null){
				designer.activePath = scope.selectedStroke.id;
				var dp = designer.nodes.at(designer.activePath).duplicate();
				designer.nodes.add(dp.id, dp);
				scope.clear();
			}
		}

		if(event.key == "r"){
			if(scope.selectedStroke != null){
				designer.activePath = scope.selectedStroke.id;
				var dp = designer.nodes.at(designer.activePath);
				dp.reflect_x();
				
			}
		}
		if(event.key == "f"){
			if(scope.selectedStroke != null){
				designer.activePath = scope.selectedStroke.id;
				var dp = designer.nodes.at(designer.activePath);
				dp.reflect_y();
				
			}
		}
		
		scope.copy_mode = event.key == "option";
		return true;
	}

	this.tool.onKeyUp = function(event){	
		scope.copy_mode = event.key == "option";
	}

	this.tool.onMouseUp = function(event){
		selectionRectangleScale = null;
    	selectionRectangleRotation = null;
    	scope.update();		
	}
	// this.tool.onMouseMove = function(event){
	// 	paper.project.activeLayer.selected = false;
	// 	if (event.item)
	// 	{
	// 		event.item.selected = true;
	// 	}
	//     if(scope.activeSelectionRectangle)
	//         scope.activeSelectionRectangle.selected = true;
	// }

	this.tool.onMouseDrag = function(event){
		if (selectionRectangleScale!=null)
		{	
			var path_bounds = scope.activeSelectionRectangle.ppath.bounds.clone();//.expand(10);         
			var diag = event.point.subtract(path_bounds.center.clone()).length;
			var init_diag =  scope.activeSelectionRectangle.wire.init_size;
			
			var ratio = diag/init_diag;
			// var ref_x = scope.activeSelectionRectangle.wire.ref_x ? -1 : 1;
			// var ref_y = scope.activeSelectionRectangle.wire.ref_y ? -1 : 1;
			// console.log("xref", ref_x, "yref", ref_y);


			var rect_ratio = ratio;
			rect_ratio /= scope.activeSelectionRectangle.prevScale.x;
			
		

	        scaling = new paper.Point(ratio, ratio );
	        rect_scaling = new paper.Point(rect_ratio, rect_ratio);

	        scope.activeSelectionRectangle.scaling = rect_scaling;
	        scope.activeSelectionRectangle.ppath.scaling = scaling;
	        return;
		}
		else if(selectionRectangleRotation!=null)
		{
	        rotation = event.point.subtract(selectionRectangle.pivot).angle + 90;
	        scope.activeSelectionRectangle.ppath.rotation = rotation;
	        scope.activeSelectionRectangle.rotation = rotation - scope.activeSelectionRectangle.prevRot ;
	        return;
		}


		if(!_.isNull(scope.activeSelectionRectangle)){
		  scope.activeSelectionRectangle.position.x += event.delta.x;
		  scope.activeSelectionRectangle.position.y += event.delta.y;
		}
		if(!_.isNull(scope.selectedStroke)){
		  scope.selectedStroke.position.x += event.delta.x;
		  scope.selectedStroke.position.y += event.delta.y;
		}
		scope.update();
	}		
}


TransformTool.prototype = {
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
	}
}