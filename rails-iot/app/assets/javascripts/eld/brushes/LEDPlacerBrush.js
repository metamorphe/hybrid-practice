// LEDPlacerBrush
function LEDPlacerBrush(paper){
	var hitOptions = {
		segments: true,
		stroke: true,
		fill: true,
		tolerance: 5
	};
	this.paper = paper;
	this.name = "LEDPlacerBrush";
	this.tool = new paper.Tool();
	var scope = this;
	this.selection = [];

	this.tool.onMouseDown = function(event){
		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult)
			return;

		path = hitResult.item;
		name = Artwork.getPrefix(path);
		console.log(name);
		if(name == "NLED") scope.selection.push(path.id);
	}
	this.tool.onMouseDrag = function(event){
		var drags = CanvasUtil.getIDs(scope.selection);
		var diffs = CanvasUtil.queryPrefix("DIF");
		_.each(drags, function(drag){
			drag.position = drag.position.add(event.delta);

			diff = _.filter(diffs, function(diff){ return diff.contains(drag.position);});
			var rays = CanvasUtil.query(paper.project, {prefix: "RAY", originLight: drag.id});

			// UPDATE RAYS
			_.each(rays, function(r){
				r.position = r.position.add(event.delta);
				if(diff.length == 0) r.opacity = 0;
				else{
					r.opacity = 0.3;
					var dir = new paper.Point(1, 0);
					dir.length = MAX_APA102C_RAY_LENGTH;
					dir.angle = r.originAngle;
					dir = dir.add(drag.position);
					r.lastSegment.point = dir;
					ixts = r.getIntersections(diff[0]);
					if(ixts.length > 0){
						var furthestIxt = _.max(ixts, function(ixt){ return ixt.point.getDistance(drag.position); })
						r.lastSegment.point = furthestIxt.point;
					}
				}
			})
		})
	
	}
	this.tool.onMouseUp = function(event){
		_.each(scope.selection, function(el){
			var rays = CanvasUtil.queryPrefix("RAY");
			_.each(rays, function(r){
				r.opacity = 0.2;
			});
		})
		scope.selection = [];
	}
}

LEDPlacerBrush.prototype = {
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

