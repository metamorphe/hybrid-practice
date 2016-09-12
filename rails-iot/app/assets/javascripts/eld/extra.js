 // var dome_lines = _.map(lines, function(l){

            // var length = l.roundedLength;
            // var cache = cache_gradients[length][0];
            // console.log(cache.gradients.domeWidth);
            // // var domelength = cache.gradients.domeWidth;
            // // l.line.lastSegment.point = l.line.getPointAt(domelength);
            // // var gradient = cache.gradients.dome;
            // // return { ramp: gradient, line: l.line};
            // }); 
            
            
            // domes = rampify(dome_lines);
              cones: function(display, e){
        // var ws = new WebStorage();
        var g = new Generator();
        var box = new paper.Path.Rectangle(paper.view.bounds);
        box.set({
              position: paper.view.center,
              fillColor: '#111'
        }); 
        
        this.adjustLEDs(display, e);

        var result = new paper.Group({
          name: "RESULT: LENS",
          model_height: REFLECTOR_HEIGHT
        });

       
        var lenses = new paper.Group({
            parent: result
        });
        _.each(e.diff, function(diff) {
            dleds = _.filter(e.leds, function(l) { return diff.contains(l.bounds.center); });
            if (dleds.length == 0) { diff.fillColor = "black"; return; }

            _.each(dleds, function(led){
                var slices = getSlices(ws, box, led, diff);
                var slices = _.map(slices, function(slice){  
                    // OBTAIN OPTIMIZED DOME SLICE FOR GIVEN DISTANCE
                    var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
                    CanvasUtil.call(removeable, "remove");  
                    g.length = slice.length;
                    g.random = false;
                    var scene = g.generate();
                    paper.view.update();
                    coneStops = Splitter.coneGradient(params);
                    console.log(params);
                    // GENERATE GRADIENT
                    return {  angleIn: slice.angleIn, 
                            angleOut: slice.angleOut, 
                            radius: params.prism.width,
                            height: params.prism.height,
                            cone_gradient: {
                              stops: coneStops, 
                              radial: true
                            }
                         };
                });
                 var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
                CanvasUtil.call(removeable, "remove");  
                max_height = _.chain(slices).pluck("height").max().value();

                c = LensGenerator.makeCDome(slices, "cone_gradient", led.position);  
                c = new paper.Group({
                  name: "COLLIMATOR: Custom Lens",
                  children: c, 
                  parent: lenses
                });    
                var cone_assembly_height = max_height + WING_HEIGHT;
                result.model_height = Ruler.pts2mm(cone_assembly_height);
                Splitter.makeWings(c, lenses, new paper.Color(WING_HEIGHT / cone_assembly_height));

                c.bringToFront();            
            });
        }); 

        
        box.remove();
        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp, e.base, e.mc, e.wires, e.leds]));
        Pipeline.set_visibility(invisible, false);
        raytrace: function(display, e){
      this.adjustLEDs(display, e);
        display.svg.position = display.svg.bounds.bottomLeft;
         _.each(e.diff, function(diffuser) {
            diffuser.set({
                visible: true,
                fillColor: "white",
                strokeWidth: 1
            });
        });

        var result = new paper.Group(e.diff);
        backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: 'white',
            parent: result
        });
       
        _.each(e.leds, function(led) {
            led.set({
                visible: true,
                fillColor: "#00A8E1",
                strokeWidth: 0, 
                parent: result
            });
        });

       morphs = interpolation_lines(e.diff[0], e.leds);
       morphs = _.compact(morphs);        

      

       // BEGIN TRACE
       tracerBox = new paper.Path.Rectangle({
            rectangle: result.bounds,
            fillColor: 'black'
        }); 
       tracerBox.set({
            pivot: tracerBox.bounds.leftCenter,
            position: result.bounds.rightCenter
       });
       var width = result.bounds.width;
       ip = new ImagePlane({
        position: result.bounds.topRight.clone(), 
        width: width, 
        range: {x: {identity: "x", min: -width/2, max: width/2}, y: {identity: "y", min: -width/2, max:  width/2}}
       });
       var lg = new LensGenerator();
       // var led = LensGenerator.generateScene(tracerBox, LensGenerator.DEFAULT_PARAMS);
       // min is 30
       // morphs = [morphs[200]]
       morphs = morphs.slice(0, 10)
       _.each(morphs, function(morph, i, arr){
          console.log("I", i, arr.length)
          morph.set({
            visible: true, 
            strokeColor: "yellow"
           });
           morph.bringToFront();

           var scene = lg.generateW(tracerBox, morph.length, LensGenerator.DEFAULT_PARAMS);
           scene.position = tracerBox.bounds.bottomRight.add(new paper.Point(-20, -20));
           var led = CanvasUtil.queryPrefix("LS")[0];
           var mediums = CanvasUtil.getMediums();
           var ls = new PointLight({
                  position: led.position, 
                  mediums: mediums, 
                  parent: tracerBox
            });

           ls.emmision(-60, 0, 1);
          
           pt = result.bounds.bottomLeft.subtract(morph.firstSegment.point)
                                       .multiply(new paper.Point(-1, 1))
                                       .subtract(new paper.Point(result.bounds.width/2.0, result.bounds.height/2.0))
           boundary = result.bounds.bottomLeft.subtract(morph.lastSegment.point)
                                       .multiply(new paper.Point(-1, 1))
                                       .subtract(new paper.Point(result.bounds.width/2.0, result.bounds.height/2.0))                          
                                       
           rp = ip.graph.plotPoint(pt, {fillColor: "red"});
           rp = ip.graph.plotPoint(boundary, {fillColor: "yellow"});

           lr = ip.visualize();
           pt2 = pt.multiply(new paper.Point(1, -1))
           lr.position =  lr.position.add(pt2);
           lr.pivot = ip.graph.graph.bounds.center.add(pt2);
           lr.rotation = morph.firstSegment.point.subtract(morph.lastSegment.point).angle;
            rp.bringToFront();
           
            if(i == morphs.length - 1) return;
           _.each(CanvasUtil.queryPrefix("RAY"), function(r){ r.remove();});
            scene.remove();
            ls.source.remove();
       });
       // END RAYTRACE

       backgroundBox.sendToBack();
       var invisible = _.compact(_.flatten([e.art, e.dds, e.cp, e.bo, e.bi]));
       Pipeline.set_visibility(invisible, false);
    },

     // _.each(e.diff, function(diffuser) {
        //     diffuser.set({
        //         visible: true,
        //         fillColor: "black",
        //         strokeWidth: 0, 
        //         parent: result
        //     });

        //     var expanded  = diffuser.expand({
        //         strokeAlignment: "exterior", 
        //         strokeWidth: 0.1,
        //         strokeOffset: Ruler.mm2pts(MOLD_WALL), 
        //         strokeColor: "black", 
        //         fillColor: "white", 
        //         joinType: "miter", 
        //         parent: result
        //     });
        //     expanded.sendToBack();
        // });

        // var all = _.flatten([e.diff, e.leds]);
        // var result = new paper.Group(all);

        // boundingBox = new paper.Path.Rectangle({
        //     rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
        //     fillColor: "white",
        //     parent: result
        // });

 
function setMoldGradient(domed, diff, leds) {
    if (leds.length == 0) { diff.fillColor = "black"; return; }
  
    // var lg = new LensGenerator();
    // var lines = interpolation_lines(diff, leds, visible=false);
    // var ramp_lines = _.map(lines, function(l){
    //   return {result: lg.getRampFromOptimal(l.length), line: l}
    // });
    // geom = rampify(lg, ramp_lines);

    // if(domed){
    //   var domes = makeDomes(lg, leds, diff, geom);
    // } else{
    //   _.each(leds, function(led){
    //     led.fillColor = "black";
    //     led.strokeWidth = 0;
    //     var led_c = led.clone();
    //     led_c.parent = geom;
    //     led_c.bringToFront();
    //   });
    // }      
    // return geom;
}
/**
   * Generates labels for a list of Paper.js objects named
   * COMPONENTS, and displays them on the canvas. Objects created
   * have a .name property of PREFIX + ":circle" and PREFIX + ":text",
   * and the text generated for each label is obtained from the
   * .ID_NAME property of each object in COMPONENTS.
   *
   * Note that the ID_NAME must match the property name for each
   * object exactly, otherwise behavior is undefined.
   */
  ViewManager.generateLabels = function(components, idName, prefix,
        useOffset=true, greyed=false) {
    //FIXME: use hash parameter syntax
    var circle, text, x, y, point;
        var radius = 10;
        var offset = useOffset ? 15 : 0;
        $.each(components, function(idx, obj) {
            x = obj.position.x;
            y = obj.position.y;
            circle = new Path.Circle(new Point(x + offset, y + offset)
                                    , radius);
            circle.name = prefix + ':circle_' + obj[idName];
      circle.lid = obj.lid;
            circle.set({
                strokeWidth: 1,
                strokeColor: '#292824',
                fillColor: greyed ? '#b7b3aa' : '#ffffff',
                opacity: 1.0,
            });
            text = new PointText(new Point(x + offset,
                    y + offset));
            text.name = prefix + ':text_' + obj[idName];
      text.lid = obj.lid;
            text.set({
                fillColor: '#292824',
                content: '' + obj[idName]
            });
            text.position.x -= text.bounds.width / 2;
            text.position.y += text.bounds.height / 4;
        });
  }

  ViewManager.updateLabel = function(prefix, lid, contentHash) {
    var selectionHash = {
      prefix: prefix,
      lid: lid
    };
    console.log(selectionHash);
    var els = CanvasUtil.query(paper.project, selectionHash);
    console.log(els);
    $.each(els, function(idx, obj) {
      // FIXME: kludge, we only pull out the content
      // field for setting the point text, and the
      // entire rest of the hash is used to set
      // the circle
      if (obj.className == 'PointText') {
        obj.status = contentHash['content'];
        obj.content = contentHash['content'];
      }
      if (obj.className == 'Path') {
        obj.set(contentHash);
      }
    });
    paper.view.update();
  }
  
// function what_gray_value_away_from_led(t) {
//     // return t; // linear
//     c = 1;
//     d = 1;
//     b = 0;
//     return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
// }

// var domes = _.groupBy(ramp_lines, function(rl){
    //   closest = _.min(leds, function(led) {
    //       return led.position.getDistance(rl.line.firstSegment.point); 
    //   });
    //   return closest.id;
    // });

   

    // domes = _.map(domes, function(rl, id){
    //   var params = {}
    //   params.width = 0; 
    //   params.height = 0;
    //   params.concave = 0;
    //   var params = _.reduce(rl, function(p, r){
    //     var other = r.result.params.dome; 
    //     p.width += other.width;
    //     p.height += other.height;
    //     p.concave += other.concave;
    //     return p;
    //   }, params);
       
    //   params.width /= rl.length;
    //   params.height /= rl.length;
    //   params.concave /= rl.length;
    //   return {params: params, id: parseInt(id)}
    // });

    // var lenshg = reflector.subtract(lens)
    // var lhg = lenshg.segments;

    // lens_holder = new paper.Path({
    //     segments: [lhg[3], lhg[4], lhg[5], lhg[0]],
    //     name: "REF:_0.90", 
    //     strokeWidth: WALL_GAP, 
    //     strokeColor: "red",
    //     closed: false, 
    //     fillColor: null
    // })
    // lenshg.remove();
    // reflector.remove();
    // base.remove();


function CrossSection(center) {
    this.theta = 0;
    this.line_ref = CrossSection.generateLine(center, this.theta);
    this.lends = [];
}
CrossSection.prototype = {
    updateAngle: function(angle, diff, leds){
        this.line_ref.rotation = angle;
        if(this.line) this.line.remove();
        this.line = this.line_ref.clone().set({visible: true});
        ends = this.line.getIntersections(diff);

        start = _.min(ends, function(e) {
            return e.offset });
        end = _.max(ends, function(e) {
            return e.offset });
        this.line.firstSegment.point = start.point;
        this.line.lastSegment.point = end.point;

        _.each(this.lends, function(r){ r.remove(); });
        this.lends = CanvasUtil.getIntersections(this.line, leds);
        this.lends = _.groupBy(this.lends, function(ixt) {
            return ixt.path.id;
        });
        this.lends = _.map(this.lends, function(values, key) {
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
        });
    }
}
CrossSection.generateLine = function(center, theta){
    ref_pt = center;
    var n = new paper.Point();
    n.length = 1000;
    n.rotation = theta;

    var t = new paper.Point();
    t.length = -10000;
    t.rotation = theta;

    result = new paper.Group();

    return new paper.Path.Line({
        segments: [center.add(n), center, center.add(t)],
        pivot: center,
        strokeColor: "yellow",
        strokeWidth: 2,
        strokeScaling: false, 
        visible: false
    });
}



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