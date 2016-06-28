
var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 10
};
TransformTool2.ROTATING = 1;
TransformTool2.SCALING = 2;
function tS(v){
	if(v == TransformTool2.ROTATING)
		return "TRANSFORM.ROTATE";
	if(v == TransformTool2.SCALING)
		return "TRANSFORM.SCALE";
	return "TRANSFORM.NULL";
}

function TransformTool2(paper){
	this.paper = paper;
	this.name = "TransformTool2";

	this.tool = new paper.Tool();
	this.tool.distanceThreshold = 10;
	this.sm = new SelectionManager(paper);
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


TransformTool2.prototype = {
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
			if(["segment"].indexOf(hitResult.type) != -1){
				// var cluster = hitResult.item;
				// while(_.isUndefined(cluster.canvasItem))
				// 	cluster = cluster.parent;
				var rect = hitResult.item;
				var group = rect.group;
				
				var isRotate = hitResult.segment.index >= 2 && hitResult.segment.index <= 4;
				var isScale = !isRotate;

			    if(isRotate){
			    	scope.action = TransformTool2.ROTATING;
			    }
			    if(isScale){
			    	scope.action = TransformTool2.SCALING;
			    }
			}
		},
		onMouseDrag: function(event, scope){	
			console.log(tS(scope.action));
			if(scope.action == TransformTool2.SCALING){
				var path_bounds = scope.sm.selection_rectangle.bounds.clone();   
				var center = path_bounds.center.clone();   
				var diag = event.point.subtract(center).length;
				var init_diag = scope.sm.selection_rectangle.init_size;
				var ratio = diag/init_diag;
				scope.sm.scale(ratio, ratio);
			}
			if(scope.action == TransformTool2.ROTATING){
				var angle = event.point.subtract(scope.sm.selection_rectangle.pivot).angle + 90;
				scope.sm.rotate(angle);
			}
			
		},
		onMouseUp: function(event, scope){
			scope.action = null;
		}
	},
	canvas: {
		onMouseDown: function(event, hitResult, scope){
			scope.sm.clear();
		},
		onMouseDrag: function(event, scope){

		},
		onMouseUp: function(event, scope){

		}
	},
	pan:  {
		onMouseDown: function(event, hitResult, scope){
			console.log("PANNING", hitResult.type);
			// GET SELECTED ITEM
			if(["stroke", "fill", "segment"].indexOf(hitResult.type) != -1){
				var cluster = hitResult.item;
				while(_.isUndefined(cluster.canvasItem))
					cluster = cluster.parent;
				scope.sm.add(cluster, event.event.shiftKey);
			}
		},
		onMouseDrag: function(event, scope){
			// TRANSLATE
			scope.sm.translate(event.delta);
		},
		onMouseUp: function(event, scope){
		
		}
	}
}


function SelectionManager(paper){
	this.paper = paper;
	this.collection = {};
	var s = createSelectionRectangle([]);
	this.selection_rectangle = s.rect;
	this.selection_group = s.group;
}
SelectionManager.prototype = {
	add: function(cluster, shiftKey){
		var inCollection = _.includes(_.keys(this.collection), cluster.canvasItem.guid);
		if(shiftKey && inCollection){
			this.remove(cluster);
			this.update();
		}
		else{
			if(!shiftKey && !inCollection) this.clear();
			this.collection[cluster.canvasItem.guid] = cluster;
			this.update();
		}
	},
	rotate_each: function(){

	},
	rotate: function(angle){
		this.selection_rectangle.rotation = angle;
		_.each(this.selection_group, function(el, i, arr){
			el.rotation = angle;
		});
	},
	translate: function(delta){
		this.selection_rectangle.position.x += delta.x;
		this.selection_rectangle.position.y += delta.y;
		_.each(this.selection_group, function(el, i, arr){
			el.position.x += delta.x;
			el.position.y += delta.y;
		});
	},
	scale: function(sx, sy){
		this.selection_rectangle.scaling.x = sx;
		this.selection_rectangle.scaling.y = sy;
		_.each(this.selection_group, function(el, i, arr){
			el.scaling.x = sx;
			el.scaling.y = sy;
		});
	},
	update: function(){
		this.selection_rectangle.remove();
		var s = createSelectionRectangle(_.values(this.collection));
		this.selection_rectangle = s.rect;
		this.selection_group = s.group;
		this.paper.project.activeLayer.addChild(this.selection_rectangle);
	},
	remove: function(cluster){
		cluster.canvasItem.selection_rectangle.remove();
		cluster.canvasItem.path.selected = false;
		delete this.collection[cluster.canvasItem.guid];
	}, 
	clear: function(){
		var scope = this;
		_.each(this.collection, function(el, i, arr){
			scope.remove(el);
		});
		this.collection = {};
		this.update();
	}
}

function createSelectionRectangle(items){
	var group = new paper.Group();

	var children = _.map(items, function(el, i, arr){
		el.canvasItem.path.selected = true;
		var r = new paper.Path.Rectangle(el.canvasItem.path.bounds);
		return r;
	});
	group.addChildren(children);
	group.remove();

	var b = group.bounds.clone().expand(10, 10);
	var sum = new paper.Path.Rectangle(b);
	sum.style = {
	    
	    selected: true, 
	    strokeWidth: 1,
	    strokeColor:  "#00A8E1", 
	};
	sum.name =  "selection rectangle";
   	sum.position = b.center.clone();	 
    sum.pivot = sum.position;
    sum.insert(2, new paper.Point(b.center.x, b.top));
    sum.insert(2, new paper.Point(b.center.x, b.top-25));
    sum.insert(2, new paper.Point(b.center.x, b.top));
    sum.selected = true;
    sum.applyMatrix = true;
    sum.group = group;
    sum.init_size = new paper.Point(b.left, b.bottom).subtract(b.center).length;
       
  	sum.remove();


  return {rect:sum, group: items}; 
}