
// DOME
var DOME_BASE_WIDTH = 7; //mm
var DOME_BASE_HEIGHT = 4; //mm
var CONCAVE_HEIGHT = 6; //mm

LensGenerator.OPTIMAL_PARAMS = {"lens":{"width":200,"height":28.3464567},"dome":{"width":19.84251969,"height":11.33858268,"concave":17.00787402},"wall_gap":1.417322835,"led":{"width":14.17322835,"height":3.9685039379999996},"ramp":{"offset":174.6202688761353,"alpha":0.8606031599579123,"beta":0.8858146876934188,"width":38.86193567101384}}
LensGenerator.DEFAULT_PARAMS = {
  lens: {
    width: Ruler.mm2pts(30), 
    height: Ruler.mm2pts(10)
  },
  dome: {
    width: Ruler.mm2pts(7), 
    height: Ruler.mm2pts(4),
    concave: Ruler.mm2pts(6)
  }, 
  led: {
    width: Ruler.mm2pts(LED_WIDTH), 
    height: Ruler.mm2pts(LED_HEIGHT)
  }, 
  ramp:{
    offset: 0.5,
    alpha: 0.5,
    beta: 0.5
  }, 
  wall_gap: Ruler.mm2pts(0.5), 
}


function LensGenerator(ws) {
    if(_.isUndefined(ws)) this.ws = new WebStorage();
    else this.ws = ws;
}

LensGenerator.prototype = {
  generateRandom: function(width){
    var params = LensGenerator.DEFAULT_PARAMS;
    params.lens.width = width;
    params.ramp.alpha = Math.random();
    params.ramp.beta = Math.random();
    params.ramp.offset = Math.random();

    // half of the geom is max dome width
   
    var dome_range =  Ruler.mm2pts(LED_WIDTH); // (width / 4.0) +;
    params.dome.width = (Ruler.mm2pts(LED_WIDTH) / 2.0) + (dome_range * Math.random());
    params.ramp.width = params.lens.width - params.dome.width - params.wall_gap;

    var overall_dome_height = params.lens.height - Ruler.mm2pts(2) - Ruler.mm2pts(LED_HEIGHT);
    overall_dome_height *= Math.random();
    var height_concave_ratio = Math.random();
    height_concave_ratio = height_concave_ratio < 0.5 ? 1 - height_concave_ratio : height_concave_ratio;
    params.dome.height =  Ruler.mm2pts(LED_HEIGHT) + (overall_dome_height * height_concave_ratio); // 1mm gap from top and 1mm concave min;
    params.dome.concave = Ruler.mm2pts(1) + (overall_dome_height * (1 - height_concave_ratio));

    return params;
  },
  generate: function(box, params){
    return LensGenerator.generateScene(box, params);
  }, 
  generateW: function(box, width, params){
    params.lens.width = width;
    return LensGenerator.generateScene(box, params);
  },
  sampleRamp: function(result, y){
     var ramp = result.ramp;
    var range = result.range;
    // When is the height 50 % for a given line width?
    // y => [0, 1]
    // 0 is LED source
    if(y > 0.99) y = 0.99;

    var y = result.params.lens.height * y;


   
    // if(x < result.rampStart) return 0;
    // else{
        var pt = range.getPointAt(y);
        var hline = new paper.Path.Line({
            to: new paper.Point(100000000, pt.y), 
            from: pt.clone(), 
            strokeColor: "red", 
            strokeWidth: 1
        });
        var npt = hline.getIntersections(ramp);
        hline.remove();
        npt = npt[0].point
        // console.log("S", (pt.y - npt.y).toFixed(0), (pt.y - result.ramp.lastSegment.point.y).toFixed(0));
        return (pt.x - npt.x) / (pt.x - result.ramp.lastSegment.point.x);
    // }
  },
  getRampFromOptimal: function(l){
    var params = this.getOptimal(l);

    var ramp = LensGenerator.generateRampPath({
        height: params.lens.height,
        width: params.ramp.width,
        offset: params.ramp.offset,
        alpha: params.ramp.alpha,
        beta: params.ramp.beta
    }, visual=false);
    ramp.set({
        // parent: result,
        strokeColor: "yellow",
        scaling: new paper.Size(-1, 1),
        pivot: ramp.bounds.bottomLeft,
        // position: d.lastSegment.point
        position: paper.view.center
    });    
    ramp.reverse();
    ramp.firstSegment.selected = true;

   var paramLine = new paper.Path.Line({
        from: ramp.bounds.bottomLeft, 
        to: ramp.bounds.topLeft, 
        strokeColor: "yellow", 
        strokeWidth: 1, 
        visible: false
    });
    return {ramp: ramp, range: paramLine, params: params};
  },
  getDomeFromOptimal: function(l){

  },
  interpolateParams: function(a, b, tau){
    // console.log("Interpolating", a, b, tau);
    itau = 1 - tau;

    a.dome.width = a.dome.width * tau + b.dome.width * itau;
    a.dome.height = a.dome.height * tau + b.dome.height * itau;
    a.dome.concave = a.dome.concave * tau + b.dome.concave * itau;
    a.ramp.width = a.ramp.width * tau + b.ramp.width * itau;
    a.ramp.offset = a.ramp.offset * tau + b.ramp.offset * itau;
    a.ramp.alpha = a.ramp.alpha * tau + b.ramp.alpha * itau;
    a.ramp.beta = a.ramp.beta * tau + b.ramp.beta * itau;
    return a;
  },
  getOptimal: function(l){
    // console.log("OPTIMAL", l);
    if(this.ws.includes(l)){
        return JSON.parse(this.ws.get(l));
    }
    else{
        keys = _.sortBy(_.map(this.ws.keys(), function(k){ return parseFloat(k);}));
        keys = _.compact(keys);
        if(keys.length == 0) return this.generateRandom(l);
        b = _.min(keys, function(k){ if(k - l < 0) return 10000000; else return k - l; });
        a = _.min(keys, function(k){ if(l - k < 0) return 10000000; else return l - k; });
        tau = (b-l)/(b-a);

        // console.log("KEYS", a, b, tau);

        a = JSON.parse(this.ws.get(a));
        b = JSON.parse(this.ws.get(b));
        // return b;
        return this.interpolateParams(a, b, tau);
    }  
  }
}

LensGenerator.generateScene = function(box, params){  
    // Base 
    var result = new paper.Group({
      name: "RT: Ray Tracing Scene", 
    });
    var base = new paper.Path.Rectangle({
        size: new paper.Size(params.lens.width, params.lens.height),
        strokeWidth: params.wall_gap,
        strokeColor: "green", 
        strokeScaling: false, 
        parent: result
    });

    result.set({
      pivot: result.bounds.topCenter,
      position: box.position
    });

    
    // LED placement
    var led = new paper.Path.Rectangle({
        size: new paper.Size(params.led.width / 2.0, params.led.height), 
        name: "LS: LED LightSource", 
        strokeWidth: 1,
        strokeColor: "black", 
        strokeScaling: false,
        fillColor: "white",
        parent: result
    });
    led.set({
        pivot: led.bounds.topRight, 
        position: base.bounds.bottomRight
    })
    
    // Dome placement
    var base_offset = new paper.Point(0,  -base.strokeWidth);


    var d = LensGenerator.generateDome(params.dome.width, params.dome.height, params.dome.concave);
    
    d.set({
        scaling: new paper.Size(-1, 1),
        pivot: d.strokeBounds.bottomRight, 
        position: base.strokeBounds.bottomRight.add(base_offset), 
        parent: result,
        visible: false
    });

    var lastPoint = d.bounds.bottomRight.add(new paper.Point(0, -Ruler.mm2pts(10)));

    // RAMP
    var ramp = LensGenerator.generateRampPath({
        height: params.lens.height,
        width: params.ramp.width,
        offset: params.ramp.offset,
        alpha: params.ramp.alpha,
        beta: params.ramp.beta
    }, visual=false);
    ramp.set({
        parent: result,
        fillColor: "yellow",
        // scaling: new paper.Size(-1, 1),
        pivot: ramp.bounds.bottomRight,
        position: d.lastSegment.point
    });    
    ramp.reverse();


    // // Lens
    rgen = _.map(ramp.segments, function(s){ return s.clone()});
    dgen = _.map(d.segments, function(s){ return s.clone()});

    // make lens
    var lens = new paper.Path({
        parent: result,
        name: "LENS:_1.44",
        segments: _.flatten([dgen, rgen, lastPoint]),
        closed: true, 
        fillColor: "#00A8E1", 
        strokeWidth: 0, 
        strokeColor: "yellow"
    });

    // Reflector
    var reflector = new paper.Path.Rectangle({
        parent: result,
        size: new paper.Size(params.lens.width - params.dome.width, params.lens.height + 1.9),
        name: "REF: 0.9", 
        fillColor: "red", 
        strokeScaling: false
    });
    reflector.set({
      pivot: reflector.bounds.bottomRight, 
      position:  d.lastSegment.point.add(new paper.Point(0, 4))
    });

    lensc = lens.clone();

    var lens_holder = reflector.subtract(lensc)
    lens_holder.set({
        parent: result,
        name: "REF:_0.90", 
        fillColor: "red", 
    });
    // lensc.fillColor = "purple"
    lensc.remove();
    reflector.remove();
    base.remove();
    d.remove();
    // // Image Plane
    var img_plane = new paper.Path.Line({
        parent: result,
        name: "IMG: Image Plane",
        segments: [lens.bounds.topLeft, lens.bounds.topRight], 
        strokeColor: "green", 
        strokeWidth: 1
    });
    img_plane.position.y += 2;   
    return result;
}

/**
 * Example call:
 * var rgen = RampGenerator.generateRampPath({
 *   height: Ruler.mm2pts(10),
 *   width: Ruler.mm2pts(15),
 *   offsetRatio: 0.5,
 *   alpha: 0.5,
 *   beta: 0.5
 * }, visual=true);
 */
LensGenerator.generateRampPath = function(params, visual=false) {
  var offset = params.offset * params.width;
  var rwidth = (1 - params.offset) * params.width;
  var domePoint = new Point(0, 0);
  var offsetVector = new paper.Point(-offset, 0);
  var rampStart = domePoint.add(offsetVector);
  var rampVector = new paper.Point(-rwidth, -params.height);
  var rampEnd = rampStart.add(rampVector);
  
  var rampPath = new Path({
    segments: [
      rampEnd, rampStart, domePoint
    ],
    strokeColor: 'yellow',
    strokeWidth: 1,
    closed: false,
    position: paper.view.center
  });

  // Add the top left and top right _segments_ as fields for
  // updating laters
  rampEnd = rampPath.segments[0];
  rampStart = rampPath.segments[1];

  // Add handles for corner segments
  rampEnd.handleOut = new Point(0, params.height * params.alpha);
  rampStart.handleIn = new Point(- rwidth * params.beta, 0);
  // Cleanup if necessary
  if (!visual) {
    rampPath.remove();
  }
  return rampPath;
}


LensGenerator.generateDome = function(baseWidth, baseHeight, concaveHeight, visible=false) {
    // console.log(baseWidth, baseHeight, concaveHeight)
    // Generating geometries
    baseWidth *= 2; // prism in half
    var base = new Path.Rectangle({
        size: new paper.Size(baseWidth, baseHeight),
        strokeColor: 'yellow',
        strokeWidth: 1,
        fillColor: "", 
        // visible: true
    });
    var lens = new Path.Ellipse({
        rectangle: new Rectangle(new Point(0, 0), new Size(baseWidth, concaveHeight)), 
        strokeColor: 'yellow',
        strokeWidth: 1,
        fillColor: "", 
        // visible: true
    });

    lens.set({
        position: base.bounds.topCenter
    });    

    var dome = lens.unite(base);
    dome.visible = false;
    dome.position = paper.view.center;
    lens.remove();
    base.remove();
    // var test = new paper.Group([lens, base]);
    // test.position = paper.view.center;
    // Extracting spline
    var half_dome = _.filter(dome.segments, function(seg) {
        return seg.point.subtract(dome.bounds.center).x > -0.01;
    });

    var spline = new paper.Path({
        segments: half_dome,
        strokeColor: '#00A8E1',
        strokeWidth: 1,
        strokeScaling: false,
        fillColor: "yellow", 
        visible: visible
    });

    spline.firstSegment.handleIn = new paper.Point(0, 0);
    return spline;
}

// gradient, radius, in, out
LensGenerator.makeCDome = function(gradientArray, gradient, position) {
    var maxRadiusObject = _.max(gradientArray, function(gradientObject){
        return gradientObject.radius;
    });

    maxRadius = maxRadiusObject.radius;

    var path = new paper.Path.Circle({
        center: new Point(500, 300),
        radius: maxRadius,
        strokeColor: "black",
        strokeWidth: 2,
        position: position, 
        visible: false
    });

    return _.map(gradientArray, function(obj){
        c = generateSlicedSegment(obj, path, gradient, false);
        // c.visible = true;
        return c;
    }); 
};

// function generateSlicedSegment(o, path, gradient, visible=false) {
//     // Generate both the inPoint and outPoint vectors.
//     var origin = path.position; 

//     var inPoint = origin.clone();
//     var outPoint = origin.clone();
//     var radiusPoint = origin.clone();
//     inPoint.length = 100;
//     outPoint.length = 100;
//     radiusPoint.length = o.radius;
//     inPoint.angle = o.angleIn;
//     outPoint.angle = o.angleOut;
//     radiusPoint.angle = o.angleIn;

//     // // Translate the vectors to the origin
//     inPoint = inPoint.add(origin);
//     outPoint = outPoint.add(origin);
//     radiusPoint = radiusPoint.add(origin);

//     // // Define a circle to be the bounding box of the inputted Geometry.
//     var circle = new paper.Path.Circle({
//         radius: 300,
//         position: origin, 
//         strokeColor: "blue", 
//         strokeWidth: 0.5, 
//         visible: visible
//     });

//     // // // Gets the closest points on the Circle to both the inPoint and outPoint.
//     var nearestInPoint = circle.getNearestPoint(inPoint);
//     var nearestOutPoint = circle.getNearestPoint(outPoint);

//     // // // Define the intersecting path to consist of the inPoint, center, and outPoint.
//     var pieSlice = new paper.Path({
//         segments: [nearestInPoint, origin, nearestOutPoint],
//         // strokeWidth: 1,
//         // strokeColor: "red",
//         closed: true
//     });
//     var intersectingPath = pieSlice.intersect(path);
//     pieSlice.remove();

//     intersectingPath.fillColor = {
//         gradient: o[gradient],
//         origin: origin,
//         destination: radiusPoint,
//     }
//     return intersectingPath;
// }; 


