// jigdesigner.js
var jigpath; 

//    d88b d888888b  d888b  d88888b  .d8b.   .o88b. d888888b  .d88b.  d8888b. db    db 
//    `8P'   `88'   88' Y8b 88'     d8' `8b d8P  Y8 `~~88~~' .8P  Y8. 88  `8D `8b  d8' 
//     88     88    88      88ooo   88ooo88 8P         88    88    88 88oobY'  `8bd8'  
//     88     88    88  ooo 88~~~   88~~~88 8b         88    88    88 88`8b      88    
// db. 88    .88.   88. ~8~ 88      88   88 Y8b  d8    88    `8b  d8' 88 `88.    88    
// Y8888P  Y888888P  Y888P  YP      YP   YP  `Y88P'    YP     `Y88P'  88   YD    YP    
                                                                                                                 
                             
function Jigdesigner(container, svg){
	this.paper;
	this.container = container;
	this.svg = svg;
	this.gui = new dat.GUI();
	this.gauge = 14;
	this.product = "Base";
	this.controllers_defined = false;

	// this.factor = 500 / Ruler.convert(config.size, "mm");
	this.init();

	productController = this.gui.add(this, "product", ["LaserHammer", "LaserBase", "Hammer", "Base"]);

	this.gui.add(this.paper.view, "zoom", 0.2, 4).step(0.1);
	var gaugeController = this.gui.add(this, "gauge", 10, 30).step(1);
	var scope = this;
	productController.onChange(function(){ scope.update();});
	gaugeController.onChange(function(){ scope.update();});
	this.gui.add(this, "export");
}

Jigdesigner.prototype = {
	addBackground: function(){
		var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Point(paper.view.size.width * paper.view.zoom, paper.view.size.height * paper.view.zoom));
		var bg = new paper.Path.Rectangle(rectangle);
		bg.fillColor = new paper.Color(0);
		bg.sendToBack();	

	},
	update: function(){
		console.log("Importing", this.svg);
		if(typeof this.paper == "undefined") return;

		var scope = this;
		this.paper.project.activeLayer.removeChildren();
		

		if(this.product == "Hammer"){
			if(_.isUndefined(scope.svgSym)){
				this.importSVG(function(){
					scope.hammer_gen();
				});
			} else scope.hammer_gen();
		}
		else if(this.product == "LaserHammer"){
			if(_.isUndefined(scope.svgSym)){
				this.importSVG(function(){
					scope.paper.project.activeLayer.removeChildren();
					scope.laser_hammer_gen();
				});
			} else scope.laser_hammer_gen();
		}else if(this.product == "LaserBase"){
			if(_.isUndefined(scope.svgSym)){
				this.importSVG(function(){
					scope.paper.project.activeLayer.removeChildren();
					scope.laser_base_gen();
					if(scope.controllers_defined == 0){
						var wTController = scope.gui.add(jigpath, "wall_thickness", 4, 20).step(0.1);
						wTController.onChange(function(){ if(scope.product == "Base") scope.update(); });
						scope.controllers_defined = true;
						
					}
				});
			} else scope.laser_base_gen();		   
		}
		else if(this.product == "Base"){
			if(_.isUndefined(scope.svgSym)){
				this.importSVG(function(){
					scope.base_gen();
					if(scope.controllers_defined == 0){
						var wTController = scope.gui.add(jigpath, "wall_thickness", 4, 20).step(0.1);
						wTController.onChange(function(){ if(scope.product == "Base") scope.update(); });
						scope.controllers_defined = true;
						
					}
				});
			} else scope.base_gen();		   
		}
		paper.view.update();
	},
	hammer_gen: function(){
		outside = jigpath.offset_outerwall();
        inside = jigpath.offset_innerwall();

		var w = jigpath.weightFunction();
        jigpath.colorize(this.gauge);
		paper.project.activeLayer.addChild(jigpath.group);
		jigpath.group.fillColor = new paper.Color(1);
		this.addBackground();
	},
	base_gen: function(){
		// reference paths
		ref_o = jigpath.offset(jigpath.outer, 0);
		ref_i = jigpath.offset(jigpath.hole, 0 );

		// OUTSIDE WALL
		outside = jigpath.offset_outerwall();
       	o_path = new paper.CompoundPath();
       	o_path.addChildren(outside);
       	o_path.fillColor = new paper.Color(0);

       	jigpath.colorizePath(outside[0], outside[1], ref_i, ref_o, this.gauge);

       	//  INSIDE WALL
        inside = jigpath.offset_innerwall();
       	i_path = new paper.CompoundPath();
       	i_path.addChildren(inside);
       	i_path.fillColor = new paper.Color(0);

       	jigpath.colorizePath(inside[1], inside[0], ref_i, ref_o, this.gauge);



		// paper.project.activeLayer.addChildren(o_path);
		paper.project.activeLayer.addChildren(i_path);
		jigpath.group.fillColor = new paper.Color(0);

		// add black background
		this.addBackground();
	},
	laser_hammer_gen: function(){
        path_a = jigpath.offset(jigpath.outer, 0);
		path_b = jigpath.offset(jigpath.hole, 0 );

		var path = new paper.CompoundPath();
		path.addChildren([path_a, path_b]);
		paper.project.activeLayer.addChildren(path);
		path.strokeWidth = 0.001;
		path.strokeColor = "red";
	},
	laser_base_gen: function(){
		outside = jigpath.offset_outerwall();
        inside = jigpath.offset_innerwall();

       	o_path = new paper.CompoundPath();
       	o_path.addChildren(outside);
       	o_path.strokeColor = "red";
       	o_path.strokeWidth = 0.001;

       	i_path = new paper.CompoundPath();
       	i_path.addChildren(inside);
   		i_path.strokeColor = "red";
   		i_path.strokeWidth = 0.001;

		paper.project.activeLayer.addChildren(o_path);
		paper.project.activeLayer.addChildren(i_path);
	},
	importSVG: function(callback){
		var scope = this;
		this.paper.project.importSVG(this.svg, {
	    	onLoad: function(item) { 
		    	
		    	scope.svgSym = item;
		        svg = paper.project.activeLayer.removeChildren();
				pathSVG = svg[0].children[0].children;

				for(var i in pathSVG){
		        	var child = pathSVG[i];
		        	child.applyMatrix = true;
		        	child.position = paper.view.center;
		        	paper.project.activeLayer.addChild(child);
		        }

		        jigpath = new JigPath(paper.project.activeLayer.children[0]);
	    		callback();
	    }});
	},
	init: function(){
		var c = this.container;
		this.canvas = DOM.tag("canvas")
				.prop('resize', true)
				.height(c.height())
				.width(c.width());

		c.append(this.canvas);	

		this.paper = new paper.PaperScope();
		this.paper.setup(this.canvas[0]);
		this.height = this.paper.view.size.height;
		this.width = this.paper.view.size.width;
		this.paper.view.zoom = 2.5;	
		var scope = this; 
		this.update();
		
		return this;
	},
	export: function(mode){
		// var prev = this.paper.view.zoom;
		// this.paper.view.zoom = 1;
		
		// if(mode == Jigdesigner.SVG)
			exp = this.paper.project.exportSVG({asString: true});
		// else if(mode == Jigdesigner.PNG)
			// exp = this.canvas[0].toDataURL("image/png");
		// else 
			// exp = "No mode was specified";
		saveAs(new Blob([exp], {type:"application/svg+xml"}), "export.svg")
	
		// console.log(exp);
		// this.paper.view.zoom = prev;

		return exp;
	}
}


//    d88b d888888b  d888b  d8888b.  .d8b.  d888888b db   db 
//    `8P'   `88'   88' Y8b 88  `8D d8' `8b `~~88~~' 88   88 
//     88     88    88      88oodD' 88ooo88    88    88ooo88 
//     88     88    88  ooo 88~~~   88~~~88    88    88~~~88 
// db. 88    .88.   88. ~8~ 88      88   88    88    88   88 
// Y8888P  Y888888P  Y888P  88      YP   YP    YP    YP   YP 

JigPath.WALL_HEIGHT = 5; //mm                                            
                                                          
JigPath.RESOLUTION = 1;
JigPath.SCALE = 100;
JigPath.TOLERANCE = 0.5;
JigPath.WALL_THICKNESS = 20;

JigPath.GOOD_MAX_MEDIAL_STRAIN = -0.5;

//R^2 = 0.7502
JigPath.LAT_POLY_STRAIN = function(medial_strain){ return poly(0.6251, -0.7328, 0.0052, medial_strain)}
//R^2 = 0.7391
JigPath.LAT_LIN_STRAIN = function(medial_strain){ return poly(0, -1.1722, 0.0276, medial_strain); }
// R^2 = 0.8608
JigPath.MED_POLY_STRAIN = function(lateral_strain){ return poly(0.7631, -1.3928, -0.0297, lateral_strain);}
// R^2 = 0.7391
JigPath.MED_LIN_STRAIN = function(lateral_strain){ return poly(0, -0.6305, -0.1469, lateral_strain);}



function JigPath(compoundPath){
	this.group = compoundPath;
	this.hole = compoundPath.children[0];
	this.outer = compoundPath.children[1];
	this.wall_thickness = JigPath.WALL_THICKNESS;
}


JigPath.prototype = {
	offset: function(path, delta){
		var _p = JigPath.sample(path, JigPath.RESOLUTION);

		paths = [_p];
		var offset_paths = new ClipperLib.Paths();

		var miterLimit = 2;
		var arcTolerance = 0.25;
		delta *= JigPath.SCALE;
		
		ClipperLib.JS.ScaleUpPaths(paths, JigPath.SCALE);
		var co = new ClipperLib.ClipperOffset(miterLimit, arcTolerance);
		co.AddPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
		co.Execute(offset_paths, delta);

		var ps = [];
		for(var i in offset_paths){
			var p = JigPath.to_paper_path(offset_paths[i]);
			p.strokeColor = new paper.Color(0, 0, 0);
			ps.push(p);
		}
		
		paper.view.update();
		return ps[0];
	}, 
	offset_outerwall: function(){
		path_a = this.offset(this.outer, this.wall_thickness + JigPath.TOLERANCE);
		path_b = this.offset(this.outer, 0 + JigPath.TOLERANCE);

		return [path_a, path_b]
	},
	offset_innerwall: function(){
		path_a = this.offset(this.hole, 0 - JigPath.TOLERANCE);
		path_b = this.offset(this.hole, -this.wall_thickness - JigPath.TOLERANCE);
		return [path_a, path_b]
	}, 
	weightFunction: function(){
		weight = {};


		path_a = this.offset(this.outer, 0);
		path_a.fillColor = '#e9e9ff';

		path_b = this.offset(this.hole, 0);
		var n = path_b.length;

		var intersections;
		for(var i = 0; i < n; i += JigPath.RESOLUTION){
			var point = path_b.getPointAt(i);
			var normal = path_b.getNormalAt(i);
			normal.length = 30;

			var result = new paper.Point(point.x + normal.x, point.y + normal.y);
			var line = new paper.Path({
		        segments: [point, result],
		        strokeColor: '#00A8E1',
		        visible: false
		    });

			var intersections = line.getIntersections(path_a);

		    for(var j in intersections){
		        var b = intersections[j].point;	
		 		weight[i] = point.getDistance(b);
		    }
		}
		path_a.remove();
		path_b.remove();
		paper.view.update();
		return weight;
	}, 
	medial_diffs: function(gauge){
		var diameter = Ruler.gauge2mm(gauge)
		var min_width = diameter;
		var max_width = JigPath.LAT_POLY_STRAIN(JigPath.GOOD_MAX_MEDIAL_STRAIN) * diameter + diameter; //  ∆L = LS * D 
		var range_width = max_width - min_width;
		FancyPrint.range("GAUGE " + gauge, [min_width, max_width])

		// // extract posweights
		weightpos = this.weightFunction();
		var positions = _.keys(weightpos).map(function(i){ return parseInt(i);});
		var weights = _.values(weightpos);


		// // normalize weight function
		FancyPrint.range("WEIGHT STATS", weights);
		norm_weights = norm(weights); 
		FancyPrint.range("NORM WEIGHTS", norm_weights);


		// // convert to lateral strain problem
		var desired_weight, lateral_strain, medial_strain;

		medial_diffs = _(norm_weights).map(function(el){
			desired_width = el * range_width + min_width;
			lateral_strain = (desired_width - min_width) / min_width;
			medial_strain = JigPath.MED_POLY_STRAIN(lateral_strain);
			return medial_strain * min_width;
		});

		FancyPrint.range("MEDIAL_DIFFS (mm)", medial_diffs);
		var magnitude = _.min(medial_diffs);
		norm_medial_diffs = norm(medial_diffs);

		return {magnitude: magnitude, values: _.object(positions, norm_medial_diffs)};		
		// return {magnitude: _.max(norm_weights), values: _.object(positions, norm_weights)};		
	}, 

	colorizePath: function(path_inner, path_outer, ref_i, ref_o, gauge){
		path_outer.fillColor = '#e9e9ff';
		// ref_i.strokeColor = 'green';
		// ref_o.strokeColor = 'magenta';


		var data = this.medial_diffs(gauge);
		var magnitude = - data.magnitude;
		

		// Calculate magnitudes
		var diameter = Ruler.gauge2mm(gauge);
		var wall_height = JigPath.WALL_HEIGHT;

		var wall_color_ratio = (wall_height - diameter) / wall_height;
		var hammer_ratio = magnitude / diameter;

		
		var n = path_inner.length;

		lines = [];
		var intersections;
		for(var i = 0; i < n; i += JigPath.RESOLUTION){
			var point = path_inner.getPointAt(i);
			var normal = path_inner.getNormalAt(i);
			var tangent = path_inner.getTangentAt(i);
			normal.length =  -1 * 30;

			var result = new paper.Point(point.x + normal.x, point.y + normal.y);
			var line = new paper.Path({
		        segments: [point, result],
		        strokeColor: '#00A8E1',
		        visible: false
		    });

			var intersectionA = getFirst(point, line.getIntersections(path_outer));
			var intersectionW0 = getFirst(point, line.getIntersections(ref_o));
			var intersectionW1 = getFirst(point, line.getIntersections(ref_i));

			line.remove();

		   //      var b = intersections[j].point;
		   if(intersectionA != -1 && intersectionW0 != -1 && intersectionW1 != -1){		      
		      	var width = subPoints(point, intersectionA);
		 		var rect_width = point.getDistance(intersectionA);
		 		var rect_height = JigPath.RESOLUTION * 1.5;
		 		var rectangle = new paper.Rectangle(point.x, point.y, rect_width, rect_height);
		 		var rectangle_path = new paper.Path.Rectangle(rectangle);

		 		// GET APPR. COLOR
		 		var idx = ref_i.getOffsetOf(intersectionW1);
		 		// console.log("IDX", idx);

		 		var closestIDX = closest_in_array(_(data.values).keys(), idx);

		 		// ADD REACTANGLE
		 		rectangle_path.fillColor = new paper.Color(data.values[closestIDX] * diameter) ;
		 		
		 		tangent.length = rect_height/2;
		 		rectangle_path.rotate(width.angle + 180 , point);
		 		rectangle_path.position.x += tangent.x;
		 		rectangle_path.position.y += tangent.y;
		 	}
		 	else{
		 		line.visible = false;
		 	}
		}


		paper.view.update();
		console.log("EXTRUDE: ", magnitude);
	},
	colorize: function(gauge){


		var data = this.medial_diffs(gauge);
		var magnitude = - data.magnitude;
		

		// Calculate magnitudes
		var diameter = Ruler.gauge2mm(gauge);
		var wall_height = JigPath.WALL_HEIGHT;

		var wall_color_ratio = (wall_height - diameter) / wall_height;
		var hammer_ratio = magnitude / diameter;



		
		path_a = this.offset(this.outer, 0 + JigPath.TOLERANCE);
		path_a.fillColor = '#e9e9ff';
		path_b = this.offset(this.hole, 0 - JigPath.TOLERANCE);
		var n = path_b.length;

		lines = [];
		var intersections;
		for(var i = 0; i < n; i += JigPath.RESOLUTION){
			var point = path_b.getPointAt(i);
			var normal = path_b.getNormalAt(i);
			var tangent = path_b.getTangentAt(i);
			normal.length = 30;

			var result = new paper.Point(point.x + normal.x, point.y + normal.y);
			var line = new paper.Path({
		        segments: [point, result],
		        strokeColor: '#00A8E1',
		        visible: false
		    });

			var intersections = line.getIntersections(path_a);
			
		    for(var j in intersections){

		        var b = intersections[j].point;		      
		      	var width = subPoints(point, b);
		 		var rect_width = point.getDistance(b);
		 		var rect_height = JigPath.RESOLUTION * 1.5;
		 		var rectangle = new paper.Rectangle(point.x, point.y, rect_width, rect_height);
		 		var rectangle_path = new paper.Path.Rectangle(rectangle);
		 		rectangle_path.fillColor = new paper.Color((1 - data.values[i]) * hammer_ratio + wall_color_ratio) ;
		 		tangent.length = rect_height/2;
		 		rectangle_path.rotate(width.angle + 180 , point);
		 		rectangle_path.position.x += tangent.x;
		 		rectangle_path.position.y += tangent.y;
		    }
		}
		path_a.remove();
		path_b.remove();
		paper.view.update();


		console.log("EXTRUDE: ", magnitude);
	}
}
function closest_in_array(arr, goal){
	var closestIDX = arr.reduce(function (prev, curr) {
					  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
					});
	return closestIDX;
}
function getFirst(pt, intersections){
	if (intersections.length == 0) return -1;
	var min_idx = -1;
	var min_dist = 1000000000;
	for(var i in intersections){

		var dist = pt.getDistance(intersections[i].point);
		if(dist < min_dist){
			min_dist = dist;
			min_idx = i;
		}
	}
	return intersections[min_idx].point;
}

JigPath.clone = function(path){
	console.log(JigPath.sample(path, JigPath.RESOLUTION));
	return JigPath.to_paper_path(JigPath.sample(path, JigPath.RESOLUTION));
}
JigPath.to_paper_path = function(pts){
	var path = new paper.Path();
	path.strokeColor = 'black';
	pts.forEach(function(currentValue, index, array){
		path.add(new paper.Point(currentValue.X/JigPath.SCALE, currentValue.Y/JigPath.SCALE));
	});
	path.closed = true;
	return path;
}
JigPath.sample = function(paper_path, resolution){
	var n = paper_path.length;
	var p = []; 
	for(var i = 0; i < n; i += resolution){
		var point = paper_path.getPointAt(i);
		p.push({X: point.x, Y: point.y});
	}
	return p;
}

//    d88b d888888b  d888b   .o88b. db      d888888b d8888b. d8888b. d88888b d8888b. 
//    `8P'   `88'   88' Y8b d8P  Y8 88        `88'   88  `8D 88  `8D 88'     88  `8D 
//     88     88    88      8P      88         88    88oodD' 88oodD' 88ooooo 88oobY' 
//     88     88    88  ooo 8b      88         88    88~~~   88~~~   88~~~~~ 88`8b   
// db. 88    .88.   88. ~8~ Y8b  d8 88booo.   .88.   88      88      88.     88 `88. 
// Y8888P  Y888888P  Y888P   `Y88P' Y88888P Y888888P 88      88      Y88888P 88   YD 
                                                                                  
                                                                                  
function JigClipper(){
	this.clipper = ClipperLib.Clipper();
}


// db    db d888888b d888888b db      d888888b d888888b db    db 
// 88    88 `~~88~~'   `88'   88        `88'   `~~88~~' `8b  d8' 
// 88    88    88       88    88         88       88     `8bd8'  
// 88    88    88       88    88         88       88       88    
// 88b  d88    88      .88.   88booo.   .88.      88       88    
// ~Y8888P'    YP    Y888888P Y88888P Y888888P    YP       YP


function addPoints(pta, ptb){
	return new paper.Point(pta.x + ptb.x, pta.y + ptb.y);
}
function subPoints(pta, ptb){
	return new paper.Point(pta.x - ptb.x, pta.y - ptb.y);
}    
                                                              
                                                              

