const GRAY_ON = true; 
const SWATCH_ON = false;
const MC_MOVE = false;
// 
const WING_HEIGHT = Ruler.mm2pts(1.5); 
const WING_OFFSET = Ruler.mm2pts(2);
     
// #4-40 X 0.75in
const NUT_HEIGHT = 2.46;//mm
const HEAD_HEIGHT = 2.76;//mm
const BOLT_HEIGHT = 21.17; //mm
const THREAD_HEIGHT = BOLT_HEIGHT - NUT_HEIGHT - HEAD_HEIGHT;//mm

const HEAD_RADIUS = 5.58 * 1.1 / 2.0; //mm
const PEG_RADIUS = 3.0 * 1.3 / 2.0; //mm
const HEX_RADIUS = 7.6 / 2.0; //mm

const END_GAP = 1.4125;//mm

// NAMESPACE FOR ELD PIPEPLINE
const DIFUSSER_HEIGHT = END_GAP + HEAD_HEIGHT;//mm
const DIFFUSER_MOLD_HEIGHT = 3.00;
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
const LED_TOLERANCE = 4.5; //mm


// MOLDS
const MOLD_WALL = 5; // mm
const MOLD_WALL_SPECIAL = 3.5; // mm

// PCB
const POINT_OFFSET = 4; //pts
const POINT_INNER_OFFSET = 1; //pts
const THETA_STEP = 1; //pts
const THETA_OFFSET = 0.5; //pts
const OPT_MAX_ITERS = 90;
const EPSILON = 10;


const LED_WIDTH = 5;
const LED_HEIGHT = 1.4;


// EVAL
const MODEL_TO_GENERATE = "Reflector"

function Pipeline() {
  
}

Pipeline.getElements = function() {
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
        rays: CanvasUtil.queryPrefix("RAY"), 
        nuts: CanvasUtil.queryPrefix("NUT"), 
        gray: CanvasUtil.queryPrefix("DD") 
    }
}
Pipeline.script = {
    mold: function(display, e) {
        this.adjustLEDs(display, e);

        var result = new paper.Group({name: "RESULT: MOLD"});

        _.each(e.diff, function(diffuser) {
             var expanded  = diffuser.expand({
                strokeAlignment: "exterior", 
                strokeWidth: 1,
                strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL), 
                strokeColor: "black", 
                fillColor: "white", 
                joinType: "miter", 
                parent: result
            });
            diffuser.set({
                visible: true,
                fillColor: "black",
                strokeWidth: 0,
                strokeColor: "white",
                parent: result
            });
        });

        if(GRAY_ON){
            console.log("GRAY DETECTED", e.gray.length)
      
            _.each(e.diff, function(diffuser) {
                var inverse = diffuser.fillColor.clone();
                inverse.brightness = 0.6;
                diffuser.set({
                    visible: true,
                    fillColor: inverse,
                    strokeWidth: 2,
                    strokeColor: "white",
                    parent: result
                });
            });
            _.each(e.gray, function(diffuser) {
                var inverse = diffuser.fillColor.clone();
                inverse.brightness = 1 - inverse.brightness - 0.1;
                diffuser.set({
                    visible: true,
                    fillColor: inverse,
                    strokeWidth: 0,
                    strokeColor: "white",
                    parent: result
                });
            });
        }

        //Make non-molding objects invisible
        var invisible = _.compact(_.flatten([e.nuts, e.art, e.dds, e.leds, e.cp, e.bi, e.bo, e.base, e.mc, e.wires]));
        Pipeline.set_visibility(invisible, false);

        result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: DIFFUSER";
        result.model_height = DIFFUSER_MOLD_HEIGHT;
    },
    diffuser: function(display, e) {
        this.adjustLEDs(display, e);

        var all = _.flatten([e.leds, e.diff, e.mc, e.base]);
        var result = new paper.Group(all);


        
        _.each(e.diff, function(diffuser) {
             var expanded  = diffuser.expand({
                strokeAlignment: "exterior", 
                strokeWidth: 0,
                strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL), 
                strokeColor: "black", 
                fillColor: "white", 
                joinType: "miter", 
                parent: result
            });
            diffuser.set({
                visible: true,
                fillColor: "black",
                strokeWidth: 0,
                strokeColor: "white",
                parent: result
            });
        });


        
        _.each(e.base, function(base){
            base.strokeWidth =  0;
            base.fillColor =  'white';
        });
        var pegs = _.map(e.nuts, function(nut){
             var bolt_head =  Pipeline.create({ 
             geometry: "circle",
             position: nut.position,
             radius: HEAD_RADIUS, 
             height: (DIFUSSER_HEIGHT - HEAD_HEIGHT)/ DIFUSSER_HEIGHT, 
             parent: result
            });
            var bolt =  Pipeline.create({ 
             geometry: "circle",
             position: nut.position,
             radius: PEG_RADIUS, 
             height: 'black', 
             parent: result
            });
           
        });

        CanvasUtil.call(e.base, "sendToBack");
        
       





        var invisible = _.compact(_.flatten([e.nuts, e.mc, e.art, e.dds, e.leds, e.cp, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);

        // result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: DIFFUSER";
        result.model_height = DIFUSSER_HEIGHT;
    },
    cone_lens: function(display, e) {
        var g = new Generator();
        g.model = "Splitter";

        var result = new paper.Group();
        // this.makeFromProfile(display, e, g);

        if(SWATCH_ON){
            var model = MODEL_TO_GENERATE;
            e.diff[0].diffuser = "Planar";
            e.diff[1].diffuser = "Planar";
            e.diff[2].diffuser = "Hemisphere";
            e.diff[3].diffuser = "Cuboid";
        }else{
             _.each(e.diff, function(d){ d.diffuser = "Planar"}); 
        }

        cones = _.map(e.diff, function(diff) {
            dleds = _.filter(e.leds, function(l) { return diff.contains(l.bounds.center); });

            var ils = interpolation_lines(diff, dleds, visible=false);
            var lines = _.map(ils, function(il){ return {line: il.line, led: il.led, roundedLength: parseInt(il.line.length)}});
            

            var cache_gradients = _.chain(lines)
                .unique(function(l){ return l.roundedLength})
                .map(function(l){
                  g.length = l.roundedLength;
                  g.random = false;
                  g.diffuser = diff.diffuser;
                  return { roundedLength: l.roundedLength,  gradients: g.getGradient(), line: l.line};
                })
                .groupBy("roundedLength")
                .value();

            var average_cone = _.reduce(lines, function(memo, l){
                var length = l.roundedLength;
                var cache = cache_gradients[length][0];
                return memo + cache.gradients.prism.width;
            }, 0); 
            var max_cone_height = _.max(lines, function(l){
                var length = l.roundedLength;
                var cache = cache_gradients[length][0];
                l.max =  cache.gradients.prism.height;
                return cache.gradients.prism.height;
            });
            // console.log("MAX HEIGHT", max_cone_height.max) 
            average_cone /= lines.length;
            // console.log("AVG", average_cone)
            average_cone_line = _.min(lines, function(l){
                var length = l.roundedLength;
                var cache = cache_gradients[length][0];
                return Math.abs(average_cone - cache.gradients.prism.width);
            });
            average_gradient = cache_gradients[average_cone_line.roundedLength][0].gradients.mold;
                var base = new paper.Path.Circle({
                    parent: result,
                    radius: average_cone + 5, 
                    fillColor: new paper.Color(1.0), 
                    position: lines[0].led.position, 
                });
                var cone = new paper.Path.Circle({
                    parent: result,
                    radius: average_cone, 
                    fillColor: "yellow", 
                    position: lines[0].led.position, 
                });
                cone.fillColor = {
                    gradient: {
                        stops: average_gradient,
                        radial: true
                    },
                    origin: cone.bounds.center,
                    destination: cone.bounds.topCenter.clone()
                }
                assembly = new paper.Group({
                    parent: result, 
                    children: [base, cone]
                })
            return {cone: assembly, height: max_cone_height.max};
        });
        // PACKING
        geoms = _.pluck(cones, "cone");
       
        // one row
        var w =  _.max(_.map(geoms, function(g){  return g.bounds.width}));
        var h =  _.max(_.map(geoms, function(g){  return g.bounds.height}));
        w *= 1.1;
        h *= 1.1;
        var pack = new paper.Group({
            parent: result
        })
        _.each(geoms, function(g, i){
            reshape_x = i % 2;
            reshape_y = parseInt(i / 2);
            g.position.x = paper.view.center.x + (w * reshape_x);
            g.position.y = paper.view.center.y + (h * reshape_y);
            g.parent = pack; 
        });
        pack.position = paper.view.center;

        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds, 
            parent: result,
            fillColor: "black"
        }); 
        backgroundBox.sendToBack();


        // END PACKING
        var MAX_HEIGHT = Ruler.mm2pts(10);//_.max(_.pluck(cones, 'height'));
        // MAX_HEIGHT /= 0.90; //adding the base
        console.log("CONES", MAX_HEIGHT);
        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp, e.base, e.mc, e.wires, e.leds]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: CONES LENSES";
        result.model_height = Ruler.pts2mm(MAX_HEIGHT);
        var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS"]});
        CanvasUtil.call(removeable, "remove"); 
    },
    cones: function(display, e){
        var g = new Generator();
        g.model = "Splitter";

        var result = new paper.Group();
        // this.makeFromProfile(display, e, g);

       if(SWATCH_ON){
            var model = MODEL_TO_GENERATE;
            e.diff[0].diffuser = "Planar";
            e.diff[1].diffuser = "Planar";
            e.diff[2].diffuser = "Hemisphere";
            e.diff[3].diffuser = "Cuboid";
        }else{
             _.each(e.diff, function(d){ d.diffuser = "Planar"}); 
        }


        cones = _.map(e.diff, function(diff) {
            dleds = _.filter(e.leds, function(l) { return diff.contains(l.bounds.center); });

            var ils = interpolation_lines(diff, dleds, visible=false);
            var lines = _.map(ils, function(il){ return {line: il.line, led: il.led, roundedLength: parseInt(il.line.length)}});
            

            var cache_gradients = _.chain(lines)
                .unique(function(l){ return l.roundedLength})
                .map(function(l){
                  g.length = l.roundedLength;
                  g.random = false;
                  g.diffuser = diff.diffuser;
                  return { roundedLength: l.roundedLength,  gradients: g.getGradient(), line: l.line};
                })
                .groupBy("roundedLength")
                .value();

            var average_cone = _.reduce(lines, function(memo, l){
                var length = l.roundedLength;
                var cache = cache_gradients[length][0];
                return memo + cache.gradients.prism.width;
            }, 0); 
            var max_cone_height = _.max(lines, function(l){
                var length = l.roundedLength;
                var cache = cache_gradients[length][0];
                l.max =  cache.gradients.prism.height;
                return cache.gradients.prism.height;
            });
            // console.log("MAX HEIGHT", max_cone_height.max) 
            average_cone /= lines.length;
            // console.log("AVG", average_cone)
            average_cone_line = _.min(lines, function(l){
                var length = l.roundedLength;
                var cache = cache_gradients[length][0];
                return Math.abs(average_cone - cache.gradients.prism.width);
            });
            average_gradient = cache_gradients[average_cone_line.roundedLength][0].gradients.cone;
                var base = new paper.Path.Circle({
                    parent: result,
                    radius: average_cone + 10, 
                    fillColor: new paper.Color(0.1), 
                    position: lines[0].led.position, 
                });
                var cone = new paper.Path.Circle({
                    parent: result,
                    radius: average_cone, 
                    fillColor: "yellow", 
                    position: lines[0].led.position, 
                });
                cone.fillColor = {
                    gradient: {
                        stops: average_gradient,
                        radial: true
                    },
                    origin: cone.bounds.center,
                    destination: cone.bounds.topCenter.clone()
                }
                assembly = new paper.Group({
                    parent: result, 
                    children: [base, cone]
                })
            return {cone: assembly, height: max_cone_height.max};
        });
        // PACKING
        geoms = _.pluck(cones, "cone");
       
        // one row
        var w =  _.max(_.map(geoms, function(g){  return g.bounds.width}));
        var h =  _.max(_.map(geoms, function(g){  return g.bounds.height}));
        w *= 1.1;
        h *= 1.1;
        var pack = new paper.Group({
            parent: result
        })
        _.each(geoms, function(g, i){
            reshape_x = i % 2;
            reshape_y = parseInt(i / 2);
            g.position.x = paper.view.center.x + (w * reshape_x);
            g.position.y = paper.view.center.y + (h * reshape_y);
            g.parent = pack; 
        });
        pack.position = paper.view.center;

        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds, 
            parent: result,
            fillColor: "black"
        }); 
        backgroundBox.sendToBack();


        // END PACKING
        var MAX_HEIGHT = _.max(_.pluck(cones, 'height'));
        MAX_HEIGHT /= 0.90; //adding the base
        console.log("CONES", MAX_HEIGHT);
        // INVISIBILITY
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp, e.base, e.mc, e.wires, e.leds]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: CONES";
        result.model_height = Ruler.pts2mm(MAX_HEIGHT);
        var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS", "NP"]});
        CanvasUtil.call(removeable, "remove"); 
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
        this.makeFromProfile(display, e, g, chassis = false, dome=true);
    },
    reflector: function(display, e) {
        var g = new Generator();
        g.model = "Reflector";
        g.export = "REFL";
        result = this.makeFromProfile(display, e, g);
        // _.each(e.dds, function(diffuser){
        //     diffuser.expand({
        //         strokeAlignment: "exterior", 
        //         strokeWidth: 0.1,
        //         strokeOffset: 0, 
        //         // strokeColor: "orange", 
        //         fillColor: "black", 
        //         joinType: "miter", 
        //         opacity: 0.5,
        //         parent: result
        //     });
        //     two = diffuser.expand({
        //         strokeAlignment: "exterior", 
        //         strokeWidth: 0,
        //         strokeOffset: 4, 
        //         strokeColor: "orange", 
        //         fillColor: "white", 
        //         joinType: "miter", 
        //         opacity: 1.0,
        //         parent: result
        //     });
        //     two.sendToBack();
        // }); 
    },
    makeFromProfile: function(display, e, g, chassis=true, dome=false) {
        this.adjustLEDs(display, e);
        if(chassis)
            var all = _.flatten([e.base, e.diff, e.leds]);
        else
            var all = _.flatten([e.diff]);

        // HARD_CODE_DIFFUSER ASSOCIATIONS
        if(SWATCH_ON){
            var model = MODEL_TO_GENERATE;
            e.diff[0].diffuser = "Planar";
            e.diff[1].diffuser = "Planar";
            e.diff[2].diffuser = "Hemisphere";
            e.diff[3].diffuser = "Cuboid";
        }else{
             _.each(e.diff, function(d){ d.diffuser = "Planar"}); 
             _.each(e.dds, function(d){ d.diffuser = "Planar"}); 
        }
       
        var result = new paper.Group(all);
        
        _.each(e.base, function(base){
            base.strokeWidth =  0.01;
            base.strokeColor = "black";
            base.fillColor =  "white";
        });



        _.each(e.diff, function(diffuser) {
            if(diffuser.className == "Group") return;
             var expanded  = diffuser.expand({
                strokeAlignment: "exterior", 
                strokeWidth: 0,
                strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL), 
                strokeColor: "black", 
                fillColor: "white", 
                joinType: "miter", 
                parent: result
            });
            diffuser.set({
                visible: true,
                fillColor: "black",
                strokeWidth: 0,
                strokeColor: "white",
                parent: result
            });
        });
       

        ramps = _.map(e.diff, function(diff) {
            dleds = _.filter(e.leds, function(l) { return diff.contains(l.bounds.center); });
            if(dleds.length == 0) return;
            var ils = interpolation_lines(diff, dleds, visible=false);
            var lines = _.map(ils, function(il){ return {line: il.line, led: il.led, roundedLength: parseInt(il.line.length)}});

            var cache_gradients = _.chain(lines)
                .unique(function(l){ return l.roundedLength})
                .map(function(l){
                  g.length = l.roundedLength;
                  g.random = false;
                  g.diffuser = diff.diffuser;
                  return { roundedLength: l.roundedLength,  gradients: g.getGradient(), line: l.line};
                })
                .groupBy("roundedLength")
                .value();

            // // MAKE RAMPS
            var ramp_lines = _.map(lines, function(l){
                var length = l.roundedLength;
                var gradient = cache_gradients[length][0].gradients.reflector;
                return { ramp: gradient, line: l.line};
            });             
            ramps = rampify(ramp_lines, result);
// //  
            if(dome){
                // MAKE DOMES
                var average_dome = _.reduce(lines, function(memo, l){
                    var length = l.roundedLength;
                    var cache = cache_gradients[length][0];
                    return memo + cache.gradients.domeWidth;
                }, 0); 
                average_dome /= lines.length;

                average_dome_line = _.min(lines, function(l){
                    var length = l.roundedLength;
                    var cache = cache_gradients[length][0];
                    return Math.abs(average_dome - cache.gradients.domeWidth);
                });
                average_gradient = cache_gradients[average_dome_line.roundedLength][0].gradients.dome;
                var dome = new paper.Path.Circle({
                    parent: result,
                    radius: average_dome, 
                    fillColor: "yellow", 
                    position: lines[0].led.position, 
                });
                dome.fillColor = {
                    gradient: {
                        stops: average_gradient,
                        radial: true
                    },
                    origin: dome.bounds.center,
                    destination: dome.bounds.topCenter.clone()
                }
            }
           
           return ramps;
           return new paper.Group();
        });



        if(chassis){
           if(MC_MOVE){
                var mc = this.adjustMC(display, e, e.base[0]);
                if(mc){ 
                    mc.parent = result; 
                    mc.bringToFront();
                }
            }
            else{
                e.mc[0].parent = result; 
                e.mc[0].bringToFront();
                e.mc[0].fillColor = "black";
            }
            _.each(e.diff, function(diffuser) {
                diffuser.bringToFront();
                diffuser.set({
                  strokeColor: "white", 
                  fillColor: null, 
                  strokeWidth: 5
                })
            });
            // _.each(e.leds, function(led){
            //     l = led.clone();
            //     l.fillColor = "black";
            //     l.strokeColor = "black";
            //     l.strokeWidth = 4;
            //     result.addChild(l);
            //     l.bringToFront();
            // });
            
            // _.each(e.diff, function(diff) {
            //    diff.set({
            //         fillColor: "white",
            //         opacity: 1,
            //         strokeWidth: 0, 
            //         // strokeColor: 'black',
            //         // radius: Ruler.mm2pts(5), 
            //         // position: led.position, 
            //         // strokeWidth: Ruler.mm2pts(LED_TOLERANCE), 
            //         parent: result
            //     })
            //    diff.bringToFront();
            //     // led.remove();
            // });
            
            var pegs = _.map(e.nuts, function(nut){
                var bolt =  Pipeline.create({ 
                 geometry: "circle",
                 position: nut.position,
                 radius: PEG_RADIUS, 
                 height: 'black', 
                 parent: result
                });
            });
            _.each(e.leds, function(led) {
                var led_hole = new paper.Path.Circle({
                    fillColor: "black",
                    strokeColor: 'black',
                    radius: Ruler.mm2pts(5) / 2, 
                    position: led.position, 
                    strokeWidth: Ruler.mm2pts(LED_TOLERANCE)/2, 
                    parent: result
                });
                led_hole.bringToFront();
                led.remove();
            });

        }

        // var pegs = Pipeline.create_corner_pegs({ 
        //  geometry: "hex",
        //  bounds: backgroundBox.strokeBounds, 
        //  radius: HEX_RADIUS, 
        //  padding: PEG_PADDING, 
        //  height: 'yellow', 
        //  parent: result
        // });
      
       
        // INVISIBILITY

        var removeable = CanvasUtil.query(paper.project, { prefix: ["RT", "RAY", "PL", "LS", "NP"]});
        CanvasUtil.call(removeable, "remove"); 
        if(chassis) var invisible = _.compact(_.flatten([e.nuts,  e.art, e.bo, e.bi, e.cp, e.dds]));
        else var invisible = _.compact(_.flatten([ e.nuts, e.art, e.bo, e.bi, e.cp, e.mc, e.dds]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: REFLECTOR";
        result.model_height = REFLECTOR_HEIGHT;
        return result;
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
        var invisible = _.compact(_.flatten([e.nuts, e.art, e.base, e.dds, e.bo, e.bi, e.cp, e.leds]));
        Pipeline.set_visibility(invisible, false);

        result.name = "RESULT: NO LENS";
        result.model_height = REFLECTOR_HEIGHT;
    },
    spacer: function(display, e) {
        var ws = new WebStorage();
        
        this.adjustLEDs(display, e);
    
        var all = _.flatten([e.leds, e.diff, e.mc, e.base]);
        var result = new paper.Group(all);

        _.each(e.base, function(base){
            base.strokeWidth =  0.01;
            base.strokeColor = "black";
            base.fillColor =  "white";
        });


        var expanded  = e.base[0].expand({
                strokeAlignment: "interior", 
                strokeWidth: 0.1,
                strokeOffset: Ruler.mm2pts(MOLD_WALL), 
                strokeColor: "black", 
                fillColor: new paper.Color(PCB_HEIGHT/SPACER_HEIGHT), 
                joinType: "miter", 
                parent: result
        });



        var pegs = _.map(e.nuts, function(nut){

            var bolt =  Pipeline.create({ 
             geometry: "circle",
             position: nut.position,
             radius: PEG_RADIUS, 
             height: 'black', 
             parent: result
            });
        });

        if(MC_MOVE){
            var mc = this.adjustMC(display, e, e.base[0]);
            if(mc){ mc.parent = result; mc.bringToFront();}
        }
        else{
            e.mc[0].fillColor = "black";
            e.mc[0].parent = result; e.mc[0].bringToFront();
        }
     
        var invisible = _.compact(_.flatten([e.nuts, e.art, e.cp, e.dds, e.bo, e.bi, e.wires]));
        Pipeline.set_visibility(invisible, false);
        CanvasUtil.call(e.base, "sendToBack");

         _.each(e.leds, function(led) {
            var led_hole = new paper.Path.Circle({
                fillColor: "black",
                strokeColor: 'black',
                radius: Ruler.mm2pts(5) / 2, 
                position: led.position, 
                strokeWidth: Ruler.mm2pts(LED_TOLERANCE) / 2, 
                parent: result
            })
            // led.set({
            //     fillColor: "black",
            //     strokeColor: 'black',
            //     strokeWidth: Ruler.mm2pts(LED_TOLERANCE), 
            //     parent: result
            // });
            led.remove();
        });


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
        if(MC_MOVE){
            var mc = this.adjustMC(display, e, e.base[0]);
            if(mc){ mc.parent = result; mc.bringToFront();}
        }
        else{
            e.mc[0].parent = result; e.mc[0].bringToFront();
        }
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
             paper.view.zoom = 1;
        });
        addTool();
        var invisible = _.compact(_.flatten([e.base, e.cp]));
        Pipeline.set_visibility(invisible, false);
        paper.view.zoom = 1;
    },
    base: function(display, e) {
       
        var all = _.flatten([e.leds, e.diff, e.mc, e.base]);
        var result = new paper.Group(all);

        _.each(e.base, function(base){
            base.strokeWidth =  0;
            base.fillColor =  'white';
            base.parent = result;
        });
        var pegs = _.map(e.nuts, function(nut){
            var nut =  Pipeline.create({ 
             geometry: "hex",
             position: nut.position,
             radius: HEX_RADIUS, 
             height: END_GAP / BASE_HEIGHT, 
             parent: result
            });
            var bolt =  Pipeline.create({ 
             geometry: "circle",
             position: nut.position,
             radius: PEG_RADIUS, 
             height: 'black', 
             parent: result
            });
        });

        CanvasUtil.call(e.base, "sendToBack");

        var invisible = _.compact(_.flatten([e.art, e.nuts, e.mc, e.leds, e.dds, e.diff, e.cp, e.bo, e.bi]));
        Pipeline.set_visibility(invisible, false);
        result.scaling = new paper.Size(-1, 1);
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
            else{
                rotation = _.findWhere(config, {id: led.lid});
                if(rotation) rotation = rotation.theta
            }
            led.set({
                rotation: rotation
            });
        });
    }, 
    code: function(display, e){
        console.log(_.map(e.leds, function(led){
            if(led.colorID)
                return "strip.setPixelColor(" + led.lid+ "," + rgb2hex2(led.colorID.toCanvasStyle()) +");";
            else

               return "strip.setPixelColor(" + led.lid+ "," + rgb2hex2(led.fillColor.toCanvasStyle()) +");";
        }).join('\n'));
    }
}



Pipeline.set_visibility = function(objects, is_visible) {
    _.each(objects, function(object) {
        object.visible = is_visible;
    });
    paper.view.update();
}

Pipeline.create = function(o){
    o.radius = Ruler.mm2pts(o.radius);

    if(o.geometry == "hex"){
        return new Path.RegularPolygon({
            parent: o.parent,
            position: o.position,
            center: [50, 50],
            sides: 6,
            fillColor: o.height,
            radius: o.radius
        });
    }else{
        return new paper.Path.Circle({
            parent: o.parent,
            position: o.position,
            fillColor: o.height,
            radius: o.radius
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
