// MagicWandBrush
function MagicWandBrush(paper){
	this.paper = paper;
	this.name = "MagicWandBrush";

	this.tool = new paper.Tool();
	this.selection_mode = true;

	var scope = this;
	
	var start;
	var meter;
	var selection;

	this.tool.onMouseDown = function(event){
		// WAND ACTION
		if(scope.selection_mode){
			scope.path = new paper.Path({
				// strokeWidth: 0, 
				// fillColor: "#00A8E1", 
				// opacity: 0.5
			});
			scope.path.addSegment(event.point);
		} else{
			start = event.point
			scope.path = new paper.Path({
				// strokeWidth: 12, 
				// strokeColor: cp.getCurrentColor()
			});
			scope.path.addSegment(event.point);
		}
	}
	var scale = 1.5;
	this.tool.onMouseDrag = function(event){
		if(scope.selection_mode){
			_.each(displays, function(display){
			   var DIF = display.queryPrefix("DIF");
			   selection = Util.findSelected(scope.path, DIF);
			   _.each(selection, function(el){
			   		el.style.fillColor = cp.getCurrentColor();
			   });
			});
			scope.path.addSegment(event.point);
		} else{
			var a = start.subtract(event.point);
			// console.log(a.y);
			var y = meter.start - (a.y * scale);
			if(y < meter.min) y = meter.min;
			if(y > meter.max) y = meter.max;
			// console.log(y, meter.min, meter.max);
			meter.island.position.y = y;
			var alpha = (y - meter.min)/meter.height;
			meter.island.style.fillColor.alpha = (1 - alpha);
    		_.each(selection, function(el){
			   		el.style.fillColor = meter.island.style.fillColor;
			});
    		// a = a.add(paper.view.center);
    		// paper.view.center = a
			scope.path.addSegment(event.point);
		}
	}

	this.tool.onMouseUp = function(event){
		if(scope.selection_mode){
			scope.path.addSegment(event.point);
			scope.path.smooth();
			// FIGURE OUT INTERSECTIONS
			_.each(displays, function(display){
			   var DIF = display.queryPrefix("DIF");
			   selection = Util.findSelected(scope.path, DIF);
			   _.each(selection, function(el){
			   		// el.selected = true;
			   });
			   meter = MagicWandBrush.makeMeter(cp.getCurrentColor(), selection);
			});
			scope.path.remove();
			scope.path = null;
			scope.selection_mode = false;
		} else{
			scope.selection_mode = true;
			meter.bar.remove();
		}
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
MagicWandBrush.makeMeter = function(color, selection){
	// console.log(color);
	var maxColor = new paper.Color(color);
	var baseColor = new paper.Color(color);
	var minColor = new paper.Color(color);
	maxColor.brightness = 1.0;
	minColor.alpha = 0;

	selection = _.map(selection, function(el){
		return el.clone();
	})
	var group = new paper.Group(selection);
	var g_bounds = group.bounds.expand(100);
	var bar = new paper.Group();
	var cMax = new paper.Path.Circle({
		radius: 20, 
		position: g_bounds.topRight,
		fillColor: maxColor, 
		strokeColor: "#CCC", 
		strokeWidth: 2, 
		parent: bar
	});
	var cMin = new paper.Path.Circle({
		radius: 20, 
		position: g_bounds.bottomRight,
		fillColor: minColor, 
		strokeColor: "#CCC", 
		strokeWidth: 2, 
		parent: bar
	});
	var cBar = new paper.Path.Line({
		 from: cMin.position,
	     to: cMax.position,
	     strokeColor: "#CCC", 
	     strokeWidth: 2, 
	     parent: bar
	});
	islandPosition = cMin.position.clone();
	barHeight = Math.abs(cMax.position.y - cMin.position.y);
	// console.log(barHeight, baseColor.brightness)
	islandPosition.y -= barHeight * baseColor.brightness;
	// console.log(islandPosition)
	var island = new paper.Path.Rectangle({
		point: islandPosition,
	    size: [60, 30],
	    strokeColor: '#CCC',
	    fillColor: baseColor, 
	    parent: bar
	});
	cBar.sendToBack();
	group.remove();
	return {
			bar: bar,
			max: cMin.position.y, 
			min: cMax.position.y,
			island: island, 
			start: island.position.y,
			height: Math.abs(cMax.position.y - cMin.position.y)}
}

function Util(){}

Util.getAllIntersectionsAndInsides = function(path, wires){
	var intersects = [];
	var path_bounds = path.bounds;
	wires = _.reject(wires, function(el, i, arr){
		return el.id == path.id;
	});
	wiress = wires;
	// console.log("Wires", wires.length, path)
	for(var i in wires){
		// console.log(path.id, wires[i].id);
		var s = path.getIntersections(wires[i]);
		// console.log(path.id, wires[i].id);
		// console.log("Comparing", path.id, wires[i].id, s.length)

		if(s.length > 0)
			intersects.push(s);

		var ins = _.filter(wires, function(el, i, arr){
			return el.isInside(path.bounds);
		});
		if(ins.length > 0)
			intersects.push(ins);
	}
	intersects = _.flatten(intersects);
	// console.log(path.id, "intersects before", intersects.length, _.map(intersects, function(el){
	// 	return el._curve2.path.id;
	// }));
	
	intersects = _.unique(intersects, function(el, i, arr){
		return el._curve2.path.id;
	})
	// console.log("intersects after", intersects.length);
	return intersects;
} 


Util.getAllInsides = function(path, collection){
		intersections = _.reduce(collection, function(memo, el){
	 		var a = path.isInside(el.bounds);
			if(a) memo.push(el);
			return memo;
	 	}, []);
		return _.flatten(intersections);
	} 

Util.findSelected = function(path, collection){
	var ixt = _.map(collection, function(el){
		if( path.intersects(el) ) //|| el.isInside(path.bounds))
		return el;
	});

	return _.compact(ixt);
} 
Util.getAllIntersections = function(path, collection){
	var intersects = [];
	for(var i in collection){
		if(path.parent.id == collection[i].parent.id)
			continue;
		var s = path.getIntersections(collection[i]);
		if(s.length > 0)
			intersects.push(s);
	}
	return _.flatten(intersects);
} 
