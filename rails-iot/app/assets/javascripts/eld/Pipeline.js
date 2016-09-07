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

const MORPH_LINE_STEP = 3;

function Pipeline() {
  
}

Pipeline.getElements = function(display) {
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
        wires: display.queryPrefix("WIRE"), 
        rays: display.queryPrefix("RAY") 
    }
}
Pipeline.script = {
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
    reflector: function(display, e) {
        var ws = new WebStorage();
        var box = new paper.Path.Rectangle(paper.view.bounds);
       
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

         ramps = _.map(e.diff, function(diff) {
            dleds = _.filter(e.leds, function(l) { return diff.contains(l.bounds.center); });
            var lines = interpolation_lines(diff, dleds, visible=false);

            var ramp_lines = _.map(lines, function(l){
                var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
                CanvasUtil.call(removeable, "remove");    
                params = Splitter.getOptimal(ws, l.length);
                var scene = Splitter.makeScene(box, params);
                paper.view.update();
                return { ramp: Splitter.rampGradient(params), line: l};
            }); 
            var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
            CanvasUtil.call(removeable, "remove"); 

            // MAKE RAMPS
            return rampify(ramp_lines);
        });


        result.addChildren(ramps);
        _.each(e.leds, function(led){
            l = led.clone();
            l.fillColor = "black";
            l.strokeColor = "black";
            l.strokeWidth = 2;
            result.addChild(l);
        })

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

DOME_DIFF_EPSILON = 10;

function getSlices(ws, box, led,  diff, parent){
  // MAKE A DOME FOR EVERY LED
    var DOME_STEP = 5;
    var angles = _.range(-184, 180 + DOME_STEP, DOME_STEP);

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
    })
    .map(function(slice){
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
    }).value();
    // COMPACT SLICES
    compact_angles = [];
    var n = angles.length;
    var current = angles[0];
    for(var i = 1; i < angles.length; i++){
      var slice = angles[i];
      if(Math.abs(slice.length - current.length) < DOME_DIFF_EPSILON) current.angleOut = slice.angleOut;
      else{
        compact_angles.push(current);
        current = slice;
      }
    }
    // END COMPACT
    return compact_angles;
}

function setMoldGradient(ws, box, diff, leds) {
    if (leds.length == 0) { diff.fillColor = "black"; return; }
  

      var slices = getSlices(ws, box, leds, diff, geom);

    //   _.each(leds, function(led){
    //     led.fillColor = "black";
    //     led.strokeWidth = 0;
    //     var led_c = led.clone();
    //     led_c.parent = geom;
    //     led_c.bringToFront();
    //   });
    // }      
    return geom;
}


function rampify(ramp_lines) {
    levels = _.range(1, 0, -0.01);
    levels = _.map(levels, function(level) {
        return make_level(ramp_lines, level, new paper.Color(level));
    });
    var ramp = new paper.Group(levels);
    ramp.sendToBack();
    return ramp;
}


function make_level(ramp_lines, level, color) {
    return new paper.Path({
        segments: _.map(ramp_lines, function(rl) {
            closestStop = _.min(rl.ramp, function(v){
                return Math.abs(v[0].gray - level);
            });
            var offset = closestStop[1] * rl.line.length;
            return rl.line.getPointAt(offset); 
        }),
        fillColor: color,
        strokeWidth: 2,
        closed: true
    });
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
      scope.view = $(this).children('button').attr('name');
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
    paper.view.zoom = 1;
    paper.view.update();

    console.log('RUNNING SCRIPT', view)  
    display = new Artwork($('#file-select').val(), function(artwork){
      var e = Pipeline.getElements(artwork);
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