function VectorTool(paper){
	this.paper = paper;
	this.selectedPoint = null;
	this.selectedHandle = null;
	this.selectedStroke = null;
	this.tool = new paper.Tool();

	this.tool.distanceThreshold = 10;

	var scope = this;

	this.tool.onMouseDown = function(event){
		hitResult = scope.paper.project.hitTest(event.point, {stroke: true});
		console.log("HR", hitResult);
		if(! _.isNull(hitResult)){
			
			if(hitResult.type == "stroke"){
				var selected = hitResult.item.selected;

				// toggle selection
				hitResult.item.selected = true;

				scope.selectedStroke = hitResult.item;
				designer.activePath = scope.selectedStroke.id;
				designer.nodes.at(designer.activePath).updateDOM();
			}

		} else{
			scope.selectAll(false);
			scope.selectedStroke = null;
		}
		scope.update();
	}

	this.tool.onMouseUp = function(event){
		scope.update();
	}

	this.tool.onMouseDrag = function(event){
		if(scope.selectedStroke){
			scope.selectedStroke.position.x += event.delta.x;
			scope.selectedStroke.position.y += event.delta.y;
		}
		scope.update();
	}		
}


VectorTool.prototype = {
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