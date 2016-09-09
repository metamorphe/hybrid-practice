// LEDPlacerBrush
function LEDPlacerBrush(paper){
	var hitOptions = {
		segments: true,
		stroke: true,
		fill: true,
		tolerance: 5
	};
	this.enabled = false;
	this.paper = paper;
	this.name = "LEDPlacerBrush";

	this.tool = new paper.Tool();
	this.tool.holder = this;
	this.hue_step = (360 /8);
	this.hue = -this.hue_step; // start at red
	var scope = this;
	this.selected_stroke = null;
	this.selection = [];
	this.target_selection_mode = false;
	this.prev_style = {}

	this.tool.onMouseDown = function(event){
		var diffs = CanvasUtil.queryPrefix('DIF');
		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult)
			return;

		path = hitResult.item;
		name = Artwork.getPrefix(path);
		console.log("TSM", scope.target_selection_mode)
		if(scope.target_selection_mode){
			if(["DDS", "DIF"].indexOf(name) != -1){
				this.selected_stroke = path.id;
				path.strokeColor = "yellow";
				path.strokeWidth = 2;
				scope.target_selection_mode = false;

				var led_id = parseInt($(".badge").attr('cid'));
				if(! _.isNaN(led_id)){
					var led = CanvasUtil.getIDs([led_id])[0];
					led.forceTarget = path.id;
					// $('#select-target').removeClass('btn-primary');
					$('#select-target').addClass('btn-success');
					$("#target-view").attr("data-target", led.forceTarget);
				}
			}
		}

		if(name == "NLED"){
			scope.selection.push(path.id);
			scope.led_prev_style = {strokeColor: path.strokeColor, strokeWidth: path.strokeWidth};
			path.set({strokeWidth: 2, strokeColor: "#00A8E1"});

			cc.updatePanel(path.id);
			if(path.forceTarget){
				var forced_diff = CanvasUtil.getIDs([path.forceTarget])[0];
				scope.prev_style = {strokeColor: forced_diff.strokeColor, strokeWidth: forced_diff.strokeWidth};
				forced_diff.set({strokeWidth: 2, strokeColor: "yellow"})
			} else{
				var norm_diff = CanvasUtil.getIDs([path.target])[0];
				scope.prev_style = {strokeColor: norm_diff.strokeColor, strokeWidth: norm_diff.strokeWidth};
				norm_diff.set({strokeWidth: 2, strokeColor: "yellow"})
			}
		}
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

			// console.log("CURSOR SET TO", $('#myCanvas').css('cursor'));
		}else{
			$('#myCanvas').css('cursor', 'pointer');
		}
	}
	this.tool.onMouseDrag = function(event){
		var drags = CanvasUtil.getIDs(scope.selection);
		var diffs = CanvasUtil.queryPrefix("DIF");
		_.each(drags, function(drag){
			drag.position = drag.position.add(event.delta);


			var cdiffs = _.flatten([CanvasUtil.queryPrefix("DIF"), CanvasUtil.queryPrefix("DDS")]);
			contained_by = _.filter(cdiffs, function(diff){ return diff.contains(drag.position);});
			main_container = _.min(contained_by, function(diff){ return diff.position.getDistance(drag.position);});
			
			if(drag.forceTarget){
				//ONLY CAST RAYS IN THE FORCE TARGET
				// IT IF CONSIDERED OUTSIDE IF ITS IN ANOTHER DIFFUSER
				//DONT CAST RAYS IN DIFFUSER WITHIN FORCE TARGET
				// console.log("FORCE TARGET", drag.forceTarget);
				
				forced_diff = CanvasUtil.getIDs([drag.forceTarget])[0];
				if(! forced_diff.contains(drag.position)){
					diffs = [];
				} else{
					var cdiffs = _.flatten([CanvasUtil.queryPrefix("DIF")]);
					diffusers_in_force_target = _.filter(cdiffs, function(diff){ return  forced_diff.id != diff.id && !diff.contains(forced_diff.position) && forced_diff.contains(diff.position);});
					console.log("DIFF IN FT", forced_diff.id, _.map(diffusers_in_force_target, function(d){return d.id}));
					
					in_another_diffuser = _.compact(_.map(diffusers_in_force_target, function(diff){ return diff.contains(drag.position);})).length > 0;
					
					if(in_another_diffuser) 
						diffs = [];
					else
						diffs = _.flatten([forced_diff, diffusers_in_force_target]);
				}
				
				// var others = CanvasUtil.queryPrefix("DIF");
				// others = _.filter(others, function(diff){
				// 	return ! diff.contains(drag.position)
				// });
				// console.log("OTHERS", _.map(others, function(o){return o.name; }));
				
				// diffs = _.flatten([forced_diff, others]);
				// console.log("FORCED", forced_diff.name)
				// // is it inside?
				// if(! forced_diff.contains(drag.position)){
				// 	console.log("NOT IN FORCED");
				// 	diffs = [];
				// }
				// if(forced_diff.id != main_container.id){
				// 	console.log("INSIDE, BUT NOT MAIN", main_container.name);
				// 	diffs = [];
				// }
				
				
			}
			// diffs = _.filter(diffs, function(diff){ return diff.contains(drag.position);});
			var rays = CanvasUtil.query(paper.project, {prefix: "RAY", originLight: drag.id});
			
			// UPDATE RAYS
			console.log("DIFF?", _.map(diffs, function(o){return o.name; }));
				
			_.each(rays, function(r){
				r.position = r.position.add(event.delta);
				if(diffs.length == 0) r.opacity = 0;
				else{
					r.opacity = 0.3;
					var dir = new paper.Point(1, 0);
					dir.length = Ruler.mm2pts(MAX_APA102C_RAY_LENGTH);
					dir.angle = r.originAngle;
					dir = dir.add(drag.position);
					r.lastSegment.point = dir;
	
					ixts = CanvasUtil.getIntersections(r, diffs);
					
					if(ixts.length > 0){
						var closestIxT = _.min(ixts, function(ixt){ return ixt.point.getDistance(r.position); })
						r.lastSegment.point = closestIxT.point.clone();
					}
				}
			})
		})
	
	}
	this.tool.onMouseUp = function(event){
		bb.update();
		vm.update();
		_.each(scope.selection, function(el){
			cc.updatePanel(path.id);
			path.set(scope.prev_style);
			var rays = CanvasUtil.queryPrefix("RAY");
			_.each(rays, function(r){
				if(r.opacity == 0) return;
				r.opacity = 0.2;
			});
			path.strokeColor = "#00A8E1"
		})
		scope.selection = [];
	}
}

LEDPlacerBrush.prototype = {
	enable: function(){
		// console.log("ENABLING LED PLACE BRUSH");
	   var scope = this;
	   diffs = CanvasUtil.queryPrefix("DIF");
	   leds = CanvasUtil.queryPrefix("NLED");
	   _.each(leds, function(led){
	   		scope.addRays(diffs, led);
	   });
	   paper.view.update();
	   this.enabled = true;
	   vm.update();
	},
	disable: function(){
	   var scope  = this;
	   this.enabled = false;
	},
	update: function(){
	   var scope = this;
	   diffs = CanvasUtil.queryPrefix("DIF");
	   leds = CanvasUtil.queryPrefix("NLED");
	   _.each(leds, function(led){
	   		scope.addRays(diffs, led);
	   });
	   paper.view.update();
	}, 
	clear: function(){
	
	}, 
	addRays: function(diffs, led){
		var scope = this;
		var target  = _.filter(diffs, function(diff){ return diff.contains(led.position);});
		target = _.min(target, function(t){ return t.position.getDistance(led.position)});
		led.target = target.id;

		if(diffs.length ==  0) return;
				
		var rays = CanvasUtil.query(paper.project, { prefix: "RAY", originLight: led.id });
		if(rays.length != 0){
			CanvasUtil.set(rays, "position", led.position.clone());
			// var color = _.isUndefined(led.colorID) ?  "#FFFFFF": led.colorID;
			// if(vm.getCurrentView() == "WHITE_RAYS") color = "#FFFFFF"
			// CanvasUtil.set(rays, "strokeColor", color);
			CanvasUtil.set(rays, "strokeColor", led.fillColor);
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
			var was_white = CanvasUtil.queryPrefix("NLED");
			was_white = was_white.length > 0 && was_white[0].fillColor.equals("#FFFFFF");
			var fill = vm.getCurrentView() == "WHITE_RAYS" || was_white  ? "#FFFFFF" : led_color
			led.set({
				fillColor: fill, 
				strokeColor: fill, 
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
					hue: scope.hue
				});
				line.pivot = line.firstSegment.point.clone();;
				
				ixts = CanvasUtil.getIntersections(line, diffs);


				if(ixts.length > 0){
					var closestIxT = _.min(ixts, function(ixt){ return ixt.point.getDistance(line.position); })
					line.lastSegment.point = closestIxT.point.clone();
				}
				return line;
			});
			if(vm.getCurrentView() == "WHITE_RAYS")
				CanvasUtil.set(rays, "strokeColor", "#FFFFFF");
			
		}
		// UPDATE
		leds = CanvasUtil.queryPrefix("NLED");
		   _.each(leds, function(led, i){
				led.bringToFront();
		   });
	}
}

