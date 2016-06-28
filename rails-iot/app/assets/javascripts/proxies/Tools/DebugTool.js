var path;
var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 1
};
DebugTool.SHORT_MESSAGE = "You are shorting your circuit. Avoid crossing any paths or connecting to terminals that aren't the same color (polarity).";

function DebugTool(paper){
	this.paper = paper;
	this.selectedPoint = null;
	this.selectedHandle = null;
	this.selectedStroke = null;
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
}

var trace;
var start_terminal = null;
var start_trace = null;
DebugTool.prototype = {
	enable: function(){
		designer.circuit_layer.draw_mode = true;
		designer.circuit_layer.update();
		debug.show();
	},
	disable: function(){
		designer.circuit_layer.draw_mode = false;
		designer.circuit_layer.update();
		debug.hide();
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
			
		}, 
		onMouseDrag: function(event){
			
		}, 
		onMouseUp: function(event){
		}
	},
	trace: {
		onMouseDown: function(event, hitResult, scope){
		}, 
		onMouseDrag: function(event){
		}, 
		onMouseUp: function(event){
		}
	},
	led: {
		onMouseDown: function(event, hitResult, scope){
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
		}
	}
}

DebugTool.getAllIntersections = function(path, wires){
		intersections = _.reduce(wires, function(memo, el){
	 		var a = path.getIntersections(el);
			if(a.length > 0) memo.push(el);
			return memo;
	 	}, []);
		return _.flatten(intersections);
	} 
DebugTool.getAllInsides = function(path, wires){
		intersections = _.reduce(wires, function(memo, el){
	 		var a = path.isInside(el.bounds);
			if(a) memo.push(el);
			return memo;
	 	}, []);
		return _.flatten(intersections);
	} 
	

