// CircuitBrush
function CircuitBrush(paper){
	this.paper = paper;
	this.name = "CircuitBrush";

	this.tool = new paper.Tool();
	
	this.path = null;
	var scope = this;
	this.tool.onMouseDown = function(event){
		scope.path = new paper.Path({
			strokeWidth: 4, 
			strokeColor: "#eeb84b"
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

CircuitBrush.prototype = {
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

