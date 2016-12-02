const WING_HEIGHT = Ruler.mm2pts(1.5); 
const WING_OFFSET = Ruler.mm2pts(2);
     
// #4-40 X 0.75in
const NUT_HEIGHT = 2.46;//mm
const HEAD_HEIGHT = 2.76;//mm
const BOLT_HEIGHT = 21.17; //mm
const THREAD_HEIGHT = BOLT_HEIGHT - NUT_HEIGHT - HEAD_HEIGHT;//mm

const HEAD_RADIUS = 5.58 * 1.3 / 2.0; //mm
const PEG_RADIUS = 3.0 * 1.3 / 2.0; //mm
const HEX_RADIUS = 7.6 / 2.0; //mm

const END_GAP = 1.4125;//mm

// NAMESPACE FOR ELD PIPEPLINE
const DIFUSSER_HEIGHT = END_GAP + HEAD_HEIGHT;//mm
const REFLECTOR_HEIGHT = 10;//mm
const SPACER_HEIGHT = 3.1;
const BASE_HEIGHT = END_GAP + NUT_HEIGHT;

const OVERALL_HEIGHT = DIFUSSER_HEIGHT + REFLECTOR_HEIGHT + SPACER_HEIGHT + BASE_HEIGHT;

// BASE

// SPACER + REFLECTOR
const WALL_WIDTH = 3; //mm
const PEG_PADDING = WALL_WIDTH * 1.2;// + (PEG_RADIUS / 2.0); //mm


// REFLECTOR
const DIFUSSER_BASE_HEIGHT = 0.641;
const BASE_EXPANSION = -WALL_WIDTH; //mm
const RIM_HEIGHT = 0.128;
const RIM_WIDTH = 1.5; //mm

// SPACER 
const WALL_EXPANISION = BASE_EXPANSION; //mm
const PCB_HEIGHT = 1.7; // relative 1.7 (base) /3.1 (wall) mm
const CHANGE_IN_X_DIR = 8; //pts
const CHANGE_IN_Y_DIR = 8; //pts
const LED_TOLERANCE = 3; //mm


// MOLDS
const MOLD_WALL = 5; // mm

// PCB
const POINT_OFFSET = 10; //pts
const POINT_INNER_OFFSET = 1; //pts
const THETA_STEP = 1; //pts
const THETA_OFFSET = 0.5; //pts
const OPT_MAX_ITERS = 20;
const EPSILON = 10;


const LED_WIDTH = 5;
const LED_HEIGHT = 1.4;


// EVAL
const MODEL_TO_GENERATE = "Reflector"

function Pipeline() {
  
}

Pipeline.getElements = function(display) {
    return {
        art: CanvasUtil.queryPrefix('ART'),
        diff: CanvasUtil.queryPrefix('DIF'),
        leds: CanvasUtil.queryPrefix('NLED'),
        bo: CanvasUtil.queryPrefix('BO'),
        bi: CanvasUtil.queryPrefix('BI'),
        cp: CanvasUtil.queryPrefix('CP'),
        dds: CanvasUtil.queryPrefix('DDS'),
        mc: CanvasUtil.queryPrefix("MC"),
        base: CanvasUtil.queryPrefix("BASE"),
        wires: CanvasUtil.queryPrefix("WIRE"), 
        rays: CanvasUtil.queryPrefix("RAY") 
    }
}
Pipeline.script = {
    mold: function(display, e) {
        this.adjustLEDs(display, e);

        var result = new paper.Group({name: "RESULT: MOLD"});

        _.each(e.diff, function(diffuser) {
            diffuser.set({
                visible: true,
                fillColor: "black",
                strokeWidth: 0, 
                parent: result
            });

            var expanded  = diffuser.expand({
                strokeAlignment: "exterior", 
                strokeWidth: 0.1,
                strokeOffset: Ruler.mm2pts(MOLD_WALL), 
                strokeColor: "black", 
                fillColor: "white", 
                joinType: "miter", 
                parent: result
            });
            expanded.sendToBack();
        });

        
        // //Creating a bounding box
        // backgroundBox = new paper.Path.Rectangle({
        //     rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
        //     fillColor: 'white',
        //     parent: result
        // });
        // backgroundBox.sendToBack();

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
        _.each(e.diff, function(diffuser) {
            diffuser.bringToFront();
        });
        //Make non-molding objects invisible
        var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo, e.base]));
        Pipeline.set_visibility(invisible, false);

        // result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: DIFFUSER";
        result.model_height = DIFUSSER_HEIGHT;
    },
    cone_lens: function(display, e) {
        var ws = new WebStorage();
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
                    params = Splitter.getOptimal(ws, slice.length);
                    var scene = Splitter.makeScene(box, params);
                    paper.view.update();
                    moldStops = Splitter.moldGradient(params);
                   
                    // GENERATE GRADIENT
                    return {  angleIn: slice.angleIn, 
                            angleOut: slice.angleOut, 
                            radius: params.prism.width,
                            mold_gradient: {
                              stops: moldStops, 
                              radial: true
                            }
                         };
                });
                 var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
                CanvasUtil.call(removeable, "remove");  

                m = LensGenerator.makeCDome(slices, "mold_gradient", led.position);

                m = new paper.Group({
                  name: "COLLIMATOR: Custom Lens",
                  children: m, 
                  parent: lenses
                });  
                 var c = new paper.Path.Circle({
                    radius: _.chain(slices).pluck("radius").max().value(), 
                    position: led.position, 
                    strokeWidth: Ruler.mm2pts(MOLD_WALL), 
                    strokeColor: "white",
                    strokeScaling: true,
                    // parent: m,
                });

                  wall = c.expand({
                     strokeAlignment: "exterior", 
                     strokeWidth: 0.1,
                     strokeOffset: Ruler.mm2pts(MOLD_WALL), 
                     fillColor: "white", 
                     joinType: "miter", 
                     parent: m
                  });
                  wall.sendToBack();
                  c.remove();
                Splitter.makeWings(m, lenses, "white");
                m.bringToFront();
            });
        }); 

        
        box.remove();
        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp, e.base, e.mc, e.wires, e.diff, e.leds]));
        Pipeline.set_visibility(invisible, false);
    },
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
    },
    side_emit_reflector: function(display, e){
        var g = new Generator();
        g.model = "Splitter";
        g.export = "REFL";
        this.makeFromProfile(display, e, g);
    },
    tir_reflector: function(display, e){
        var g = new Generator();
        g.model = "TIR";
        g.export = "REFL";
        this.makeFromProfile(display, e, g);
    },
    tir_lens: function(display, e){
        var g = new Generator();
        g.model = "TIR";
        g.export = "MOLD";
        this.makeFromProfile(display, e, g, chassis = false);
    },
    reflector: function(display, e) {
        var g = new Generator();
        g.model = "Reflector";
        g.export = "REFL";
        this.makeFromProfile(display, e, g);
    },
    makeFromProfile: function(display, e, g, chassis=true) {
        this.adjustLEDs(display, e);
        if(chassis)
            var all = _.flatten([e.base, e.diff, e.leds]);
        else
            var all = _.flatten([e.diff]);

        // HARD_CODE_DIFFUSER ASSOCIATIONS
        var model = MODEL_TO_GENERATE;
        e.diff[0].diffuser = "Planar";
        e.diff[1].diffuser = "Planar";
        e.diff[2].diffuser = "Hemisphere";
        e.diff[3].diffuser = "Cuboid";

        var result = new paper.Group(all);
        backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: "white",
            parent: result
        });

       // DIFFUSERS OR DECORATIVE DIFFUSERS

        // ramps = _.map(e.dds, function(diff) {
            
        //     if(diff.diffuser != "Cuboid") return new paper.Group();
        //     dleds = _.filter(e.leds, function(l) { return diff.contains(l.bounds.center); });
        //     var ils = interpolation_lines(diff, dleds, visible=true);
        //     // var lines = _.map(ils, function(il){ return {line: il.line, led: il.led, roundedLength: parseInt(il.line.length)}});

        //     // ramp_slices = sliceLines(lines);
        //     // console.log(ramp_slices);

        //     // console.log("# of Slices:", ramp_slices.length, "STEP", DOME_STEP, "EP", DOME_DIFF_EPSILON);
        //     // // console.log("CACHING GRADIENTS FOR", g.diffuser, g.model, g.export);

        //     // var ramp_slices = _.map(ramp_slices, function(l){
        //     //     g.length = l.length;
        //     //     g.random = false;
        //     //     g.diffuser = diff.diffuser;
        //     //     return _.extend(l, {gradient: g.getGradient()});
        //     // });
        //     // console.log("MAKING RAMP");           
        //     // // MAKE RAMPS
        //     // slices = _.map(ramp_slices, function(obj, i){
        //     //     return generateSlicedSegment2(obj, diff, obj.gradient, true);
        //     // }); 
            
        //     // ramp = new paper.Group(slices);
        //     return new paper.Group();
        // });


        // result.addChildren(ramps);

        // if(chassis){
        //     var mc = this.adjustMC(display, e, backgroundBox);
        //     if(mc){ mc.parent = result; mc.bringToFront();}

        //     _.each(e.leds, function(led){
        //         l = led.clone();
        //         l.fillColor = "black";
        //         l.strokeColor = "black";
        //         l.strokeWidth = 2;
        //         result.addChild(l);
        //     });
        //     _.each(e.diff, function(diffuser) {
        //         diffuser.bringToFront();
        //         diffuser.set({
        //           strokeColor: "white", 
        //           fillColor: null, 
        //           strokeWidth: 5
        //         })
        //     });
        //     var pegs = Pipeline.create_corner_pegs({ 
        //      geometry: "circle",
        //      bounds: backgroundBox.strokeBounds, 
        //      radius: PEG_RADIUS, 
        //      padding: PEG_PADDING, 
        //      height: 'black', 
        //      parent: result
        //     });
        // }

       
        // INVISIBILITY

        var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
        CanvasUtil.call(removeable, "remove"); 
        if(chassis) var invisible = _.compact(_.flatten([ e.art, e.bo, e.bi, e.cp, e.base]));
        else var invisible = _.compact(_.flatten([ e.art, e.bo, e.bi, e.cp, e.base, e.mc]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: REFLECTOR";
        result.model_height = REFLECTOR_HEIGHT;
    },
    no_lens: function(display, e) {
        var ws = new WebStorage();

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


        _.each(e.diff, function(diff){
           
            diff.set({
              fillColor: "black", 
              strokeWidth: 0
            });
        });
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
        backgroundBox.sendToBack();

        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.art, e.base, e.dds, e.bo, e.bi, e.cp, e.leds]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: NO LENS";
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
        var invisible = _.compact(_.flatten([e.base, e.cp]));
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
        // // ADD CORNER PEGS
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



Pipeline.set_visibility = function(objects, is_visible) {
    _.each(objects, function(object) {
        object.visible = is_visible;
    });
    paper.view.update();
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
