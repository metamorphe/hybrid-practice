
/* Global Constants */
const ENERGY_COLOR = '#00A8E1';
const NODE_COLOR= '#00A8E1';
const GREY = '#7f8c8d';
const MAX_DISTANCE = 350;
const MAX_CIRCLE_INTERVAL = 10;
const MIN_CIRCLE_INTERVAL = 10;

var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 10
};


function TeslaTool(paper){
	this.paper = paper;
	this.name = "TeslaTool";

	this.tool = new paper.Tool();
	this.tool.distanceThreshold = 10;

	this.recent = null;
	this.recentCenter = null;
	this.recentGroup = null;
	this.recentPath = null;
	this.minDistance = MAX_CIRCLE_INTERVAL;
	this.maxDistance = MIN_CIRCLE_INTERVAL;

	var scope = this;

	this.tool.onMouseDown = function(event){
		hitResult = scope.paper.project.hitTest(event.point, hitOptions);
		
		if(_.isNull(hitResult)) scope.canvas_item_type = "canvas";
		else{
			path = hitResult.item;
			if(path.name == "selection rectangle") scope.canvas_item_type = "transform";
			else scope.canvas_item_type = "pan";
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


TeslaTool.prototype = {
	enable: function(){

	},
	disable: function(){

	},
	update: function(){
		this.paper.view.update();
	}, 
	clear: function(){
	},
	selectAll: function(flag){
	}, 
	transform: {
		onMouseDown: function(event, hitResult, scope){
			
		},
		onMouseDrag: function(event, scope){	
			
		},
		onMouseUp: function(event, scope){
			
		}
	},
	canvas: {
		onMouseDown: function(event, hitResult, scope){
			var t = TeslaTool.createNode(event.point);
    		scope.recent = t;
    		scope.recentGroup = new paper.Group();
    		scope.recentCenter = event.point.clone();
    		var e = TeslaTool.createEnergyCircle(scope.recentCenter, 300);
    		scope.recentGroup.addChild(e);
    		var duration = 1.0;
    		var energyPulse = function(event, t){
				var t = t / duration;
				e.scaling = t;
			};
			pulse = function(){
				designer.animation_handler.add(energyPulse, duration, function(){
					pulse();
				});
			}
    		pulse();
		},
		onMouseDrag: function(event, scope){

		    // if (event.modifiers.shift && scope.recentCenter) {
		    //     var radius = scope.recentCenter.getDistance(event.point);
		    //     console.log(radius, MAX_DISTANCE);
		    //     if (radius <= MAX_DISTANCE) {
		    //         var e = TeslaTool.createEnergyCircle(scope.recentCenter, radius);
		    //         scope.recentGroup.addChild(e);
		    //     }
		    // }
		},
		onMouseUp: function(event, scope){

		}
	},
	pan:  {
		onMouseDown: function(event, hitResult, scope){
			
		},
		onMouseDrag: function(event, scope){

		},
		onMouseUp: function(event, scope){
		
		}
	}
}



/* Utility Functions */

TeslaTool.createNode = function(point) {
    var point = point.clone();
    var circle = new paper.Path.Circle({
        center: point,
        radius: 10,
        fillColor: NODE_COLOR,
    });
    return circle;
}

TeslaTool.createEnergyCircle = function(center, radius) {
    var circle = new paper.Path.Circle({
        center: center, 
        radius: radius,
        fillColor: { alpha: 0.0 },
        strokeColor: ENERGY_COLOR,
        strokeWidth: 2
    });
    circle.strokeColor.alpha = easeAlpha(radius);
    circle.sendToBack();
    return circle;
}
/* Maps from a distance returns an alpha value from 0.0 to 1.0
 * according to an ease in ease out curve (cubic) */
var easeAlpha = function(distance) {
    return (distance <= MAX_DISTANCE)
        ? Math.pow((distance / MAX_DISTANCE), 3)
        : 0.0;
}