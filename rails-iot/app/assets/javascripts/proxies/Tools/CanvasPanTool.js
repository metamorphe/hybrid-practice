function CanvasPanTool(paper){
	this.paper = paper;
	


	this.tool = new paper.Tool();

	var scope = this;


	this.tool.onMouseDown = function(event){
		
	}

	this.tool.onMouseUp = function(event){
	
	}

	this.tool.onMouseDrag = function(event){
		console.log("Dragging", paper.view.center);
		paper.project.activeLayer.position.x += event.delta.x;
		paper.project.activeLayer.position.y += event.delta.y;
		scope.update();
	}		
}


CanvasPanTool.prototype = {
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