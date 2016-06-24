// HeatBrush
function HeatBrush(paper){
	this.paper = paper;
	this.name = "HeatBrush";

	this.tool = new paper.Tool();
	var scope = this;
	this.tool.onMouseDown = function(event){
		scope.path = new paper.Path({
			strokeColor:  "#fe6e4b",
			strokeWidth: 20,
			shadowColor: "#fe6e4b",
		    shadowBlur: 80,
		    shadowOffset: new Point(0, 0)
		});
		scope.path.addSegment(event.point);
	}
	this.tool.onMouseDrag = function(event){
		scope.path.addSegment(event.point);
	}
	this.tool.onMouseUp = function(event){
		scope.path.addSegment(event.point);
		scope.path.smooth();
		scope.path = null;
	}
}

HeatBrush.prototype = {
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

