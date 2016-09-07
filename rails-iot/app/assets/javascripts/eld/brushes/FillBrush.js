// FillBrush
function FillBrush(paper){
	var hitOptions = {
		segments: true,
		stroke: true,
		fill: true,
		tolerance: 5
	};
	this.paper = paper;
	this.name = "FillBrush";

	this.tool = new paper.Tool();

	var scope = this;
	this.selection = [];


	this.tool.onMouseDown = function(event){
		var diffs = CanvasUtil.queryPrefix('DIF');
		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult)
			return;

		path = hitResult.item;
		name = Artwork.getPrefix(path);
		
		if(name == "NLED") scope.selection.push(path);
		_.each(scope.selection, function(s){

			s.fillColor = cp.getCurrentColor();
			s.strokeColor = cp.getCurrentColor();
			s.colorID = cp.getCurrentColor();
		})
				
		paper.view.update();
	}
	this.tool.onMouseDrag = function(event){
		var diffs = CanvasUtil.queryPrefix('DIF');
		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult)
			return;

		path = hitResult.item;
		name = Artwork.getPrefix(path);
		
		if(name == "NLED") scope.selection.push(path);
		_.each(scope.selection, function(s){
			s.fillColor = cp.getCurrentColor();
			s.strokeColor = cp.getCurrentColor();
		})
		paper.view.update();
	}

	this.tool.onMouseUp = function(event){
		scope.selection = [];
	}
}

FillBrush.prototype = {
	enable: function(){
	   var scope = this;
	   var rays = CanvasUtil.queryPrefix("RAY");
	   CanvasUtil.set(rays, "visible", false);
	   paper.view.update();
	   cp.show();
	},
	disable: function(){
	   var scope  = this;
	   cp.hide();
	},
	update: function(){
		paper.view.update();
	}, 
	clear: function(){
	
	}
}
