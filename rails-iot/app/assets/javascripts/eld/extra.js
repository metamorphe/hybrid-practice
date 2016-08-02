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
    mask: function(display, e) {
        Pipeline.set_visibility(e.art, true);
        var invisible = _.compact(_.flatten([e.leds, e.cp, e.diff, e.dds, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);

        result = new paper.Group(e.art);
        result.name = "RESULT: MASK";
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

    // Compute the Convex Hull 
        var breakio = _.compact(_.flatten([e.bi, e.bo]));

        // expansions = _.map(breakio, function(el){
        //  el.calculateOMBB();
        //  el.ombb.visible = true;


        //  el.ombb.fillColor = "yellow";
        //  // el.ombb.selected = true;
        //  expansion =  Pipeline.extend_to_edge(el.ombb, backgroundBox);
        //  expansion.set({
        //      // parent: result,
        //      fillColor: 'black',
        //      strokeColor: 'black',
        //      strokeWidth: 2
        //  });
        //  expansion.rotate(-90, el.ombb.bounds.center);
        //  el.ombb.visible = false;
        //  return expansion;
        // });
        // result.addChildren(expansions);




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