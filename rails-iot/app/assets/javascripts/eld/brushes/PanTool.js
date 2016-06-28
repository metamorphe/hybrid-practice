// PanTool
function PanTool(paper){
	this.paper = paper;
	this.name = "PanTool";

	this.tool = new paper.Tool();
	var scope = this;
	var pan_start;
	this.tool.onMouseDown = function(event){
		pan_start = event.point
	}
	this.tool.onMouseDrag = function(event){
		var a = pan_start.subtract(event.point);
    	a = a.add(paper.view.center);
    	paper.view.center = a
	}
	this.tool.onMouseUp = function(event){
	}
}

PanTool.prototype = {
	enable: function(){
	   var scope = this;
	},
	disable: function(){
	   var scope  = this;
	},
	update: function(){
		paper.view.update();
	}, 
	clear: function(){
	
	}
}

