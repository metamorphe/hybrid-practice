// heat_sketch.jsheathea

function JouleHeater(gui){
	this.filename = "serpentine";
	this.type = "serpentine";
	this.line_width = 3;
	this.heater_width = 30;
	this.heater_height = 50;
	this.gap =  this.line_width + 1;
	this.resistance = 0;
	this.length = 0;
	this.animated = true;
	this.color = "#000000"

	var f1 = gui.addFolder("Joule Options");
	f1.add(this, "filename");
	f1.add(this, "type").options(["serpentine"]);
	f1.add(this, "heater_width").min(1.0).max(100);
	f1.add(this, "heater_height").min(1.0).max(100);
	f1.addColor(this, "color");
	f1.add(this, "line_width").min(1.0).max(10.0);
	f1.add(this, "gap").min(1.0).max(10.0);


	f1.add(this, "animated");

	var f2 = gui.addFolder("Output");
	f2.add(this, "generate");
	f2.add(this, "save");

	f3 = gui.addFolder("Properties");
	f3.add(this, "length").listen();
	f3.add(this, "resistance").listen();


	
	f1.open();
	f2.open();
	f3.open();
}

JouleHeater.prototype = {
	generate: function(){
		// ENSURE THAT GAP IS > LINE WIDTH
		CanvasUtil.call(CanvasUtil.queryPrefix("JOULE"), "remove");
		var lw = Ruler.mm2pts(this.line_width);
		var tw = Ruler.mm2pts(10);

		var terminal_pwr = new paper.Path.Rectangle({
			name: "JOULE: terminal_pwr",
			fillColor: "black", 
			size:  [tw, tw],
			position: paper.view.bounds.expand(-100).topCenter.clone() 
		});


		var heater = JouleHeater.snake({
			start: terminal_pwr.bounds.expand(-3).bottomCenter.clone(), 
			direction: new paper.Point(0, 1),
			barriers: [],
			boundaries: [], 
			crawlStep:  Ruler.mm2pts(this.gap) + Ruler.mm2pts(this.line_width), 
			maxCrawlLength: Ruler.mm2pts(this.heater_width),
			maxHeight: Ruler.mm2pts(this.heater_height),
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
		paper.view.update();
	}, 
	save: function(){
		console.log("Exporting SVG...", this.filename);
    	paper.view.zoom = 1;
	    paper.view.update();
	    exp = paper.project.exportSVG({ 
	      asString: true,
	      precision: 5
	    });
	    var filename = [this.filename, "lw", this.line_width, "g", this.gap].join("_") + ".svg"
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
    var direction = op.direction;

    direction = HeatSketch.turn_and_crawl(serpentine, direction, 0, crawl_step, false, maze)
    direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_length, true, maze)


    while(direction){
    	if(op.maxLength && serpentine.length >= op.maxLength){ console.log("MAX LENGTH REACHED"); break;}
    	if(op.maxHeight && serpentine.bounds.height >= op.maxHeight){ console.log("MAX HEIGHT REACHED", serpentine.bounds.height, op.maxHeight); break;}

    	direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_step, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_length, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_step, true, maze)
        direction = HeatSketch.turn_and_crawl(serpentine, direction, -90, crawl_length, true, maze)
    }
	
	direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_step , true, maze)
    // direction = HeatSketch.turn_and_crawl(serpentine, direction, 90, crawl_length, true, maze)


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
    // else{
    // 	turn = turnLine.lastSegment.point;
    // }
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
JouleHeater.getResistance = function(material=AGIC_MATERIAL, path){
	var W = Ruler.pts2mm(path.style.strokeWidth); // width of stroke in mm
	var L = Ruler.pts2mm(path.length);
    return material.sheet_resistance * L / W; 
}