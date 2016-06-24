



function AnchorPointTool(paper){
	this.paper = paper;
	this.selectedPoint = null;
	this.selectedHandle = null;
	this.selectedStroke = null;
	this.tool = new paper.Tool();

	this.tool.distanceThreshold = 10;
	
	var scope = this;

	var hitOptions = {
		segments: true,
		stroke: true,
		handles: true,
		tolerance: 5
	};
	this.tool.onMouseDown = function(event){
		hitResult = scope.paper.project.hitTest(event.point, hitOptions);
		console.log(hitResult);
		if(! _.isNull(hitResult)){
			scope.selectedStroke = hitResult.item;

			if(hitResult.type == "segment"){
				scope.selectedPoint = hitResult.segment.point;
				var fullySelected = hitResult.segment.point.fullySelected;
				scope.selectAll(false);

				if(fullySelected)
					hitResult.item.selected = false;
				else if(selected)
					hitResult.item.fullySelected = true;
				else
					hitResult.item.selected = true;
			}
			else if(hitResult.type == "handle-in"){
				scope.selectedHandle = hitResult.segment.handleIn;
				scope.selectedPoint = null;
			}
			else if(hitResult.type == "handle-out"){
				scope.selectedHandle = hitResult.segment.handleOut;
				scope.selectedPoint = null;
			}
			else if(hitResult.type == "stroke"){
				var selected = hitResult.item.selected;
				var fullySelected = hitResult.item.fullySelected;
				scope.selectAll(false);

				if(fullySelected)
					hitResult.item.selected = false;
				else if(selected)
					hitResult.item.fullySelected = true;
				else
					hitResult.item.selected = true;

				scope.selectedStroke = hitResult.item;
				designer.activePath = scope.selectedStroke.id;
				designer.nodes.at(designer.activePath).updateDOM();
				designer.nodes.at(designer.activePath).updateHandles();
			}
		} else{
			scope.selectAll(false);
			scope.selectedStroke = null;
			// scope.selectedPoint = null;
			// scope.selectedHandle = null;
		}
		scope.update();
	}

	this.tool.onMouseUp = function(event){
		// scope.selectedPoint = null;
		scope.selectedHandle = null;
		// scope.selectedStroke = null;

		scope.update();
	}

	this.tool.onMouseDrag = function(event){
		if(scope.selectedHandle){
			scope.selectedHandle.x += event.delta.x;
			scope.selectedHandle.y += event.delta.y;
		}
		else if(scope.selectedPoint){
			scope.selectedPoint.x += event.delta.x;
			scope.selectedPoint.y += event.delta.y;
		}
		
		scope.update();

		if(designer.activePath){
			designer.nodes.at(designer.activePath).updateDOM();
			Fluke.calculateCircuitState();
		}

	}
	this.tool.onKeyDown = function(event){
		scope.onKeyDownDefault(event);

		console.log("delete? ", scope.selectedPoint, scope.selectedStroke)
		if(event.key == "-" ||event.key == "backspace"){
			if(scope.selectedPoint != null && scope.selectedStroke != null){
				scope.selectedStroke.getNearestLocation(scope.selectedPoint).segment.remove();
			}
		}
		
		scope.copy_mode = event.key == "option";
		return true;
	}

	this.tool.onKeyUp = function(event){	
		scope.copy_mode = event.key == "option";
	}	
}


AnchorPointTool.prototype = {
	update: function(){
		this.paper.view.update();
	}, 
	clear: function(){

	},
	selectAll: function(flag){
		this.paper.project.activeLayer.selected = flag;
	}, 
	setSVG: function(svg){
		this.svg = svg;
	}
}