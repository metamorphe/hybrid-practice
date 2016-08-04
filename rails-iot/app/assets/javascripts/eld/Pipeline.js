// #40-40 X 1in
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
var OPT_MAX_ITERS = 20;
var EPSILON = 10;


var LED_WIDTH = 5;
var LED_HEIGHT = 1.4;



function interpolation_lines2(diffuser, leds) {
    var pts = _.range(0, diffuser.length, 1)
    return _.map(pts, function(i) {
        var pt = diffuser.getPointAt(i);
        var candidates = _.map(leds, function(led) {
            return led.position;
        });
        closest = _.min(candidates, function(c) {
            return c.getDistance(pt); });
        l = new paper.Path.Line({
            from: closest,
            to: pt,
            strokeColor: "blue",
            strokeWidth: 2,
            visible: true
        });
        cross = l.getIntersections(diffuser);
        if(cross.length >= 2){ l.remove(); return null;}
        return l;
    });

}


function Pipeline() {}

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
    raytrace: function(display, e){
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

       morphs = interpolation_lines2(e.diff[0], e.leds);
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
       // morphs = morphs.slice(300, 400)
       _.each(morphs, function(morph, i, arr){
          console.log("I", i, arr.length)
          morph.set({
            visible: true, 
            strokeColor: "yellow"
           });
           morph.bringToFront();

           var scene = lg.generate(tracerBox, morph.length);
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
        var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo]));
        Pipeline.set_visibility(invisible, false);

        result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: DIFFUSER";
        result.model_height = DIFUSSER_HEIGHT;
    },
    diffuser: function(display, e) {
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
        var invisible = _.compact(_.flatten([e.diff, e.art, e.dds, e.bo, e.bi, e.cp]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: LENS";
        result.model_height = REFLECTOR_HEIGHT;
    },
    reflector: function(display, e) {
        var all = _.flatten([e.diff, e.leds]);
        var result = new paper.Group(all);
        backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL)),
            fillColor: "white",
            parent: result
        });

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
        if(e.mc.length > 0){
            var mc = e.mc[0];
            mc.set({
                fillColor: "black",
                pivot: mc.bounds.leftCenter
            });
            mc.position = backgroundBox.getNearestPoint(mc.pivot);
            // mc.position.x -= Ruler.mm2pts(WALL_WIDTH) / 4.0;
            mc.parent = result;
        }
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
        _.each(e.leds, function(led) {
            led.set({
                fillColor: "black",
                strokeColor: 'black',
                strokeWidth: Ruler.mm2pts(LED_TOLERANCE)
            });
        });


        var all = _.flatten([e.leds, e.diff]);
        var result = new paper.Group(all);


        // // BACKGROUND
        var backgroundBox = new paper.Path.Rectangle({
            rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL) - Ruler.mm2pts(WALL_WIDTH)),
            fillColor: new paper.Color(PCB_HEIGHT/SPACER_HEIGHT),
            strokeColor: 'white',
            strokeWidth: Ruler.mm2pts(WALL_WIDTH),
            parent: result
        });
        backgroundBox.sendToBack();
        var pegs = Pipeline.create_corner_pegs({ 
         geometry: "circle",
         bounds: backgroundBox.strokeBounds, 
         radius: PEG_RADIUS, 
         padding: PEG_PADDING, 
         height: 'black', 
         parent: result
        });

        if(e.mc.length > 0){
            var mc = e.mc[0];
            mc.set({
                fillColor: "black",
                pivot: mc.bounds.leftCenter
            });
            mc.position = backgroundBox.getNearestPoint(mc.pivot);
            mc.position.x -= Ruler.mm2pts(WALL_WIDTH) / 4.0;
            mc.parent = result;
             mc.bringToFront();
        }
        // ADD CORNER PEGS
        // var pegs = Pipeline.create_corner_pegs({ 
        //  geometry: "hex",
        //  bounds: backgroundBox.strokeBounds, 
        //  radius: HEX_RADIUS, 
        //  padding: PEG_PADDING, 
        //  height: 'yellow', 
        //  parent: result
        // });

        
       
     
        var invisible = _.compact(_.flatten([e.art, e.dds, e.diff, e.cp, e.bo, e.bi]));
        Pipeline.set_visibility(invisible, false);

        // /* Reflect Object */
        result.scaling = new paper.Size(-1, 1);
        result.name = "RESULT: SPACER";
        result.model_height = SPACER_HEIGHT;
    },
    circuit: function(display, e) {
        // Function that initializes the routing process.
        leds = _.sortBy(e.leds, function(led) {
            return led.lid; });
        nodes = _.flatten([e.bi, leds, e.bo]);

        nodes = CircuitRouting.generateNodes(nodes, function(nodes) {
            _.each(nodes, function(node, i, arr) {
                node.right = null;
                node.left = null;
                if (i - 1 >= 0) node.left = arr[i - 1];
                if (i + 1 < arr.length) node.right = arr[i + 1];
            });
            CircuitRouting.route(nodes);
            CircuitRouting.connect_the_dots(nodes);
            CircuitRouting.cleanup(nodes, e);
            paper.view.update();
        });
        addTool();
    },
    base: function(display, e) {
       
        var all = _.flatten([e.leds, e.diff, e.mc]);
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


        var invisible = _.compact(_.flatten([e.art, e.mc, e.leds, e.dds, e.diff, e.cp, e.bo, e.bi]));
        Pipeline.set_visibility(invisible, false);
        result.name = "RESULT: BASE";
        result.model_height = BASE_HEIGHT;
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
                stops: LensGenerator.generateDome(),
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

    var lines = interpolation_lines(diffuser, leds);
    levels = _.range(1, 0, -0.01);
    levels = _.map(levels, function(level) {
        levelColor = what_gray_value_away_from_led(level);
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