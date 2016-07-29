// NAMESPACE FOR ELD PIPEPLINE

// SPACER + REFLECTOR
var PEG_RADIUS = 3.55 / 2.0; //mm
var PEG_PADDING = 10; //mm
var WALL_WIDTH = 3; //mm

// REFLECTOR
var DIFUSSER_BASE_HEIGHT = 0.641;
var BASE_EXPANSION = -3; //mm
var RIM_HEIGHT = 0.128;
var RIM_WIDTH = 1.5; //mm

// SPACER 
var WALL_EXPANISION = BASE_EXPANSION + WALL_WIDTH; //mm
var BASE_HEIGHT = 0.55; // relative 1.7 (base) /3.1 (wall) mm
var CHANGE_IN_X_DIR = 8; //pts
var CHANGE_IN_Y_DIR = 8; //pts
var LED_TOLERANCE = 3; //mm


// MOLDS
var MOLD_WALL = 5; // mm

// PCB
var POINT_OFFSET = 10; //pts
var POINT_INNER_OFFSET = 1; //pts
var THETA_STEP = 1; //pts
var OPT_MAX_ITERS = 20;
var EPSILON = 10;



function Pipeline(argument) {}

Pipeline.getElements = function() {
    return {
        art: display.queryPrefix('ART'),
        diff: display.queryPrefix('DIF'),
        leds: display.queryPrefix('NLED'),
        bo: display.queryPrefix('BO'),
        bi: display.queryPrefix('BI'),
        cp: display.queryPrefix('CP'),
        dds: display.queryPrefix('DDS'),
        mc: display.queryPrefix("MC")
    }
}
Pipeline.script = {
    circuit: function(display, e) {
        function generateNodes(nodes, callbackFN) {

            var c = new Artwork("/components/APA102C.svg", function(footprint) {

                square = footprint.queryPrefix("SMD");
                square[0].remove();
                nodes = _.map(nodes, function(element) {
                    is_breakout = ["BO", "BI"].indexOf(Artwork.getPrefix(element)) != -1;

                    if (is_breakout) {
                        rectangle = new Path.Rectangle({
                            rectangle: element.bounds,
                            strokeColor: "black",
                            background: "white"
                        });
                    } else {
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
            });
        }

        // Function to obtain cost (Path length) from node with two neighbors.
        function cost(node, paths) {
            is_breakout = _.isNull(node.left) || _.isNull(node.right);

            breakout_bias = is_breakout ? 10000000 : 0;
            // if(node.rotation % 45 == 0 ) breakout_bias = 0;

            return breakout_bias + _.reduce(paths, function(memo, path) {
                return memo + path.length;
            }, 0);
        };

        // Helper Function to determine optimal routing.
        function bestCost(node) {
            var cost_table = [];
            var original_rotation = node.rotation;
            for (var theta = 0; theta < 360; theta += THETA_STEP) {

                node.rotation = theta;
                var neighbors = [];

                if (!_.isNull(node.left))
                    neighbors.push([node.left.outputPoint.position, node.inputPoint.position]);
                if (!_.isNull(node.right))
                    neighbors.push([node.outputPoint.position, node.right.inputPoint.position]);

                neighbors = _.map(neighbors, function(neighbor) {
                    return new Path(neighbor[0], neighbor[1])
                });

                cost_table.push({ theta: theta, cost: cost(node, neighbors) })
                _.each(neighbors, function(neighbor) { neighbor.remove() });
            }
            node.rotation = original_rotation;
            return _.min(cost_table, function(entry) {
                return entry.cost });
        }

        // Function to route the rectangles together based on overall cost.
        function route(nodes) {
            difference = Number.MAX_SAFE_INTEGER;
            iters = 0;

            while (difference > EPSILON && iters < OPT_MAX_ITERS) {
                result = _.map(nodes, function(node, i) {
                    return bestCost(node);
                });

                difference = _.reduce(nodes, function(memo, node, i) {
                    var prev = node.rotation;
                    node.rotation = result[i].theta;
                    return memo + Math.abs(prev - result[i].theta);
                }, 0);



                paper.view.update();
                iters++;
                console.log("OPT STEP", iters, difference);
            }
        };

        function connect_the_dots(nodes) {
            pts = []
            var lines = new paper.Group({ name: "TRACE: Trace Expansion" });
            _.each(nodes, function(node, i, arr) {
                var neighbors = [];

                if (!_.isNull(node.right))
                    neighbors.push([node.contactOutput.position, node.outputPoint.position, node.right.inputPoint.position, node.right.contactInput.position]);

                neighbors = _.map(neighbors, function(neighbor, i, arr) {
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

        function cleanup(nodes) {
            var ngroup = new paper.Group(nodes);
            _.each(nodes, function(node) {
                node.inputPoint.remove();
                node.outputPoint.remove();
                node.contactInput.remove();
                node.contactOutput.remove();
            });

            var all = _.flatten([e.leds, e.bo, e.bi, e.diff]);
            var result = new paper.Group(all);


            // BACKGROUND
            var backgroundBox = new paper.Path.Rectangle({
                rectangle: result.bounds.expand(Ruler.mm2pts(WALL_EXPANISION)),
                fillColor: new paper.Color(BASE_HEIGHT),
                strokeColor: 'white',
                strokeWidth: Ruler.mm2pts(WALL_WIDTH),
                parent: result
            });

            backgroundBox.sendToBack();

            display.svg.remove();

            paper.view.update();
        }

        // Function that initializes the routing process.
        leds = _.sortBy(e.leds, function(led) {
            return led.lid; });
        nodes = _.flatten([e.bi, leds, e.bo]);

        nodes = generateNodes(nodes, function(nodes) {
            // linked list
            _.each(nodes, function(node, i, arr) {
                node.right = null;
                node.left = null;

                if (i - 1 >= 0) node.left = arr[i - 1];
                if (i + 1 < arr.length) node.right = arr[i + 1];
            });

            route(nodes);
            connect_the_dots(nodes);
            cleanup(nodes);

        });

        var result = new paper.Group(nodes);
        result.name = "RESULT: MASK";
    },
    mask: function(display, e) {
        Pipeline.set_visibility(e.art, true);
        var invisible = _.compact(_.flatten([e.leds, e.cp, e.diff, e.dds, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);

        result = new paper.Group(e.art);
        result.name = "RESULT: MASK";
    },
    diffuser: function(display, e) {
        console.log("Found", e.diff.length, "diffusers...")
            //Extrating diffusers
        _.each(e.diff, function(diffuser) {
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
        result.name = "RESULT: DIFFUSER";
    },
    mold_tiered: function(display, e) {


        console.log("Found", e.diff.length, "diffusers...")
            //Extrating diffusers
        _.each(e.diff, function(diffuser) {
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
        result.name = "RESULT: TIER MOLD";
    },
    lens: function(display, e) {

        // MAKE REFLECTORS
        var all = _.flatten([e.diff, e.leds]);
        var result = new paper.Group(all);
        boundingBox = new paper.Path.Rectangle({
            rectangle: result.bounds,
            fillColor: "white",
            parent: result
        });


        ramps = _.map(e.diff, function(diffuser) {
            return setMoldGradient(false, diffuser, _.filter(e.leds, function(l) {
                return diffuser.contains(l.bounds.center); }));
        });
        // console.log(ramp);
        result.addChildren(ramps);
        _.each(e.leds, function(led) {
                led.bringToFront();
            })
            // ramp.selected = true;
            // boundingBox.sendToBack();
            // REFLECT ACROSS X
            // result.scaling = new paper.Size(-1, 1);

        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: LENS";
    },
    reflector: function(display, e) {

        // MAKE REFLECTORS
        var all = _.flatten([e.diff, e.leds]);
        var result = new paper.Group(all);
        boundingBox = new paper.Path.Rectangle({
            rectangle: result.bounds,
            fillColor: "white",
            parent: result
        });


        ramps = _.map(e.diff, function(diffuser) {
            return setMoldGradient(true, diffuser, _.filter(e.leds, function(l) {
                return diffuser.contains(l.bounds.center); }));
        });
        // console.log(ramp);
        result.addChildren(ramps);
        _.each(e.leds, function(led) {
                led.bringToFront();
            })
            // ramp.selected = true;
            // boundingBox.sendToBack();
            // REFLECT ACROSS X
            // result.scaling = new paper.Size(-1, 1);

        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: REFLECTOR";
    },
    cap: function(display, e) {

        // PROCESSING
        calc_centroids(e.diff);

        // MAKE REFLECTORS
        _.each(e.diff, function(diffuser) {
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
        // pegs = Pipeline.create_corner_pegs({ 
        // 	bounds: boundingBox.bounds, 
        // 	radius: Ruler.mm2pts(PEG_RADIUS), 
        // 	padding: Ruler.mm2pts(PEG_PADDING), 
        // 	height: 'white', 
        // 	parent: result
        // });

        // REFLECT ACROSS X
        result.scaling = new paper.Size(-1, 1);

        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.bo, e.bi, e.cp]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: CAP";
    },
    spacer: function(display, e) {


        // LED holes with 1mm tolerance
        // console.log()
        _.each(e.leds, function(led) {
            led.set({
                fillColor: "black",
                strokeColor: 'black',
                strokeWidth: Ruler.mm2pts(LED_TOLERANCE)
            });
        });


        var all = _.flatten([e.leds, e.bo, e.bi, e.diff, e.mc]);
        var result = new paper.Group(all);


        // BACKGROUND
        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(WALL_EXPANISION)),
            fillColor: new paper.Color(BASE_HEIGHT),
            strokeColor: 'white',
            strokeWidth: Ruler.mm2pts(WALL_WIDTH),
            parent: result
        });

        backgroundBox.sendToBack();
        var mc = e.mc[0];
        mc.fillColor = "black";
        mc.pivot = mc.bounds.leftCenter;
        mc.position = backgroundBox.getNearestPoint(mc.pivot);
        mc.position.x -= Ruler.mm2pts(WALL_WIDTH) / 4.0;

        // ADD CORNER PEGS
        // var pegs = Pipeline.create_corner_pegs({ 
        // 	bounds: backgroundBox.strokeBounds, 
        // 	radius: Ruler.mm2pts(PEG_RADIUS), 
        // 	padding: Ruler.mm2pts(PEG_PADDING), 
        // 	height: 'black', 
        // 	parent: result
        // });

        // Compute the Convex Hull 
        var breakio = _.compact(_.flatten([e.bi, e.bo]));

        // expansions = _.map(breakio, function(el){
        // 	el.calculateOMBB();
        // 	el.ombb.visible = true;


        // 	el.ombb.fillColor = "yellow";
        // 	// el.ombb.selected = true;
        // 	expansion =  Pipeline.extend_to_edge(el.ombb, backgroundBox);
        // 	expansion.set({
        // 		// parent: result,
        // 		fillColor: 'black',
        // 		strokeColor: 'black',
        // 		strokeWidth: 2
        // 	});
        // 	expansion.rotate(-90, el.ombb.bounds.center);
        // 	el.ombb.visible = false;
        // 	return expansion;
        // });
        // result.addChildren(expansions);

        var invisible = _.compact(_.flatten([e.art, e.dds, e.diff, e.cp, e.bo, e.bi]));
        Pipeline.set_visibility(invisible, false);

        // /* Reflect Object */
        result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: SPACER";
    },
    base: function(display, e) {

    }
}


/* Function takes in bounds box, and creates the bounding holes */
Pipeline.create_corner_pegs = function(o) {
    o.radius = Ruler.mm2pts(o.radius);
    o.padding = Ruler.mm2pts(o.padding);

    corners = [o.bounds.topRight, o.bounds.topLeft, o.bounds.bottomLeft, o.bounds.bottomRight]
    corners = _.map(corners, function(corner) {
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


Pipeline.extend_to_edge = function(ombb, backgroundBox) {
    // compute the two nearest points of the rectangle to wall
    var OMBB = ombb.clone();
    var points = _.map(OMBB.segments, function(seg) {
        return seg.point; });

    // creates distance table 
    var distance_table = _.map(points, function(pt, i) {
        var wall_point = backgroundBox.getNearestPoint(pt);
        var vector = wall_point.subtract(pt);
        var distance = vector.length;
        return {
            point: pt,
            distance: distance,
            vector: vector, // vector of point to wall
            idx: i
        };
    });

    // // sorts distance table from min distance to max distance 
    var distance_table = _.sortBy(distance_table, function(item) {
        return item.distance;
    });

    // // since its sorted by min to max, the first two are the closest points
    var closest = distance_table[0];
    var sec_closest = distance_table[1];

    // line between closest and second closest points
    var line = new paper.Path.Line({
        from: closest.point,
        to: sec_closest.point,
        strokeColor: "red",
        strokeWidth: 2,
        visible: false
    });

    // OMBB.width = 400;

    //line perpendicular to line between closest and second closest points
    var n = line.getNormalAt(line.length / 2);
    var pt = line.getPointAt(line.length / 2);

    n.length = 1;
    var p1 = pt.add(n);
    if (OMBB.contains(p1)) n.length *= -1;

    n.length *= closest.distance + Ruler.mm2pts(WALL_WIDTH) / 2.0 + 100;


    var nline = new paper.Path.Line({
        from: line.getPointAt(line.length / 2),
        to: line.getPointAt(line.length / 2).add(n),
        strokeColor: "green",
        strokeWidth: 2
    });

    var close = [closest.idx, sec_closest.idx];
    _.each(OMBB.segments, function(seg, i) {
        if (close.indexOf(i) > -1) OMBB.segments[i].point = OMBB.segments[i].point.add(n);
    });
    OMBB.fillColor = "black";
    line.remove();
    nline.remove();
    return OMBB;
}



/* Escape holes for 1mm wide wires from each diffuser */
Pipeline.make_wire_holes = function(parent, diffusers, boundingBox, hole_depth, stroke_width) {
    return _.map(diffusers, function(diffuser) {
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
    _.each(objects, function(object) {
        object.visible = is_visible;
    });
    paper.view.update();
}

/*Calculate the centroids of objects and return a list of centroid coordinates**/
function calc_centroids(diffusers) {
    _.each(diffusers, function(diffuser) {
        diffuser.visible = true;
        if (diffuser.className == "CompoundPath") diffuser = diffuser.children[0];
        calc_centroid = _.reduce(diffuser.segments, function(memo, seg) {
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

function addAnchorPoint(pathReceiver, point) {
    var closestPoint = pathReceiver.getNearestPoint(point);
    var location = pathReceiver.getLocationOf(closestPoint);
    var index = location.curve.segment2.index;
    console.log(index);
    return pathReceiver.insert(index, closestPoint);
}

t.onMouseDown = function(event) {

    var hitResult = project.hitTest(event.point, hitOptions);


    if (!hitResult) {
        console.log("No hits");
        return;
    } else {

        if (hitResult.type == "stroke") {
            console.log("Adding anchor");
            var anchor = addAnchorPoint(hitResult.item, event.point);
            var anchorBG = addAnchorPoint(bgPath, event.point);

            t.selected.push(anchor);
            t.selected.push(anchorBG);

        } else if (hitResult.type == 'segment') {
            console.log("hit segment")
            anchor = hitResult.segment;
            var anchorBG = addAnchorPoint(bgPath, event.point);
            t.selected.push(anchor);
            t.selected.push(anchorBG);
        }
    }
};

t.onMouseDrag = function(event) {
    _.each(t.selected, function(anchor) {
        anchor.selected = true;
        anchor.point = anchor.point.add(event.delta);
    });
};

t.onMouseUp = function(event) {
    _.each(t.selected, function(anchor) {
        anchor.selected = false;
    });
    t.selected = [];
}

function setMoldGradient(domed, diff, leds) {
    if (leds.length == 0) { diff.fillColor = "black";
        return; }
    diff.fillColor = "red";

    // ADD BUNDT LENSES
    bundts = _.map(leds, function(led) {
        bundt = new paper.Path.Circle({
            position: led.position,
            radius: Ruler.mm2pts(3.5),
            // visible: false
        });
        bundt.fillColor = {
            gradient: {
                stops: dome(),
                radial: true
            },
            origin: bundt.position,
            destination: bundt.bounds.rightCenter
        }
        if (domed) {
            led.remove();
            return bundt;
        } else {
            led.fillColor = "black";
            led.strokeWidth = 0;
            bundt.remove();
            return led;
        }
    });

    // console.log(dome());
    ramp = rampify(diff, bundts);
    ramp.addChildren(bundts);
    _.each(bundts, function(b) { b.bringToFront(); });
    return ramp;
}

function interpolation_lines(diffuser, leds) {
    var pts = _.range(0, diffuser.length, 20)
    return _.map(pts, function(i) {
        var pt = diffuser.getPointAt(i);
        var candidates = _.map(leds, function(led) {
            return led.getNearestPoint(pt);
        });
        // console.log(candidates[0], pt);
        closest = _.min(candidates, function(c) {
            return c.getDistance(pt); });
        // console.log(closest);
        return new paper.Path.Line({
            from: closest,
            to: pt,
            strokeColor: "blue",
            strokeWidth: 2,
            visible: false
        });
    });

}

function rampify(diffuser, leds) {
    if (!diffuser.length) return;
    console.log("DIFF", diffuser.length);

    var lines = interpolation_lines(diffuser, leds);
    levels = _.range(1, 0, -0.01);
    levels = _.map(levels, function(level) {
        // console.log("LEVEL", level);
        levelColor = what_gray_value_away_from_led(level);
        // console.log(level.toFixed(2), levelColor.toFixed(2))
        return make_level(lines, level, new paper.Color(levelColor));
    });
    var ramp = new paper.Group(levels);
    ramp.sendToBack();
    return ramp;
}

function what_gray_value_away_from_led(t) {
    // return t; // linear
    c = 1;
    d = 1;
    b = 0;
    return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
}

function make_level(lines, level, color) {
    return new paper.Path({
        segments: _.map(lines, function(l) {
            return l.getPointAt(l.length * level) }),
        fillColor: color,
        strokeWidth: 2,
        closed: true
    });
}

function sliceIt(diff, leds, theta) {
    thetas = _.range(-180, 0, 20);

    ref_pt = leds[0].bounds.center;
    var n = new paper.Point();
    n.length = 1000;
    n.rotation = theta;

    var t = new paper.Point();
    t.length = -10000;
    t.rotation = theta;

    result = new paper.Group();

    var l = new paper.Path.Line({
        segments: [ref_pt.add(n), ref_pt, ref_pt.add(t)],
        strokeColor: "yellow",
        strokeWidth: 2,
        strokeScaling: false,
        parent: result
    });
    ends = l.getIntersections(diff);

    start = _.min(ends, function(e) {
        return e.offset });
    end = _.max(ends, function(e) {
        return e.offset });
    l.firstSegment.point = start.point;
    l.lastSegment.point = end.point;


    lends = CanvasUtil.getIntersections(l, leds);
    lends = _.groupBy(lends, function(ixt) {
        return ixt.path.id;
    });
    lends = _.map(lends, function(values, key) {
            values = _.sortBy(values, function(v) {
                return v.offset; })
            vector = values[1].point.subtract(values[0].point);

            midpoint = vector.clone();
            midpoint.length = vector.length / 2.0;

            return new paper.Path.Rectangle({
                size: new paper.Size(vector.length, 6),
                position: values[0].point.add(midpoint),
                fillColor: "green",
                rotation: vector.angle
            });
        })
        // lens_profile = getProfile(l, lend);
    return;
}

function dome() {
    // NOTE: rectangles are 7mm wide and 4mm high
    var lineX = Ruler.mm2pts(15);
    var rectWidth = Ruler.mm2pts(7);
    var rectHeight = Ruler.mm2pts(4);
    var led0Rect = new Path.Rectangle(0, 0, rectWidth, rectHeight);
    led0Rect.set({
        position: view.center.add(new Point(-lineX, -rectHeight / 2)),
        strokeColor: 'black',
        strokeWidth: 1,
        fillColor: null
    });
    // Define a rectangle that circumscribes the ellipse
    var ellipseRectWidth = Ruler.mm2pts(7);
    var ellipseRectHeight = Ruler.mm2pts(6);
    var ellipseRect = new Rectangle(new Point(0, 0),
        new Size(ellipseRectWidth, ellipseRectHeight));
    var led0Ellipse = new Path.Ellipse(ellipseRect);
    led0Ellipse.set({
        position: view.center.add(new Point(-lineX, -rectHeight)),
        strokeColor: 'black',
        strokeWidth: 1,
        fillColor: null
    });

    // Join the ellipse and rectangle, get the rightSegments
    // of the resulting shape
    var dome = led0Ellipse.unite(led0Rect);
    dome.fillColor = 'pink';
    dome.visible = false;
    var rightSegs = _.filter(dome.segments, function(seg) {
        return seg.point.subtract(dome.bounds.center).x >= 0;
    });
    var spline = new paper.Path({
        segments: rightSegs,
        strokeColor: 'green',
        strokeWidth: 1,
        fillColor: null
    });
    spline.visible = false;
    led0Ellipse.visible = false;
    led0Rect.visible = false;
    return pathToModel(spline);
}

function pathToModel(path) {
    // path.selected = true;
    data = _.range(0, path.length, 0.5);
    padding = 1.00;
    var size = new paper.Size(path.bounds.width / padding, path.bounds.width / padding);

    data = _.map(data, function(offset) {
        pt = path.getPointAt(offset);
        return pt;
    });

    // normalizing
    min = new paper.Point(_.min(data, function(pt) {
        return pt.x }).x, _.min(data, function(pt) {
        return pt.y }).y);
    max = new paper.Point(_.max(data, function(pt) {
        return pt.x }).x, _.max(data, function(pt) {
        return pt.y }).y);
    max = max.subtract(min);

    data = _.map(data, function(pt) {
        return pt.subtract(min).divide(max);
    });

    // data = _.filter(data, function(d){
    //   // console.log(d.y)
    //   d.x *= 2;
    //   d.x -= 1;
    //   return d.y > 0.10 && d.x > 0;
    // });


    // min = new paper.Point(_.min(data, function(pt){ return pt.x}).x, _.min(data, function(pt){ return pt.y}).y);
    // max = new paper.Point(_.max(data, function(pt){ return pt.x}).x, _.max(data, function(pt){ return pt.y}).y);
    // console.log(data.length, min.toString(), max.toString())


    // .each(data, function(da))
    // data = _.sortBy(data, function(d){ return d.x });

    // data = _.reject(data, function(d){ return d.x > 1 });


    gradient_stops = _.map(data, function(pt) {
        return [new paper.Color((1 - pt.y) * 0.7 + 0.05), pt.x];
    });
    // gradient_stops.push([new paper.Color(1.0), padding]); // bounding wall of white
    // gradient_stops.push([new paper.Color(1.0), 1.0]); // bounding wall of white

    // var img = new paper.Path.Rectangle({
    //   position: paper.view.center.clone().add(new paper.Point(0, 70)), 
    //   size: size, 
    //   strokeColor: "black", 
    //   strokeWidth: 0.02
    //   // strokeScaling: false
    // });

    // img.fillColor = {
    //     gradient: {
    //         stops: gradient_stops,
    //         radial: true
    //     },
    //     destination: img.bounds.leftCenter,
    //     origin: img.bounds.center
    // };

    // console.log("SIZE", Ruler.pts2mm(size.width));
    // p = new paper.Path(data);
    // p.set({
    //   strokeColor: "red", 
    //   strokeWidth: 2, 
    //   position: img.bounds.center
    // });

    // p.bringToFront();
    // console.log("L", p.length);
    // p.scaling =  new paper.Size(path.bounds.width, path.bounds.height);//new paper.Size(50, 10);
    return gradient_stops;
}



function PipeManager(container){
  this.container = container;
  this.state = true;
  this.init();
  this.view = "GLOBAL";
}

PipeManager.prototype = {
   init: function(){
    var scope = this;
    $('#view-icon').click(function(){
      if(scope.state) scope.hide();
      else scope.show();
    });
    $('#view-list ul li').click(function(){
      $('#view-icon').html($(this).children('button').html());
      $('#view-list ul li').removeClass('active');
      $(this).addClass('active');
      $('#view-icon').attr('class', $(this).children('button').attr('class')).removeClass('view').removeClass("btn-sm").addClass('pull-right');
      scope.view = $(this).children('span').html();
      scope.update();
    });
    $('button[name="circuit"]').click();

    // populate SELECT
    var els = _.map(files.filenames, function(el, i, arr){
      var dom =  $('<option></options>').html(el.title.toUpperCase())
      .attr('value', files.path + el.filename);
      if(el.filename == DEFAULT_PIPE_FILE) dom.attr('selected', true);
      return dom;
    });
    $('#file-select').html(els);
  },
  getCurrentView: function(){
    return this.view.toLowerCase();
  },
  update: function(){
    var view = this.getCurrentView();  
    paper.project.clear();
    paper.view.update();

    console.log('RUNNING SCRIPT', view)  
    display = new Artwork($('#file-select').val(), function(artwork){
      var e = Pipeline.getElements();
      p.script[view](artwork, e);
    });

    paper.view.update();
  },
  show: function(now){
    if(this.state) return;
    this.state = true;
    if(now){$("#view-list").show(); return;}
    $("#view-list").toggle("slide", { direction: "up" }, 300);
  },
  hide: function(now){
    if(!this.state) return;
    this.state = false;
    if(now){$("#view-list").hide(); return;}
    $("#view-list").toggle("slide", { direction: "up" }, 300);
  }
}