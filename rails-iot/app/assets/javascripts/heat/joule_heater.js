// heat_sketch.js

var hitOptions = {
	segments: false,
	stroke: true,
	fill: true,
	tolerance: 5
};

var NORMAL_SMOOTH = 4;
var BUFFER = 10;
var LINE_BUFFER = 5;

function smoothNormal(path, off, neighborhood){
	if(neighborhood == 0) return path.getNormalAt(off);
	var min = off-neighborhood > 0 ? off-neighborhood : 0;
	var max = off+neighborhood <= path.length ? off + neighborhood : path.length;
	var n_range = _.range(min, max, 1);
	return _.reduce(n_range, function(memo,off){ return memo.add(path.getNormalAt(off))}, new paper.Point(0, 0)).divide(n_range.length);
}

function JouleHeater(gui){
	this.filename = "serpentine";
	this.type = "serpentine";
	this.line_width = 3;
	this.heater_width = 30;
	this.heater_height = 50;
	this.gap =  this.line_width + 1.0001;
	this.resistance = 0;
	this.area = 0;
	this.length = 0;
	this.animated = true;
	this.color = "#000000";

	this.file = "/thermo/bird_in_cage.svg"
	this.profile = 0;
	this.boundary = 0;

	var f0 = gui.addFolder("Artwork");
	f0.add(this, "file")
	// .options(_.map(files, function(file){ return file.path + file.filename; }));
	f0.add(this, "load");
	f0.add(this, "draw");
	f0.add(this, "ref");
	f0.add(this, "boundary").listen();
	f0.add(this, "profile").listen();
	f0.add(this, "set_profile");
	f0.add(this, "set_boundary");
	f0.add(this, "clear");
	f0.add(this, "saveCache");
	// f0.add(this, "drawReferenceLine");
	// f0.add(this, "reference_line");
	// f0.add(this, "boundary_curve");


	var f1 = gui.addFolder("Joule Options");
	f1.add(this, "filename");
	f1.add(this, "type").options(["serpentine"]);
	f1.add(this, "heater_width").min(1.0).max(100);
	f1.add(this, "heater_height").min(1.0).max(100);
	f1.add(this, "line_width").min(0.3).max(10.0);
	f1.add(this, "gap").min(0.3).max(10.0);
	f1.addColor(this, "color");
	f1.add(this, "animated");

	var f2 = gui.addFolder("Output");
	f2.add(this, "generate");
	f2.add(this, "save");

	f3 = gui.addFolder("Properties");
	f3.add(this, "area").listen();
	f3.add(this, "length").listen();
	f3.add(this, "resistance").listen();
	


	
	f0.open();
	f1.open();
	f2.open();
	f3.open();
	var brush_direction = null;
	drawBrush = new paper.Tool();
    drawBrush.onMouseDown = function(event){
	  brush_direction = new paper.Path.Line({
	    strokeColor: "yellow", 
	    strokeWidth: 3, 
	    from: event.point,
	    to: event.point,
	  });
		console.log(event.point);
	  var c = new paper.Path.Circle({
	    fillColor: "red", 
	    position: event.point, 
	    radius: 5
	  });
	}
	drawBrush.onMouseDrag = function(event){
	  // brush_direction.lastSegment.remove();
	  brush_direction.addSegment(event.point);
	}
	
	drawBrush.onMouseUp = function(event){
	  var c = new paper.Path.Circle({
	    fillColor: "blue", 
	    position: event.point, 
	    radius: 5
	  });
	  brush_direction.addSegment(event.point); 
	  brush_direction.smooth({type: "continuous"});   
	} 

	referenceBrush = new paper.Tool();
	referenceBrush.onMouseDown = function(event){
		var hitResult = paper.project.hitTest(event.point, hitOptions);
		if (hitResult) sm.add(hitResult.item);
		sm.update();
	}

	this.draw_tool = drawBrush;
	this.ref_tool = referenceBrush;
	if(ws && ws.includes("CANVAS")) paper.project.importJSON(JSON.parse(ws.get("CANVAS")));
	
	if(CanvasUtil.queryPrefix("BOUND").length > 0)
		this.boundary = CanvasUtil.queryPrefix("BOUND")[0].id;
	if(CanvasUtil.queryPrefix("PROFILE").length > 0)
		this.profile = CanvasUtil.queryPrefix("PROFILE")[0].id;
}

JouleHeater.prototype = {
	saveCache: function(){
		if(!ws) return; 

		ws.set("CANVAS", paper.project.exportJSON());
		
	},
	draw: function(){
		paper.tool = this.draw_tool;
	},
	ref: function(){
		paper.tool = this.ref_tool;
	},
	set_profile: function(){
		if(sm.selection.length == 0) return;
		this.profile = sm.selection[0].id;
		_.each(CanvasUtil.queryPrefix("PROFILE"), function(p){ p.name = "";});
		sm.selection[0].name = "PROFILE: prof";
		sm.clear(); sm.update();
	},
	set_boundary: function(){
		if(sm.selection.length == 0) return;
		this.boundary = sm.selection[0].id;
		_.each(CanvasUtil.queryPrefix("BOUND"), function(p){ p.name = "";})
		sm.selection[0].name = "BOUND: boundary";
		sm.clear(); sm.update();
	},
	load: function(file, onLoad){
	    console.log("LOADING FILE:", this.file)
	    paper.project.clear();
	    paper.view.zoom = 1;
	    paper.view.update();

	    return new Artwork(this.file, function(artwork){
	      var elds = CanvasUtil.queryPrefix('ELD');
	      var artwork = elds.length > 0 ? elds[0] : artwork.svg;
	      CanvasUtil.fitToViewWithZoom(artwork, paper.view.bounds.expand(-100), paper.view.center);
	      artwork.position.y += 20;
	      CanvasUtil.call(CanvasUtil.queryPrefix("DDS"), "bringToFront");
	      CanvasUtil.call(CanvasUtil.queryPrefix("NLED"), "bringToFront");
	      vm = new ViewManager($('#views'));
	      if(onLoad) onLoad();
	      // var r = new paper.Path.Rectangle({rectangle: artwork.bounds, selected: true})
	      paper.view.update();
	    });
	   
  	},
  	generate: function(){
	  var brush_direction = CanvasUtil.queryID(this.profile); 
	  var boundary = CanvasUtil.queryID(this.boundary); 
	  CanvasUtil.call(CanvasUtil.queryPrefix("JOULE"), "remove");
	  CanvasUtil.call(CanvasUtil.queryPrefix("TMP"), "remove");
  	  var serp = new paper.Path({
  	  	name: "JOULE: draw_snake",
	  	strokeColor: this.color,
	  	strokeWidth: Ruler.mm2pts(this.line_width), 
	  	miterLimit: 1
	  });
	  console.log(brush_direction);
	  disks = _.range(0 + BUFFER, brush_direction.length - BUFFER, serp.strokeWidth + Ruler.mm2pts(this.gap));
	  var even = true;
	  _.each(disks, function(disk){
	  	var pt = brush_direction.getPointAt(disk);
	  	var ptA = brush_direction.getNormalAt(disk).multiply(100).add(pt);
	  	var ptA = smoothNormal(brush_direction, disk, NORMAL_SMOOTH).multiply(100).add(pt);
	  	var ptB = brush_direction.getNormalAt(disk).multiply(-100).add(pt);
	  	var ptB = smoothNormal(brush_direction, disk, NORMAL_SMOOTH).multiply(-100).add(pt);


	  	var line = new paper.Path.Line({name: "TMP: construction", from: ptA, to: ptB, strokeColor: "blue", strokeWidth: 0.1});
	  	// ixts = line.getIntersections(serp);
	  	ixts = CanvasUtil.getIntersections(line, [serp, boundary]);

	  	ixts.push({point: ptA});
	  	ixts.push({point: ptB});
	  	console.log(line.length, _.map(ixts, function(ixt){return line.getOffsetOf(ixt.point)}));
	  	max = _.chain(ixts).filter(function(ixt){ 
	  			offset = line.getOffsetOf(ixt.point);
	  			return offset > line.length/2; 
	  		}).min(function(ixt){ 
	  			return line.getOffsetOf(ixt.point); 
	  		}).value().point;
	  	max = line.getOffsetOf(max);

  		
	  	max = max - LINE_BUFFER > line.length / 2 ?  max - LINE_BUFFER : line.length / 2;
	  	max = line.getPointAt(max - LINE_BUFFER);

	  	min = _.chain(ixts).filter(function(ixt){ 
	  			offset = line.getOffsetOf(ixt.point);
	  			return offset < line.length/2; 
	  		}).max(function(ixt){ 
	  			return line.getOffsetOf(ixt.point); 
	  		}).value().point;
	  	min = line.getOffsetOf(min);
	  	min = min + LINE_BUFFER < line.length / 2 ?  min + LINE_BUFFER : line.length / 2;
	  	min = line.getPointAt(min + LINE_BUFFER);
		
		console.log(min, max)  	
	  	if(even)
		  	serp.addSegments([min, max]);
	 	else
	 		serp.addSegments([max, min]);
	 	even = !even;
	 	// line.remove();
	  });
  	},
	generateOld: function(){
		// ENSURE THAT GAP IS > LINE WIDTH
		CanvasUtil.call(CanvasUtil.queryPrefix("JOULE"), "remove");
		var lw = Ruler.mm2pts(this.line_width);
		var tw = Ruler.mm2pts(10);
		var profile = CanvasUtil.queryID(this.profile);
		var terminal_pwr = new paper.Path.Rectangle({
			name: "JOULE: terminal_pwr",
			fillColor: "black", 
			size:  [tw, tw],
			position: profile.getPointAt(0) 
			// position: paper.view.bounds.expand(-100).topCenter.clone() 
		});


		var heater = JouleHeater.snake({
			start: terminal_pwr.bounds.expand(-3).bottomCenter.clone(), 
			profile: profile, 
			direction: new paper.Point(0, 1),
			barriers: [],
			boundaries: [], 
			crawlStep:  Ruler.mm2pts(this.gap) + Ruler.mm2pts(this.line_width), 
			maxCrawlLength: profile.bounds.width,//Ruler.mm2pts(this.heater_width),
			maxHeight: profile.bounds.height,//Ruler.mm2pts(this.heater_height),
			// maxLength: Ruler.mm2pts(this.length), 
			animated: this.animated,
			postAnimation: function(heater){
				var terminal_gnd = new paper.Path.Rectangle({
					name: "JOULE: gnd_terminal",
					fillColor: "black", 
					size:  [tw, tw]
				});
				terminal_gnd.set({
					pivot: terminal_gnd.bounds.topCenter, 
					position: heater.lastSegment.point.clone() 
				});
			},	
			style: {
				name: "JOULE: draw_snake",
				strokeColor: this.color, 
				strokeWidth: Ruler.mm2pts(this.line_width)
			}
		});


		this.length = Ruler.pts2mm(heater.length);
		this.resistance = JouleHeater.getResistance(JouleHeater.AGIC_MATERIAL, heater);
		this.area = JouleHeater.getArea(heater);
		paper.view.update();
	}, 
	getName: function(){
		return [this.filename, this.heater_width + "x" + this.heater_height, + "lw", this.line_width, "g", this.gap, "r", parseInt(this.resistance), "l", parseInt(this.length)].join("_");
	},
	clear: function(){
		paper.project.clear();
	},
	save: function(){
		console.log("Exporting SVG...", this.filename);
    	paper.view.zoom = 1;
	    paper.view.update();
	    paper.project.activeLayer.name = this.getName();
	    exp = paper.project.exportSVG({ 
	      asString: true,
	      precision: 5
	    });
	    // var filename = this.getName() + ".svg"
	    var filename = "bird" + ".svg"
    	saveAs(new Blob([exp], {type:"application/svg+xml"}), filename);
	}
}

// start, direction, boundary, barriers

JouleHeater.snake = function(op){
    var serpentine = new Path({
        segments: [op.start.add(op.direction)]
    });
    serpentine.set(op.style);

    var maze = _.flatten([op.boundary, op.barriers]);
    var crawl_step = op.crawlStep;
    var crawl_length = op.maxCrawlLength;
    // var direction = op.direction;
    var direction = op.profile.getTangentAt(0).multiply(-1);

    direction = HeatSketch.turn_and_crawl(serpentine, direction, 0, crawl_step, false, maze)
    direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_length, true, maze)


    while(direction){
    	if(op.maxLength && serpentine.length >= op.maxLength){ console.log("MAX LENGTH REACHED"); break;}
    	if(op.maxHeight && serpentine.bounds.height >= op.maxHeight){ console.log("MAX HEIGHT REACHED", serpentine.bounds.height, op.maxHeight); break;}

    	direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_step, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_length, true, maze);
        // direction = op.profile.getTangentAt(op.profile.getOffsetOf(op.profile.getNearestPoint(serpentine.lastSegment.point))).multiply(-1);
        direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_step, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_length, true, maze)
    }
	
	direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_step , true, maze)

    if(op.animated){
	    serpentine.remove();

	    var anim_snake = new paper.Path(op.style);
	    
	    if(ps){
		    ps.add({
				name: op.name,
				onRun: function(event){
					pts = _.range(0, serpentine.length * event.parameter, 1);
					pts = _.map(pts, function(off){
						return serpentine.getPointAt(off);
					});
					anim_snake.removeSegments();
					anim_snake.addSegments(pts);
				},
				onDone: function(event){
					anim_snake.removeSegments();
					anim_snake.addSegments(serpentine.segments);
					op.postAnimation(anim_snake);
				},
				onKill: function(event){},
				duration: serpentine.length / 2
			});
		}
		else console.warn("Perceptual Scheduler not enabled...");
	}else{
		op.postAnimation(serpentine);
	}
	
	return serpentine;
}



JouleHeater.turn_and_crawl = function(serp, i_direction, rotation,  i_crawl, smooth, maze){
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

JouleHeater.AGIC_MATERIAL = {
	sheet_resistance: 0.3
}

JouleHeater.getArea = function(path){
	var W = Ruler.pts2mm(path.style.strokeWidth); // width of stroke in mm
	var L = Ruler.pts2mm(path.length);
	return W * L;
}
JouleHeater.getResistance = function(material=AGIC_MATERIAL, path){
	var W = Ruler.pts2mm(path.style.strokeWidth); // width of stroke in mm
	var L = Ruler.pts2mm(path.length);
    return material.sheet_resistance * L / W; 
}