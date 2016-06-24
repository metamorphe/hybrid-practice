// MagicWandBrush
function MagicWandBrush(paper){
	this.paper = paper;
	this.name = "MagicWandBrush";

	this.tool = new paper.Tool();
	var scope = this;
	this.tool.onMouseDown = function(event){
		scope.path = new paper.Path({
			strokeWidth: 12, 
			strokeColor: cp.getCurrentColor()
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

MagicWandBrush.prototype = {
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

