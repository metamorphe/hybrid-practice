// NAMESPACE FOR ELD PIPEPLINE

// SPACER + REFLECTOR
var PEG_RADIUS = 3.55; //mm
var PEG_PADDING = 10; //mm
var WALL_WIDTH = 3; //mm

// SPACER 
var WALL_EXPANISION = BASE_EXPANSION + WALL_WIDTH; //mm
var BASE_HEIGHT = 0.55; // relative 1.7 (base) /3.1 (wall) mm
var CHANGE_IN_X_DIR = 8; //pts
var CHANGE_IN_Y_DIR = 8; //pts

// REFLECTOR
var DIFUSSER_BASE_HEIGHT = 0.641;
var BASE_EXPANSION = 10; //mm
var RIM_HEIGHT = 0.128; 
var RIM_WIDTH = 1.5; //mm

// MOLDS
var MOLD_WALL = 5; // mm

// PCB
var POINT_OFFSET = 10; //pts
var POINT_INNER_OFFSET = 1; //pts
var THETA_STEP = 1; //pts
var OPT_MAX_ITERS = 20;
var EPSILON = 10; 



function Pipeline (argument) {}

Pipeline.getElements = function(){
	return {
		art: display.queryPrefix('ART'),
		diff: display.queryPrefix('DIF'),
		leds: display.queryPrefix('NLED'),
		bo :display.queryPrefix('BO'),
		bi: display.queryPrefix('BI'),
		cp: display.queryPrefix('CP'),
		dds: display.queryPrefix('DDS'),
	}
}
Pipeline.script = {
	pcb: function(display){
		console.log("Running PCB Generator");
		e = Pipeline.getElements();

		function generateNodes(nodes, callbackFN){
			var c = new Artwork("components/APA102C.svg", function(footprint) {
				
				square = footprint.queryPrefix("SMD");
				square[0].remove();
				nodes = _.map(nodes, function(element){ 
					is_breakout = ["BO", "BI"].indexOf(Artwork.getPrefix(element)) != -1;
					
					if(is_breakout){
						rectangle = new Path.Rectangle({
							rectangle: element.bounds, 
							strokeColor: "black", 
							background: "white"
						});
					}
					else{
						var fp = footprint.clone();
						fp.svg.position = element.position;
						rectangle = fp.svg;
					}

					// Establish two circles to help with routing.
					var offset = new paper.Point(POINT_OFFSET, 0);
				
					var entryPoint = new Path.Circle({
						position: rectangle.bounds.leftCenter.clone().subtract(offset), 
						radius: 3, 
						fillColor: "blue"
					});
					var exitPoint = new Path.Circle({
						position: rectangle.bounds.rightCenter.clone().add(offset), 
						radius: 3, 
						fillColor: "blue"
					});

					var in_offset = new paper.Point(POINT_INNER_OFFSET, 0);
					// Establish surface-contact circles for final routing.
					var contactEntryPoint = new Path.Circle({
						position: rectangle.bounds.leftCenter.clone().add(in_offset), 
						radius: 2,
						fillColor: "green"
					});

					var contactExitPoint = new Path.Circle({
						position: rectangle.bounds.rightCenter.clone().subtract(in_offset), 
						radius: 2,
						fillColor: "green"
					});

					var group = new Group([rectangle, entryPoint, exitPoint, contactEntryPoint, contactExitPoint]);

					// group.text = pointText;
					group.rectangle = rectangle;
					group.inputPoint = entryPoint;
					group.outputPoint = exitPoint;
					group.contactInput = contactEntryPoint;
					group.contactOutput = contactExitPoint;
					return group;
				});

				callbackFN(nodes);
				footprint.remove();
			}, true);
		}

		// Function to obtain cost (Path length) from node with two neighbors.
		function cost(node, paths) {
			is_breakout = _.isNull(node.left) || _.isNull(node.right);
			
			breakout_bias = is_breakout ? 10000000: 0;
			if(node.rotation % 45 == 0 ) breakout_bias = 0;

			return breakout_bias + _.reduce(paths, function(memo, path){
				return memo + path.length;
			}, 0);
		};

		// Helper Function to determine optimal routing.
		function bestCost(node) {
			var cost_table = [];
			var original_rotation = node.rotation;
			for(var theta = 0; theta < 360; theta += THETA_STEP){
				
				node.rotation = theta;
				var neighbors = [];

				if(!_.isNull(node.left))
					neighbors.push([node.left.outputPoint.position, node.inputPoint.position]);
				if(!_.isNull(node.right))
					neighbors.push([node.outputPoint.position, node.right.inputPoint.position]);

				neighbors = _.map(neighbors, function(neighbor){
					return new Path(neighbor[0], neighbor[1])
				});

				cost_table.push({theta: theta, cost: cost(node, neighbors)})
				_.each(neighbors, function(neighbor){ neighbor.remove()});
			}
			node.rotation = original_rotation;
			return _.min(cost_table, function(entry){ return entry.cost });
		}

		// Function to route the rectangles together based on overall cost.
		function route(nodes) {
			difference = Number.MAX_SAFE_INTEGER;
			iters = 0;

			while(difference > EPSILON && iters < OPT_MAX_ITERS){
				result = _.map(nodes, function(node, i){
					return bestCost(node);
				});

				difference = _.reduce(nodes, function(memo, node, i){
					var prev = node.rotation;
					node.rotation = result[i].theta;
					return memo + Math.abs(prev - result[i].theta);
				}, 0);



				paper.view.update();
				iters++;
				console.log("OPT STEP", iters, difference);
			}
		};
		function connect_the_dots(nodes){
			pts = []
			var lines = new paper.Group({name: "TRACE: Trace Expansion"});
			_.each(nodes, function(node, i, arr){
				var neighbors = [];

				if(!_.isNull(node.right))
					neighbors.push([node.contactOutput.position, node.outputPoint.position, node.right.inputPoint.position,node.right.contactInput.position]);
				
				neighbors = _.map(neighbors, function(neighbor, i, arr){
					pts.push(neighbor);
					
					return new paper.Path({
						parent: lines,
						segments: neighbor,
						strokeColor: "blue", 
						strokeWidth: 3
					})
				});
			});
			bgPath = new paper.Path({
				strokeColor: "yellow",
				segments: _.flatten(pts),
				strokeWidth: Ruler.mm2pts(10)
			});
			bgPath.sendToBack();
		}

		function cleanup(nodes){
			var ngroup = new paper.Group(nodes);
			_.each(nodes, function(node){
				node.inputPoint.remove();
				node.outputPoint.remove();
				node.contactInput.remove();
				node.contactOutput.remove();
			});
			
			display.svg.remove();
			paper.view.update();
		}
		
		// Function that initializes the routing process.
		function init() {					
			leds = _.sortBy(e.leds, function(led){ return led.lid;});
			nodes = _.flatten([e.bi,  leds,  e.bo]);
			
			nodes = generateNodes(nodes, function(nodes){
					// linked list
				_.each(nodes, function(node, i, arr){
					node.right = null;
					node.left = null;

					if(i - 1 >= 0) node.left = arr[i - 1];
					if(i + 1 < arr.length) node.right = arr[i + 1];
				});
				
				route(nodes);
				connect_the_dots(nodes);
				cleanup(nodes);
			});
		};

		// Call to the initialization function.
		init();
		return result;
	},
	mask: function(display){
		console.log("Running Mask Generator");
		e = Pipeline.getElements();

		Pipeline.set_visibility(e.art, true);
        var invisible = _.compact(_.flatten([e.leds, e.cp, e.diff, e.dds, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);
        
        return new paper.Group(e.art);
	},
	mold: function(display){
		console.log("Running Mold Generator");
       
        e = Pipeline.getElements();

      
        console.log("Found", e.diff.length, "diffusers...")
        //Extrating diffusers
        _.each(e.diff, function(diffuser){
          diffuser.set({
            visible: true,
            fillColor: "black",
            strokeColor: "white",
            strokeWidth: Ruler.mm2pts(2)
          });
        });

        var result = new paper.Group(e.diff);

        //Creating a bounding box
        boundingBox = new paper.Path.Rectangle({
        	rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL), 0), 
	        fillColor: 'white', 
	        parent: result
        });
        boundingBox.sendToBack();


        //Make non-molding objects invisible
        var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);

        result.scaling = new paper.Size(-1, 1);
        return result;
	},
	mold_tiered: function(display){
		  console.log("Running Tiered Mold Generator");
        //Declarations
        e = Pipeline.getElements();
     
        console.log("Found", e.diff.length, "diffusers...")
        //Extrating diffusers
        _.each(e.diff, function(diffuser){
          diffuser.set({
            visible: true,
          });
          diffuser.fillColor.lightness = 1.0 - diffuser.fillColor.lightness;
        });

        console.log("Found", dds.length, "DDs...")
        _.each(e.dds, function(dd) {
          dd.set({
            visible: true,
          });
          dd.fillColor.lightness = 1.0 - dd.fillColor.lightness;
          dd.bringToFront();
        });
        var all = _.compact(_.flatten([dds, diffusers]));

        var result = new paper.Group(all);

        //Creating a bounding box
        boundingBox = new paper.Path.Rectangle({
        	rectangle: diff_group.bounds.expand(Ruler.mm2pts(MOLD_WALL), 0), 
        	fillColor: "white", 
        	parent: result
        });
        boundingBox.sendToBack();

    
        //Make non-molding objects invisible
        var invisible = _.flatten([e.leds, e.cp, e.bi, e.bo]);
       	Pipeline.set_visibility(invisible, false);

       	result.scaling = new paper.Size(-1, 1);
        return result;
	},
	reflectors: function(display){
		console.log("Running Reflector Generator");
		e = Pipeline.getElements();

		// PROCESSING
		calc_centroids(e.diff);

		// MAKE REFLECTORS
		_.each(e.diff, function(diffuser){
			diffuser.set({
				strokeColor: new paper.Color(RIM_HEIGHT),
				strokeWidth: (Ruler.mm2pts(RIM_WIDTH)),
				fillColor: 'black'
			});
		});

		var all = _.flatten([e.diff]);
		var result = new paper.Group(all);

		// SUPPORT STRUCTURE
		var boundingBox = new paper.Path.Rectangle({
			parent: result,
			rectangle: result.strokeBounds.expand(Ruler.mm2pts(BASE_EXPANSION)), 
			fillColor: new Color(DIFUSSER_BASE_HEIGHT)
		});
		boundingBox.sendToBack();

		// WIRE HOLES
		// Pipeline.make_wire_holes(result, e.diff, boundingBox, RIM_HEIGHT, RIM_WIDTH);
		
		// CORNER PEGS
		pegs = Pipeline.create_corner_pegs({ 
			bounds: boundingBox.bounds, 
			radius: PEG_RADIUS, 
			padding: PEG_PADDING, 
			height: 'white', 
			parent: result
		});
		
		// REFLECT ACROSS X
		result.scaling = new paper.Size(-1, 1);

		// INVISIBILITY
		var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.bo, e.bi, e.cp]));
		Pipeline.set_visibility(invisible, false);

		return result;
	},
	spacer: function(display){
		console.log("Running Spacer Generator");
		e = Pipeline.getElements();

		
		// LED holes with 1mm tolerance
		_.each(e.leds, function(led){
			led.set({
				fillColor: "black",
				strokeColor: 'black',
				strokeWidth: Ruler.mm2pts(1)
			});
		});

	
		var all = _.flatten([e.leds, e.bo, e.bi]);
		var result = new paper.Group(all);


		// BACKGROUND
		var backgroundBox = new paper.Path.Rectangle({
			rectangle : result.bounds.expand(Ruler.mm2pts(WALL_EXPANISION), 0), 
			fillColor: new paper.Color(BASE_HEIGHT),
			strokeColor: 'white',
			strokeWidth: Ruler.mm2pts(WALL_WIDTH)
		});
		backgroundBox.sendToBack();
		

		// ADD CORNER PEGS
		var pegs = Pipeline.create_corner_pegs({ 
			bounds: boundingBox.bounds, 
			radius: PEG_RADIUS, 
			padding: PEG_PADDING, 
			height: 'black', 
			parent: result
		});

		/* Compute the Convex Hull */
		var breakio = _.compact(_.flatten([BI[0],BO[0]]));

		expansions = _.map(breakio, function(el){
				el.calculateOMBB();
				el.ombb.visible = true;
				expansion = Pipeline.extend_to_edge(el.ombb, backgroundBox);
				expansion.set({
					fillColor: 'black',
					strokeColor: 'black',
					strokeWidth: 2
				});
				return [ombb, expansion]
		});



		var invisible = _.compact(_.flatten([e.dds, e.diff, e.cp]));
		Pipeline.set_visibility(invisible, false);

		/* Reflect Object */
		result.scaling = new paper.Size(-1, 1);
		return result;
	}
}


/* Function takes in bounds box, and creates the bounding holes */
Pipeline.create_corner_pegs = function(o){
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

	
Pipeline.extend_to_edge = function(ombb,backgroundBox){
	// compute the two nearest points of the rectangle to wall
	var OMBB = ombb.clone();
	var distance_table = [];
	var points = _.map(OMBB.segments, function(seg){ return seg.point; });
	
	// creates distance table 
	distance_table = _.map(points, function(pt,i,arr){
		var wall_point = backgroundBox.getNearestPoint(pt);
		var vector = wall_point.subtract(pt);
		var distance = vector.length;
		return {
			point: pt,
			distance: distance,
			vector: vector,      // vector of point to wall
			idx: i
		};
	});

	// sorts distance table from min distance to max distance 
	var distance_table = _.sortBy(distance_table, function(item){
		return item.distance;
	});
	
	// since its sorted by min to max, the first two are the closest points
	var closest = distance_table[0];
	var sec_closest = distance_table[1];

	// line between closest and second closest points
	var line = new paper.Path.Line({
		from: closest.point,
		to: sec_closest.point
	});

	// line perpendicular to line between closest and second closest points
	var perp_line = line.clone();
	perp_line.rotation = 90;
	// perp_line.strokeColor = 'red';

	var pt1  = perp_line.segments[0].point.multiply(2);
	var pt2  = perp_line.segments[1].point.multiply(2);
	
	// direction vectors
	var vector1 = pt1.subtract(pt2);
	var vector2 = pt2.subtract(pt1);

	// area before expanding
	var area = OMBB.area;
	
	//add the vector to the two closest points:
	OMBB.segments[closest.idx].point = OMBB.segments[closest.idx].point.add(vector1);
	OMBB.segments[sec_closest.idx].point = OMBB.segments[sec_closest.idx].point.add(vector1);
	var new_closest = OMBB.segments[closest.idx].point;
	var new_sec_closest = OMBB.segments[sec_closest.idx].point
	
	// area after expansion
	var expanded_area = OMBB.area;
	
	// Check if expansion has occured to determine if correct direction vector has been added
	if (expanded_area < area){
		OMBB.segments[closest.idx].point = OMBB.segments[closest.idx].point.subtract(vector1);
		OMBB.segments[sec_closest.idx].point = OMBB.segments[sec_closest.idx].point.subtract(vector1);
		OMBB.segments[closest.idx].point = OMBB.segments[closest.idx].point.add(vector2);
		OMBB.segments[sec_closest.idx].point = OMBB.segments[sec_closest.idx].point.add(vector2);
		new_closest 	= OMBB.segments[closest.idx].point;
		new_sec_closest = OMBB.segments[sec_closest.idx].point;
	}

	var expansion = backgroundBox.intersect(OMBB);				
	line.remove();
	perp_line.remove();
	return expansion;
}



/* Escape holes for 1mm wide wires from each diffuser */
Pipeline.make_wire_holes = function(parent, diffusers, boundingBox, hole_depth, stroke_width){
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

Pipeline.set_visibility = function(objects, is_visible) {
	_.each(objects, function(object){
		object.visible = is_visible;
	});
	paper.view.update();
}

/*Calculate the centroids of objects and return a list of centroid coordinates**/
function calc_centroids(diffusers){
	_.each(diffusers, function(diffuser){
		diffuser.visible = true;
		if(diffuser.className == "CompoundPath") diffuser = diffuser.children[0];
		calc_centroid = _.reduce(diffuser.segments, function(memo, seg){
			return memo.add(new paper.Point(seg.point.x, seg.point.y));
		}, new paper.Point(0, 0));
		diffuser.centroid = calc_centroid.divide(diffuser.segments.length);
	});
}



// CIRCUIT CLEANING TOOL
var hitOptions = {
					segments: true,
					stroke: true,
					fill: true,
					tolerance: 10
				}

var t = new paper.Tool();
t.selected = [];

function addAnchorPoint(pathReceiver, point){
	var closestPoint = pathReceiver.getNearestPoint(point);
	var location = pathReceiver.getLocationOf(closestPoint);
	var index  = location.curve.segment2.index;
	console.log(index);
	return pathReceiver.insert(index, closestPoint);
}

t.onMouseDown = function(event) {

	var hitResult = project.hitTest(event.point, hitOptions);
	

	if (!hitResult){
		console.log("No hits");
		return;
	} else{

	if(hitResult.type == "stroke"){
		console.log("Adding anchor");
		var anchor = addAnchorPoint(hitResult.item, event.point);
		var anchorBG = addAnchorPoint(bgPath, event.point);

		t.selected.push(anchor);
		t.selected.push(anchorBG);
		
	}
	else if (hitResult.type == 'segment') {
		console.log("hit segment")
		anchor = hitResult.segment;
		var anchorBG = addAnchorPoint(bgPath, event.point);
		t.selected.push(anchor);
		t.selected.push(anchorBG);
	}
	}					
};

t.onMouseDrag = function(event) {
	_.each(t.selected, function(anchor){
		anchor.selected = true;
		anchor.point = anchor.point.add(event.delta);
	});
};

t.onMouseUp = function(event){
	_.each(t.selected, function(anchor){
		anchor.selected = false;
	});
	t.selected = [];
}



