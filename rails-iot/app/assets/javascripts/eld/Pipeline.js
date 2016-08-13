// #4-40 X 0.75in
var NUT_HEIGHT = 2.46;//mm
var HEAD_HEIGHT = 2.76;//mm
var BOLT_HEIGHT = 21.17; //mm
var THREAD_HEIGHT = BOLT_HEIGHT - NUT_HEIGHT - HEAD_HEIGHT;//mm

var HEAD_RADIUS = 5.58 * 1.3 / 2.0; //mm
var PEG_RADIUS = 3.0 * 1.3 / 2.0; //mm
var HEX_RADIUS = 7.6 / 2.0; //mm

var END_GAP = 1.4125;//mm

// NAMESPACE FOR ELD PIPEPLINE
var DIFUSSER_HEIGHT = END_GAP + HEAD_HEIGHT;//mm
var REFLECTOR_HEIGHT = 10;//mm
var SPACER_HEIGHT = 3.1;
var BASE_HEIGHT = END_GAP + NUT_HEIGHT;

var OVERALL_HEIGHT = DIFUSSER_HEIGHT + REFLECTOR_HEIGHT + SPACER_HEIGHT + BASE_HEIGHT;

// BASE

// SPACER + REFLECTOR
var WALL_WIDTH = 3; //mm
var PEG_PADDING = WALL_WIDTH * 1.2;// + (PEG_RADIUS / 2.0); //mm


// REFLECTOR
var DIFUSSER_BASE_HEIGHT = 0.641;
var BASE_EXPANSION = -WALL_WIDTH; //mm
var RIM_HEIGHT = 0.128;
var RIM_WIDTH = 1.5; //mm

// SPACER 
var WALL_EXPANISION = BASE_EXPANSION; //mm
var PCB_HEIGHT = 1.7; // relative 1.7 (base) /3.1 (wall) mm
var CHANGE_IN_X_DIR = 8; //pts
var CHANGE_IN_Y_DIR = 8; //pts
var LED_TOLERANCE = 3; //mm


// MOLDS
var MOLD_WALL = 5; // mm

// PCB
var POINT_OFFSET = 10; //pts
var POINT_INNER_OFFSET = 1; //pts
var THETA_STEP = 1; //pts
var THETA_OFFSET = 0.5; //pts
var OPT_MAX_ITERS = 20;
var EPSILON = 10;


var LED_WIDTH = 5;
var LED_HEIGHT = 1.4;

var MORPH_LINE_STEP = 3;



function sample_model(lg, lens_length, n){
     var samples = _.range(0, n, 1);
     samples = _.map(samples, function(s, i){
           
           var params = lg.generateRandom(lens_length);
           var scene = lg.generate(tracerBox, params);
           // var scene = lg.generate(tracerBox, LensGenerator.WTF);

           var led = CanvasUtil.queryPrefix("LS")[0];
           var mediums = CanvasUtil.getMediums();
           var ls = new PointLight({
                  position: led.position, 
                  mediums: mediums, 
                  parent: tracerBox
            });

            ls.emmision(-60, 0, 1);
            uniformity = ImagePlane.calculateUniformity();
            // console.log("SAMPLE", uniformity)
            _.each(CanvasUtil.queryPrefix("RAY"), function(r){ r.remove();});
            scene.remove();
            ls.source.remove();
            return {cost: uniformity, params: JSON.stringify(params)}
       });
     
       var min = _.min(samples, function(s){ return s.cost; });
       var max = _.max(samples, function(s){ return s.cost; });
       console.log("RESULTS:", min, max);
       this.ws.set(lens_length, max.params);
       return max;
}
function Pipeline() {
  
}

Pipeline.getElements = function() {
    return {
        art: display.queryPrefix('ART'),
        diff: display.queryPrefix('DIF'),
        leds: display.queryPrefix('NLED'),
        bo: display.queryPrefix('BO'),
        bi: display.queryPrefix('BI'),
        cp: display.queryPrefix('CP'),
        dds: display.queryPrefix('DDS'),
        mc: display.queryPrefix("MC"),
        base: display.queryPrefix("BASE"),
        wires: display.queryPrefix("WIRE")
    }
}
Pipeline.script = {
    optimizer: function(display, e){
        this.adjustLEDs(display, e);
        ws = new WebStorage();
        display.svg.remove();
        tracerBox = new paper.Path.Rectangle({
            size: new paper.Size(300, 200),
            position: paper.view.center,
            fillColor: '#333'
        }); 
        tracerBox.set({
            pivot: tracerBox.bounds.bottomRight
        });

       var lg = new LensGenerator();
       // var params = lg.generateRandom(30.5);
       // var scene = lg.generate(tracerBox, params);
       // lens_length = 14.281605487012305;
       // params = lg.getOptimal(14.281605487012305);
       // result = lg.getRampFromOptimal(14.281605487012305);
//       console.log(result.ramp.bounds.width + result, result.params.ramp.width + result);
       // for(var i = 0; i <= 1; i += 0.01){
       //   y = lg.sampleRamp(result, i);
       //   console.log(i.toFixed(2), y.toFixed(2));
       // }      
       // console.log(result.params);
      // var scene = lg.generate(tracerBox, result.params);
      
       // console.log(result.params.ramp.width + result.params.dome.width + result.params.wall_gap, result.ramp.bounds.width + result.params.dome.width + result.params.wall_gap, params);

       // SAMPLING

       // var lengths = _.range(10, 300, 5);
       // _.each(lengths, function(lens_length){
       //    console.log("CALCULATING", lens_length);
       //    if(! ws.includes(lens_length))
       //      result = sample_model(lg, lens_length, 300);
       //    else
       //      console.log("ALREADY CALCULATED", lens_length)
       // })
      
      

       // VIEWING
       var params = lg.generateRandom(10);
       // var params = JSON.parse(ws.get(180));
       var result = params;
       var scene = lg.generate(tracerBox, result);
       console.log("SCENE", scene.bounds.width);
       console.log(params);
       // var led = CanvasUtil.queryPrefix("LS")[0];
       // var mediums = CanvasUtil.getMediums();
       // var ls = new PointLight({
       //        position: led.position, 
       //        mediums: mediums, 
       //        parent: tracerBox
       //  });
       //  ls.emmision(-60, 0, 1);
       //  uniformity = ImagePlane.calculateUniformity();
       // console.log("RESULTS:", uniformity);
    },
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

    mold: function(display, e) {
        this.adjustLEDs(display, e);
        _.each(e.diff, function(diffuser) {
            diffuser.set({
                visible: true,
                fillColor: "black",
                strokeWidth: 0
            });
        });

        var result = new paper.Group(e.diff);

        //Creating a bounding box
        backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: 'white',
            parent: result
        });
        backgroundBox.sendToBack();

        //Make non-molding objects invisible
        var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo, e.base, e.mc, e.wires]));
        Pipeline.set_visibility(invisible, false);

        result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: DIFFUSER";
        result.model_height = DIFUSSER_HEIGHT;
    },
    diffuser: function(display, e) {
        this.adjustLEDs(display, e);
        _.each(e.diff, function(diffuser) {
            diffuser.set({
                visible: true,
                fillColor: "black",
                strokeWidth: 0
            });
        });
        var all = _.flatten([e.base, e.diff]);
        var result = new paper.Group(all);

        //Creating a bounding box
        backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: 'white',
            parent: result
        });
        _.each(e.base, function(b){ b.fillColor = "white";});
        backgroundBox.sendToBack();

       var pegs = Pipeline.create_corner_pegs({ 
         geometry: "circle",
         bounds: backgroundBox.strokeBounds.expand(Ruler.mm2pts(HEAD_RADIUS)), 
         radius: HEAD_RADIUS, 
         padding: PEG_PADDING, 
         height: (DIFUSSER_HEIGHT - HEAD_HEIGHT)/ DIFUSSER_HEIGHT, 
         parent: result
        });

        var pegs = Pipeline.create_corner_pegs({ 
         geometry: "circle",
         bounds: backgroundBox.strokeBounds, 
         radius: PEG_RADIUS, 
         padding: PEG_PADDING, 
         height: 'black', 
         parent: result
        });

        //Make non-molding objects invisible
        var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);

        // result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: DIFFUSER";
        result.model_height = DIFUSSER_HEIGHT;
    },
    lens: function(display, e) {
        this.adjustLEDs(display, e);
        var all = _.flatten([e.diff, e.leds]);
        var result = new paper.Group(all);

        boundingBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: "white",
            parent: result
        });

        ramps = _.map(e.diff, function(diffuser) {
            return setMoldGradient(true, diffuser, _.filter(e.leds, function(l) {
                return diffuser.contains(l.bounds.center); }));
        });

        result.addChildren(ramps);
          
        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp, e.base, e.mc, e.wires]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: LENS";
        result.model_height = REFLECTOR_HEIGHT;
        boundingBox.sendToBack();
    },
    reflector: function(display, e) {
        this.adjustLEDs(display, e);
        var all = _.flatten([e.diff, e.leds, e.base]);
        var result = new paper.Group(all);
        backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: "white",
            parent: result
        });

        var mc = this.adjustMC(display, e, backgroundBox);
        if(mc){ mc.parent = result; mc.bringToFront();}

        ramps = _.map(e.diff, function(diffuser) {
            return setMoldGradient(false, diffuser, _.filter(e.leds, function(l) {
                return diffuser.contains(l.bounds.center); }));
        });
        result.addChildren(ramps);

        // var pegs = Pipeline.create_corner_pegs({ 
        //  geometry: "hex",
        //  bounds: backgroundBox.strokeBounds, 
        //  radius: HEX_RADIUS, 
        //  padding: PEG_PADDING, 
        //  height: 'yellow', 
        //  parent: result
        // });
      
        var pegs = Pipeline.create_corner_pegs({ 
         geometry: "circle",
         bounds: backgroundBox.strokeBounds, 
         radius: PEG_RADIUS, 
         padding: PEG_PADDING, 
         height: 'black', 
         parent: result
        });


        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: REFLECTOR";
        result.model_height = REFLECTOR_HEIGHT;
    },
    spacer: function(display, e) {
        var ws = new WebStorage();
        
        this.adjustLEDs(display, e);
       
        _.each(e.leds, function(led) {
            led.set({
                fillColor: "black",
                strokeColor: 'black',
                strokeWidth: Ruler.mm2pts(LED_TOLERANCE)
            });
        });

        var all = _.flatten([e.base, e.leds, e.diff]);
        var result = new paper.Group(all);
        result.applyMatrix = false;

        // // BACKGROUND
        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL) - Ruler.mm2pts(WALL_WIDTH)),
            fillColor: new paper.Color(PCB_HEIGHT/SPACER_HEIGHT),
            strokeColor: 'white',
            strokeWidth: Ruler.mm2pts(WALL_WIDTH),
            // strokeScaling: false,
            parent: result
        });
        backgroundBox.sendToBack();
        var pegs = Pipeline.create_corner_pegs({ 
         geometry: "circle",
         bounds: backgroundBox.strokeBounds, 
         radius: PEG_RADIUS, 
         padding: PEG_PADDING, 
         height: 'black', 
         // strokeScaling: false,
         parent: result
        });

       
        // ADD CORNER PEGS
        // var pegs = Pipeline.create_corner_pegs({ 
        //  geometry: "hex",
        //  bounds: backgroundBox.strokeBounds, 
        //  radius: HEX_RADIUS, 
        //  padding: PEG_PADDING, 
        //  height: 'yellow', 
        //  parent: result
        // });

        var mc = this.adjustMC(display, e, backgroundBox);
        if(mc){ mc.parent = result; mc.bringToFront();}

     
        var invisible = _.compact(_.flatten([e.art, e.dds, e.diff, e.cp, e.bo, e.base, e.bi, e.wires]));
        Pipeline.set_visibility(invisible, false);

        // /* Reflect Object */
        result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: SPACER";
        result.model_height = SPACER_HEIGHT;
    },
    circuit: function(display, e) {
        var ws = new WebStorage();
        var all = _.flatten([e.base, e.leds, e.diff]);
        var result = new paper.Group(all);
        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL) - Ruler.mm2pts(WALL_WIDTH)),
            fillColor: new paper.Color(PCB_HEIGHT/SPACER_HEIGHT),
            strokeColor: 'white',
            strokeWidth: Ruler.mm2pts(WALL_WIDTH), 
        });
        var mc = this.adjustMC(display, e, backgroundBox);
        if(mc){ mc.parent = result; mc.bringToFront();}
        backgroundBox.remove();
        // Function that initializes the routing process.
        leds = _.sortBy(e.leds, function(led) {
            return led.lid; 
        });
        nodes = _.flatten([e.bi, leds, e.bo]);

        nodes = CircuitRouting.generateNodes(nodes, function(nodes) {
            _.each(nodes, function(node, i, arr) {
                node.right = null;
                node.left = null;
                if (i - 1 >= 0) node.left = arr[i - 1];
                if (i + 1 < arr.length) node.right = arr[i + 1];
            });
            config = CircuitRouting.route(nodes);
            ws.set(display.svgPath, JSON.stringify(config));

            CircuitRouting.connect_the_dots(nodes);
            CircuitRouting.cleanup(nodes, e);
            paper.view.update();
        });
        addTool();
        var invisible = _.compact(_.flatten([e.base]));
        Pipeline.set_visibility(invisible, false);
    },
    base: function(display, e) {
       
        var all = _.flatten([e.leds, e.diff, e.mc, e.base]);
        var result = new paper.Group(all);
    
       
        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: 'white',
            parent: result
        });
        backgroundBox.sendToBack();        
        // ADD CORNER PEGS
        var pegs = Pipeline.create_corner_pegs({ 
         geometry: "hex",
         bounds: backgroundBox.bounds, 
         radius: HEX_RADIUS, 
         padding: PEG_PADDING, 
         height: END_GAP / BASE_HEIGHT, 
         parent: result
        });
        var pegs = Pipeline.create_corner_pegs({ 
         geometry: "circle",
         bounds: backgroundBox.bounds, 
         radius: PEG_RADIUS, 
         padding: PEG_PADDING, 
         height: 'black', 
         parent: result
        });
        backgroundBox.sendToBack();


        var invisible = _.compact(_.flatten([e.art, e.mc, e.leds, e.dds, e.diff, e.cp, e.bo, e.bi, e.base]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: BASE";
        result.model_height = BASE_HEIGHT;
    }, 
    adjustMC: function(display, e, backgroundBox, result){
      if(e.mc.length ==  0) return;
      
      var mc = e.mc[0];
      var bi = e.bi[0];
      var pl = new paper.Group([mc, bi]);

      alignment = [mc.bounds.topCenter,  mc.bounds.bottomCenter,  mc.bounds.leftCenter,  mc.bounds.rightCenter]
      alignment = _.max(alignment, function(pt){ return bi.position.getDistance(pt);});
      mc.set({
          fillColor: "black", 
          pivot: alignment
      });
      pl.pivot = alignment;
      

      var position = backgroundBox.getNearestPoint(alignment);
      var direction = position.subtract(alignment);
      if(backgroundBox.strokeWidth > 0){
        direction.length = backgroundBox.strokeWidth/2.0;
        position = position.add(direction);
      }
      pl.position = position;
      return pl;
    },
    adjustLEDs: function(display, e){
      var ws = new WebStorage();
        if(ws.includes(display.svgPath))
              config = JSON.parse(ws.get(display.svgPath));

        _.each(e.leds, function(led) {
            if(_.isUndefined(config)) rotation = 0;
            else rotation = _.findWhere(config, {id: led.lid}).theta;
            led.set({
                rotation: rotation
            });
        });
    }
}


/* Function takes in bounds box, and creates the bounding holes */
Pipeline.create_corner_pegs = function(o) {
    o.radius = Ruler.mm2pts(o.radius);
    o.padding = Ruler.mm2pts(o.padding);
    if(o.geometry != "hex")
        o.bounds = o.bounds.expand(-2 * o.radius - Ruler.mm2pts(HEX_RADIUS) - 2 * o.padding);
    else
        o.bounds = o.bounds.expand(-2 * o.radius - 2 * o.padding);
    // - 2 * o.padding 

    corners = [o.bounds.topRight, o.bounds.topLeft, o.bounds.bottomLeft, o.bounds.bottomRight]
    corners = _.map(corners, function(corner) {
        var dir = o.bounds.center.subtract(corner);
        dir.length = 0;

        if(o.geometry == "hex"){
            return new Path.RegularPolygon({
                parent: o.parent,
                position: corner.add(dir),
                center: [50, 50],
                sides: 6,
                fillColor: o.height,
                radius: o.radius
            });
        }else{
            return new paper.Path.Circle({
                parent: o.parent,
                position: corner.add(dir),
                fillColor: o.height,
                radius: o.radius
            });
        }
    });
    return corners;
}



Pipeline.set_visibility = function(objects, is_visible) {
    _.each(objects, function(object) {
        object.visible = is_visible;
    });
    paper.view.update();
}



function addTool(){
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
}


function interpolation_lines(diffuser, leds, visible=false) {
    var pts = _.range(0, diffuser.length, MORPH_LINE_STEP)
    return _.map(pts, function(i) {
        var pt = diffuser.getPointAt(i);
        var candidates = _.map(leds, function(led) {
            return led.position; // getNearestPoint(pt);
        });
        // console.log(candidates[0], pt);
        closest = _.min(candidates, function(c) {
            return c.getDistance(pt); 
        });
        // console.log(closest);
        l =  new paper.Path.Line({
            from: closest,
            to: pt,
            strokeColor: "blue",
            strokeWidth: 2,
            visible: visible
        });
        cross = l.getIntersections(diffuser);
        if(cross.length >= 2){ l.lastSegment.point = cross[0].point; return l;}
        return l;
    });

}

function makeDomes(lg, leds, diff, parent){
  // MAKE A DOME FOR EVERY LED
  return _.map(leds, function(led){
    var DOME_STEP = 5;
    var angles = _.range(-180, 181, DOME_STEP);

    // angles = angles.slice(0, 1);
    var angles = _.chain(angles).map(function(theta){
      // RANGE OF VALID ANGLES
      lower = theta - DOME_STEP/2.0;
      upper = theta + DOME_STEP/2.0;  
      
      upper ++; // overlap for anti-aliasing
      lower --; // overlap for anti-aliasing

      upper = upper > 180 ? 180 : upper;
      lower = lower < -180 ? -180 : lower;

      return {angleIn: lower, center: theta, angleOut: upper}
    }).map(function(slice){
      // FIND DISTANCE TO DIFFUSER
      var to = led.position.clone();
      to.angle = slice.center;
      to.length = 10000;
      var line = new paper.Path.Line({
        visible: true,
        strokeColor: "green", 
        strokeWidth: 1, 
        from: led.position, 
        to: to, 
        visible: false
      });
      var ixt = line.getIntersections(diff);
      line.lastSegment.point = ixt[0].point;
      return {angleIn: slice.angleIn, length: line.length, angleOut: slice.angleOut}
    }).map(function(slice){
      // OBTAIN OPTIMIZED DOME SLICE FOR GIVEN DISTANCE
      params = lg.getRampFromOptimal(slice.length).params;
      // HEIGHEST POINT IS LENS HEIGHT
      dome = LensGenerator.generateDome(params.dome.width, params.dome.height, params.dome.concave, true);
      dome.scaling.y = 1 / dome.bounds.height;
      dome.scaling.x = 1 / dome.bounds.width;
      dome.pivot = dome.bounds.bottomLeft;
      dome.position = new paper.Point(0, 0);
      var gradient = _.range(0, dome.length, dome.length / 10);
      var MAX_DOME_HEIGHT = (params.dome.height + params.dome.concave) / params.lens.height;

      // GENERATE GRADIENT
      gradient = _.chain(gradient).map(function(offset){
        var pt = dome.getPointAt(offset);
        var x = pt.x;
        if(x == 1) x = 0.99;
        return [new paper.Color(-pt.y * MAX_DOME_HEIGHT), x];
      }).unique(function(g){return g[1]; }).value();
      gradient.push([new paper.Color(0, 0 , 0, 0), 1.0]); // ensure last element is black

      return {angleIn: slice.angleIn, angleOut: slice.angleOut, radius: params.dome.width, gradient: {
          stops: gradient, 
          radial: true
        }
      };
    }).value();

    c = LensGenerator.makeCDome(angles, led.position);
    return new paper.Group({
      name: "DOME: Custom Dome",
      children: c, 
      parent: parent
    });
    led.remove();
  }); 
}

function setMoldGradient(domed, diff, leds) {
    if (leds.length == 0) { diff.fillColor = "black"; return; }
  
    var lg = new LensGenerator();
    var lines = interpolation_lines(diff, leds, visible=false);
    var ramp_lines = _.map(lines, function(l){
      return {result: lg.getRampFromOptimal(l.length), line: l}
    });
    geom = rampify(lg, ramp_lines);

    if(domed){
      var domes = makeDomes(lg, leds, diff, geom);
    } else{
      _.each(leds, function(led){
        led.fillColor = "black";
        led.strokeWidth = 0;
        var led_c = led.clone();
        led_c.parent = geom;
        led_c.bringToFront();
      });
    }      
    return geom;
}


function rampify(lg, ramp_lines) {
    levels = _.range(1, 0, -0.01);
    levels = _.map(levels, function(level) {
        return make_level(lg, ramp_lines, level, new paper.Color(level));
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

function make_level(lg, rlines, level, color) {
   
     // x = lg.sampleRamp(result, i);
    return new paper.Path({
        segments: _.map(rlines, function(rl) {
            var offset = lg.sampleRamp(rl.result, level);
            return rl.line.getPointAt(offset * rl.line.length); 
        }),
        fillColor: color,
        strokeWidth: 2,
        closed: true
    });
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
      Pipeline.script[view](artwork, e);
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