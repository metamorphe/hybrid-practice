DIFUSSER_BASE_HEIGHT = 0.641;
BASE_EXPANSION = 10; //mm
RIM_HEIGHT = 0.128; 
RIM_WIDTH = 1.5; //mm
PEG_RADIUS = 3.55; //mm
PEG_PADDING = 10; //mm


function make_diffuser_spacer(display){

	//Declarations
	var diffusers = display.queryPrefix('DIF');
	var leds = display.queryPrefix('NLED');
	var breakout = display.queryPrefix('BO');
	var breakin = display.queryPrefix('BI');
	var circuit_path = display.queryPrefix('CP');

	//Functions
	var all_objects = _.flatten([diffusers, leds, breakout, breakin, circuit_path]);//, cornerCircle1, cornerCircle2, cornerCircle3, cornerCircle4];
	var result = new paper.Group(all_objects);

	// SUPPORT STRUCTURE
	var boundingBox = new paper.Path.Rectangle({
		parent: result,
		rectangle: result.strokeBounds.expand(Ruler.mm2pts(BASE_EXPANSION)), 
		fillColor: new Color(DIFUSSER_BASE_HEIGHT)
	});
	boundingBox.sendToBack();

	// MAKE HOLES FOR DIFFUSERS
	_.each(diffusers, function(diffuser){
		diffuser.set({
			strokeColor: new paper.Color(RIM_HEIGHT),
			strokeWidth: (Ruler.mm2pts(RIM_WIDTH)),
			fillColor: 'black'
		});
	});

	// ADD CORNER PEGS
	create_corner_pegs({ 
		bounds: boundingBox.bounds, 
		radius: PEG_RADIUS, 
		padding: PEG_PADDING, 
		height: 'white', 
		parent: result
	});
	
	// ADD WIRE HOLES
	calc_centroids(diffusers);

	make_wire_holes(result, diffusers, boundingBox, RIM_HEIGHT, RIM_WIDTH);

	// REFLECT ACROSS X
	result.scaling = new paper.Size(-1, 1);

	var invisible = _.flatten([leds, breakout, breakin, circuit_path]);
	set_visibility(invisible, false);

	return result;
}





/*Calculate the centroids of objects and return a list of centroid coordinates**/
function calc_centroids(diffusers){
	_.each(diffusers, function(diffuser){
		diffuser.visible = true;
		// console.log(diffuser);
		// Centroid calculation
		calc_centroid = _.reduce(diffuser.segments, function(memo, seg){
			return memo.add(new paper.Point(seg.point.x, seg.point.y));
		}, new paper.Point(0, 0));

		diffuser.centroid = calc_centroid.divide(diffuser.segments.length);
	});
}


/* Escape holes for 1mm wide wires from each diffuser */
function make_wire_holes(parent, diffusers, boundingBox, hole_depth, stroke_width){
	return _.map(diffusers, function(diffuser){
		var bound_point = boundingBox.getNearestPoint(diffuser.centroid);
		var l = new paper.Path.Line({
			parent: parent,
			from: diffuser.centroid, 
			to: bound_point, 
			strokeColor: new paper.Color(hole_depth),
			strokeWidth: Ruler.mm2pts(stroke_width)
		});
	});	
}

function set_visibility(objects, is_visible) {
	_.each(objects, function(object){
		object.visible = is_visible;
	});
	paper.view.update();
}

function create_corner_pegs(o){
	o.radius = Ruler.mm2pts(o.radius);
	o.padding = Ruler.mm2pts(o.padding);

	corners = [o.bounds.topRight, o.bounds.topLeft, o.bounds.bottomLeft, o.bounds.bottomRight]
	corners = _.map(corners, function(corner){
		var dir = corner.clone().subtract(paper.view.center);
		dir.length = o.padding;

		return paper.Path.Circle({
			parent: o.parent,
			position: corner.subtract(dir), 
			fillColor: o.height,
			radius: o.radius
		});
	});
	return corners;
}
