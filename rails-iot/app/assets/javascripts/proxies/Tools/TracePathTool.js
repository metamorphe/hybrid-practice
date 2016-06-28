var path;
var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 0
};
TracePathTool.SHORT_MESSAGE = "You are shorting your circuit. Avoid crossing any paths or connecting to terminals that aren't the same color (polarity).";

function TracePathTool(paper){
	this.paper = paper;
	this.selectedPoint = null;
	this.selectedHandle = null;
	this.selectedStroke = null;
	this.lastTrace = null;

	this.tool = new paper.Tool();

	this.tool.distanceThreshold = 10;
	
	var scope = this;

	this.tool.onMouseDown = function(event){

		hitResult = scope.paper.project.hitTest(event.point, hitOptions);
		
		if(_.isNull(hitResult)) scope.canvas_item_type = "canvas";
		else{
			path = hitResult.item;
			if(path.name == "terminal") scope.canvas_item_type = "terminal";
			else if(path.name == "sticker_led") scope.canvas_item_type = "led";
			else if(path.name == "trace") scope.canvas_item_type = "trace";
			else scope.canvas_item_type = "canvas";
		} 
		console.log("MouseDown", scope.canvas_item_type);
		scope[scope.canvas_item_type].onMouseDown(event, hitResult, scope);
		scope.update();
    }
	this.tool.onMouseUp = function(event){
		console.log("MouseUp", scope.canvas_item_type);
		scope[scope.canvas_item_type].onMouseUp(event, scope);
		scope.canvas_item_type = null;
		scope.update();
	}

	this.tool.onMouseDrag = function(event){
		console.log("MouseDrag", scope.canvas_item_type);
		scope[scope.canvas_item_type].onMouseDrag(event, scope);
		scope.update();
	}	
	this.tool.onKeyDown = function(event){
		scope.onKeyDownDefault(event);

		if(event.key == "-" ||event.key == "backspace"){
			if(scope.lastTrace != null){
				scope.lastTrace.e_layer.remove(scope.lastTrace.guid);
				scope.clear();
			}
		}

		scope.copy_mode = event.key == "option";
		return true;
	}	

}

var trace;
var start_terminal = null;
var start_trace = null;
TracePathTool.prototype = {
	enable: function(){
		designer.circuit_layer.draw_mode = true;
		designer.circuit_layer.update();
	},
	disable: function(){
		designer.circuit_layer.draw_mode = false;
		designer.circuit_layer.update();
	},
	update: function(){
		this.paper.view.update();
	}, 
	selectAll: function(flag){
		this.paper.project.activeLayer.selected = flag;
	}, 
	setSVG: function(svg){
		this.svg = svg;
	},
	clear: function(){

	}, 
	terminal: {
		onMouseDown: function(event, hitResult, scope){
			var path = hitResult.item;
			start_terminal = path;
			start_terminal.scaling = new paper.Point(1.1, 1.1);
			var direction = path.direction; // terminal location 'n', 's', 'e', 'w'
			// valid
			var validConnections = Fluke.getValidConnections(path);
			_.each(validConnections, function(el, i, arr){
				el.scaling = new paper.Point(1.1, 1.1);
				// el.parent.canvasItem.flashTerminal(el.direction, 5);
			});

			// invalid
			var invalidConnections = Fluke.getInvalidConnections(path);
			_.each(invalidConnections, function(el, i, arr){
				el.scaling = new paper.Point(0.5, 0.5);
			});

			trace = new paper.Path({
				strokeColor: path.style.fillColor,
				strokeWidth: 4,
				name: "trace"
			});
	    	trace.add(event.point);
		}, 
		onMouseDrag: function(event){
			trace.add(event.point);
		}, 
		onMouseUp: function(event, scope){
			
			// Get all conductive elements on the board
			var terminals = designer.circuit_layer.getAllTerminals();
			var traces = designer.traces_layer.getAllTraces();
			var conductive = _.flatten([terminals, traces]);


			// Find all unique non-self referential intersections with those elements
	    	var intersects = TracePathTool.getAllIntersections(trace, conductive);
			intersects = _.uniq(intersects);
	    	intersects = _.reject(intersects, function(el, i, arr){
	    		return el.parent.canvasItem.id == start_terminal.parent.canvasItem.id;
	    	});

	    	// Visual characteristics on MouseUp			
			_.each(terminals, function(el, i, arr){
				el.scaling = new paper.Point(1.0, 1.0);	
			});
			


	    	// Handle intersections
	    	// Hanging trace
	    	if(intersects.length == 0){
	    		start_terminal = null;
	    		trace.simplify();
	    		trace.remove();
	    		scope.lastTrace = designer.traces_layer.add(trace);
	    		return;
	    	}
	    // Are all connections of the same polarity
	    	var offending_elements = [trace];
	    	var polarity = start_terminal.name == "trace" ? start_terminal.style.strokeColor : start_terminal.style.fillColor;
	    		var valid_connection = _.reduce(intersects, function(memo, el, i, arr){
	    			var el_polarity = el.name == "trace" ? el.style.strokeColor : el.style.fillColor;
	    			var valid = polarity.equals(el_polarity);
	    			if(!valid) offending_elements.push(el);
	    			return memo && valid;
	    	}, true);

	    	if(valid_connection){
	    		trace.simplify();
	    		trace.remove();
	    		scope.lastTrace = designer.traces_layer.add(trace);
	    		
	    	}
	    	else{
	    		// error message
	    		trace.simplify();

	    		var animations = [];
    			

	    		alerter.alert(TracePathTool.SHORT_MESSAGE,
		    		function(){
		    			_.each(offending_elements, function(el, i, arr){
							console.log("Strobing", el.name);
							el.style = {
								shadowColor: "blue",
								shadowBlur: 30,
								shadowOffset: new paper.Point(0, 0)
							}
							animations.push(designer.animation_handler.add(function(event){
								var t = Math.sin(event.count/5); //[-1, 1]
								t += 1; //[0, 2];
								t /= 2; //[0, 1];
								el.shadowColor.alpha = t;
							}, 1.5,
							function(){
								el.shadowColor.alpha = 0;
								if(trace) trace.remove();
							}));
						});
					},
		    		"Remove the shorting path"
	    		);
	    		
	    	}


	    	// State variable update
			start_terminal = null;
			
		}
	},
	trace: {
		onMouseDown: function(event, hitResult, scope){
	  		var path = hitResult.item;
			start_terminal = path;
			
			trace = new paper.Path({
				strokeColor: path.style.strokeColor,
				strokeWidth: 4,
				name: "trace"
			});

	    	trace.add(event.point);
		}, 
		onMouseDrag: function(event){
			trace.add(event.point);
		}, 
		onMouseUp: function(event, scope){
   			// Get all conductive elements on the board
			var terminals = designer.circuit_layer.getAllTerminals();
			var traces = designer.traces_layer.getAllTraces();
			var conductive = _.flatten([terminals, traces]);


			// Find all unique non-self referential intersections with those elements
	    	var intersects = TracePathTool.getAllIntersections(trace, conductive);
			intersects = _.uniq(intersects);
	    	intersects = _.reject(intersects, function(el, i, arr){
	    		return el.parent.canvasItem.id == start_terminal.parent.canvasItem.id;
	    	});

	    	// Visual characteristics on MouseUp			
			_.each(terminals, function(el, i, arr){
				el.scaling = new paper.Point(1.0, 1.0);	
			});
			


	    	// Handle intersections
	    	// Hanging trace
	    	if(intersects.length == 0){
	    		trace.simplify();
	    		trace.remove();
	    		scope.lastTrace = designer.traces_layer.add(trace);
	    		start_terminal = null;
	    		return;
	    	}
	    	// Are all connections of the same polarity
	    	var offending_elements = [trace];
	    	var polarity = start_terminal.name == "trace" ? start_terminal.style.strokeColor : start_terminal.style.fillColor;
	    		var valid_connection = _.reduce(intersects, function(memo, el, i, arr){
	    			var el_polarity = el.name == "trace" ? el.style.strokeColor : el.style.fillColor;
	    			var valid = polarity.equals(el_polarity);
	    			if(!valid) offending_elements.push(el);
	    			return memo && valid;
	    	}, true);

	    	if(valid_connection){
	    		trace.simplify();
	    		trace.remove();
    			scope.lastTrace = designer.traces_layer.add(trace);;
	    	}
	    	else{
	    		// error message
	    		trace.simplify();

	    		var animations = [];
    			

	    		alerter.alert(TracePathTool.SHORT_MESSAGE,
		    		function(){
						_.each(offending_elements, function(el, i, arr){
						console.log("Strobing", el.name);
						el.style = {
							shadowColor: "blue",
							shadowBlur: 30,
							shadowOffset: new paper.Point(0, 0)
						}
						animations.push(designer.animation_handler.add(function(event){
							var t = Math.sin(event.count/5); //[-1, 1]
							t += 1; //[0, 2];
							t /= 2; //[0, 1];
							el.shadowColor.alpha = t;
						}, 1.5,
						function(){
							el.shadowColor.alpha = 0;
							if(trace) trace.remove();
						}));
	    			});
						
					},
		    		"Remove the shorting path"
	    		);
	    		
	    	}


	    	// State variable update
			start_terminal = null;
		}
	},
	led: {
		onMouseDown: function(event, hitResult, scope){
			var path = hitResult.item;
			path.parent.canvasItem.ledOn(!path.parent.led_on);
		}, 
		onMouseDrag: function(event){

		}, 
		onMouseUp: function(event){

		}
	}, 
	canvas: {
		onMouseDown: function(event, hitResult, scope){
			
		}, 
		onMouseDrag: function(event){

		}, 
		onMouseUp: function(event){
			terminals = designer.circuit_layer.getAllTerminals();
			//reset terminals
			_.each(terminals, function(el, i, arr){
				el.scaling = new paper.Point(1.0, 1.0);
			})
		}
	}
}

TracePathTool.getAllIntersections = function(path, wires){
		intersections = _.reduce(wires, function(memo, el){
	 		var a = path.getIntersections(el);
			if(a.length > 0) memo.push(el);
			return memo;
	 	}, []);
		return _.flatten(intersections);
	} 
TracePathTool.getAllInsides = function(path, wires){
		intersections = _.reduce(wires, function(memo, el){
	 		var a = path.isInside(el.bounds);
			if(a) memo.push(el);
			return memo;
	 	}, []);
		return _.flatten(intersections);
	} 
	

