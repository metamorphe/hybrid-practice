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
	this.hue_step = (360 /8);
	this.hue = -this.hue_step; // start at red
	var scope = this;
	this.selection = [];

	this.tool.onMouseDown = function(event){
		var diffs = CanvasUtil.queryPrefix('DIF');
		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult)
			return;

		path = hitResult.item;
		name = Artwork.getPrefix(path);
		
		if(name == "NLED") scope.selection.push(path.id);
		else{
			if(event.event.metaKey){
				// ADD LED
				var led = new paper.Path.Rectangle({
					name: "NLED: APA102C", 
					size: new paper.Size(Ruler.mm2pts(LED_WIDTH), Ruler.mm2pts(LED_WIDTH)),
					position: event.point, 
					fillColor: "white", 
					parent: CanvasUtil.queryPrefix("ELD")[0]
				});

				scope.addRays(diffs, led);
				scope.selection.push(led.id);
				return;
			}
		}
		// REMOVE LED
		if(event.event.metaKey){
			var rays = CanvasUtil.query(paper.project, {prefix: "RAY", originLight: path.id});
			_.each(rays, function(r){ r.remove(); });
			path.remove();
			scope.selection = [];
		}
	}
	this.tool.onMouseMove = function(event){
		var hitResult = project.hitTest(event.point, hitOptions);
		if (hitResult){
			path = hitResult.item;
			name = Artwork.getPrefix(path);
			if(name == "NLED"){
				if(event.event.metaKey){
					$('#myCanvas').css('cursor', 'not-allowed');
					return;
				}else{
					$('#myCanvas').css('cursor', 'move');
					return;
				}
			}
		}
		if(event.event.metaKey){
			$('#myCanvas').css('cursor', 'copy');
			
			if (hitResult){
				path = hitResult.item;
				name = Artwork.getPrefix(path);
				if(name == "NLED") $('#myCanvas').css('cursor', 'alias');
			}

			console.log("CURSOR SET TO", $('#myCanvas').css('cursor'));
		}else{
			$('#myCanvas').css('cursor', 'pointer');
		}
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
					dir.length = Ruler.mm2pts(MAX_APA102C_RAY_LENGTH);
					dir.angle = r.originAngle;
					dir = dir.add(drag.position);
					r.lastSegment.point = dir;
					ixts = r.getIntersections(diff[0]);
					if(ixts.length > 0){
						var closestIxT = _.min(ixts, function(ixt){ return ixt.point.getDistance(drag.position); })
						r.lastSegment.point = closestIxT.point.clone();
					}
				}
			})
		})
	
	}
	this.tool.onMouseUp = function(event){
		_.each(scope.selection, function(el){
			var rays = CanvasUtil.queryPrefix("RAY");
			_.each(rays, function(r){
				if(r.opacity == 0) return;
				r.opacity = 0.2;
			});
		})
		scope.selection = [];
	}
}

LEDPlacerBrush.prototype = {
	enable: function(){
	   var scope = this;
	   diffs = CanvasUtil.queryPrefix("DIF");
	   leds = CanvasUtil.queryPrefix("NLED");
	   _.each(leds, function(led){
	   		scope.addRays(diffs, led);
	   });
	},
	disable: function(){
	   var scope  = this;
	},
	update: function(){
		paper.view.update();
	}, 
	clear: function(){
	
	}, 
	addRays: function(diffs, led){
		var scope = this;
		var diffs = _.filter(diffs, function(diff){ return diff.contains(led.position);});
		if(diffs.length ==  0) return;
				
		var rays = CanvasUtil.query(paper.project, { prefix: "RAY", originLight: led.id });
		if(rays.length != 0){
			CanvasUtil.set(rays, "position", led.position.clone());
		} else{
			// CREATE RAYS
			var rays = _.range(-180, 180, 1);
			var color = new paper.Color("red");

			scope.hue = (scope.hue + scope.hue_step) % 360;
			color.hue = scope.hue;

			color.saturation = 0.8;
			color.brightness = 0.8;

			var led_color = color.clone();
			led_color.brightness = 1;


			led.set({
				fillColor: led_color, 
				strokeColor: led_color, 
				strokeWidth: 1, 
				colorID: led_color
			})

			rays = _.map(rays, function(theta){
				var point = new paper.Point(1, 0);
				point.length = Ruler.mm2pts(MAX_APA102C_RAY_LENGTH);
				point.angle = theta;
				var line = new paper.Path.Line({
					name: "RAY: Cast",
					from: led.position.clone(), 
					to: led.position.clone().add(point), 
					strokeColor: color, 
					strokeWidth: 1,
					opacity: 0.2, 
					parent: CanvasUtil.queryPrefix("ELD")[0], 
					originLight: led.id, 
					originAngle: theta,
					hue: scope.hue, 
					// applyMatrix: false
					// shadowColor: color,
					// shadowBlur: 30,
				  // shadowOffset: new Point(1, 1)
				});
				line.pivot = line.firstSegment.point.clone();;
				
				ixts = line.getIntersections(diffs[0]);
				if(ixts.length > 0)
				line.lastSegment.point = ixts[0].point;
			});
			
		}
		// UPDATE
		leds = CanvasUtil.queryPrefix("NLED");
		   _.each(leds, function(led, i){
				led.bringToFront();
		   });
	}
}

