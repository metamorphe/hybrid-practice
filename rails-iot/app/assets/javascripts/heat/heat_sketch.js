// heat_sketch.js
function HeatSketch(){
	console.log("Running heat_sketch.js script.");
	this.sketch_a();
	paper.view.zoom = 2.5;
	
}

HeatSketch.prototype = {
	sketch_a: function(){
		c = new Path.Circle({
			name: "BND: Boundary",
		    radius: 100, 
		    strokeColor: "black", 
		    strokeWidth: 5, 
		    position: paper.view.center
		});

		var c_entry = new Path.Circle({
		    position: c.bounds.bottomCenter, 
		    fillColor: 'yellow',
		    radius: 10, 
		    strokeColor: 'red', 
		    strokeWidth: 2
		});

		var exit_offset = 100;
		var c_exit_pt = c.getNearestPoint(c_entry.position);
		var c_exit_off = (c.getOffsetOf(c_exit_pt) - exit_offset) % c.length;
		var c_mid = (c.getOffsetOf(c_exit_pt) - (exit_offset / 2)) % c.length;
		var c_exit = new Path.Circle({
		    position: c.getPointAt(c_exit_off), 
		    fillColor: 'blue',
		    radius: 10, 
		    strokeColor: 'red', 
		    strokeWidth: 2
		});

		var normal = c.getNormalAt(c_mid)
						.multiply(-10000)
						.add(c.getPointAt(c_mid));

		var divider = new Path.Line({
			name: "BAR: Barrier",
		    from: c.getPointAt(c_mid),
		    to: normal, 
		    strokeColor: 'red', 
		    strokeWidth: 2
		});
		// var boundary =CanvasUtil.queryPrefix('BND')[0];
		// var off = boundary.getOffsetOf(c_entry.position);
  //   	var direction = boundary.getNormalAt(off).multiply(-1);
		// HeatSketch.snake(c_entry.position, direction, boundary, CanvasUtil.queryPrefix('BAR'));
		// var off = boundary.getOffsetOf(c_exit.position);
  //   	var direction = boundary.getNormalAt(off).multiply(-1);
		// HeatSketch.snake(c_exit.position,  direction, boundary, CanvasUtil.queryPrefix('BAR'));
	}

}

HeatSketch.snake = function(start, direction, boundary, barriers){
    // var off = boundary.getOffsetOf(start.position);
    // var direction = boundary.getNormalAt(off).multiply(-1);
    
    var serpentine = new Path({
        strokeColor: "orange", 
        strokeWidth: 10, 
        segments: [start.add(direction)]
    });
    var maze = _.flatten([boundary, barriers]);
    var crawl_step = 13;
    direction = HeatSketch.turn_and_crawl(serpentine, direction, 0, crawl_step, false, maze)
    direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, 500000, true, maze)

    var turns = _.range(0, 10, 1);

    while(direction){
    	direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_step, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, 10000, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_step, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, 10000, true, maze)
    }

    serpentine.remove();
    var anim_snake = new paper.Path({
    	strokeColor: "orange", 
    	strokeWidth: 10
    });

    ps.add({
		name: "draw_snake",
		onRun: function(event){
			pts = _.range(0, serpentine.length * event.parameter, 1);
			pts = _.map(pts, function(off){
				return serpentine.getPointAt(off);
			});
			anim_snake.removeSegments();
			anim_snake.addSegments(pts);
		},
		onKill: function(event){},
		duration: 1000
	});
}



HeatSketch.turn_and_crawl = function(serp, i_direction, rotation,  i_crawl, smooth, maze){
    var padding = 10;
    var turn_padding = 5;
    if(_.isNull(i_direction)) return null;

    var dir = i_direction.rotate(rotation).multiply(i_crawl);
    var turn = serp.lastSegment.point.add(dir);
    

    var turnLine = new Path.Line({from: serp.lastSegment.point, to: turn});
    turn_start = turnLine.getPointAt(turn_padding).clone();
    var hits = _.map(maze, function(boundary){
    	return turnLine.getIntersections(boundary);
    });
    hits = _.flatten(hits);
    if(hits.length > 0){
	    var min_hit = _.min(hits, function(hit){ return turnLine.getOffsetOf(hit.point);});
    	var off = turnLine.getOffsetOf(min_hit.point) - padding;
    	if(off <= turn_padding) return null;
    	turn  = turnLine.getPointAt(off);
    	
    }
    turnLine.remove();

    if(smooth){
    	serp.lastSegment.point = serp.getPointAt(serp.length - turn_padding);
    	serp.lastSegment.handleOut = i_direction.multiply(turn_padding);
	    serp.addSegment(turn_start);   
	    serp.lastSegment.handleIn = dir.normalize().multiply(-turn_padding);
	}
    
    
    serp.addSegment(turn);   
    return dir.normalize();
}







