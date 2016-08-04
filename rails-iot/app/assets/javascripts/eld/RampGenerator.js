
// DOME
var DOME_BASE_WIDTH = 7; //mm
var DOME_BASE_HEIGHT = 4; //mm
var CONCAVE_HEIGHT = 6; //mm


function LensGenerator() {
}
LensGenerator.prototype = {
  generate: function(box, width){
    params = _.clone(LensGenerator.DEFAULT_PARAMS);
    params.lens.width = width;
    return LensGenerator.generateScene(box, LensGenerator.DEFAULT_PARAMS);
  }
}

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
  wall_gap: Ruler.mm2pts(0.5), 
  led: {
    width: Ruler.mm2pts(LED_WIDTH), 
    height: Ruler.mm2pts(LED_HEIGHT)
  }, 
  ramp:{
    offset: Ruler.mm2pts(4),
    alpha: 0.9,
    beta: 0.1
  }
}

LensGenerator.generateScene = function(box, params){  
    // Base 
    var result = new paper.Group({
      name: "RT: Ray Tracing Scene"
    });
    var base = new paper.Path.Rectangle({
        size: new paper.Size(params.lens.width, params.lens.height),
        strokeWidth: params.wall_gap,
        strokeColor: "green", 
        strokeScaling: false, 
        parent: result
    });
    result.set({
      pivot: result.bounds.bottomCenter, 
      position: box.bounds.bottomRight.add(new paper.Point(-60, -10))
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
        pivot: led.bounds.bottomRight, 
        position: base.bounds.bottomRight
    })
    
    // Dome placement
    var base_offset = new paper.Point(0,  -base.strokeWidth);

    var d = LensGenerator.generateDome(params.dome.width, params.dome.height, params.dome.concave);
    d.set({
        scaling: new paper.Size(-1, 1),
        pivot: d.strokeBounds.bottomRight, 
        position: base.strokeBounds.bottomRight.add(base_offset), 
        visible: false, 
        parent: result
    });

    var lastPoint = d.bounds.bottomRight.add(new paper.Point(0, -Ruler.mm2pts(10)));
   
    // // Ramp
    params.ramp.width =  params.lens.width - d.bounds.width - params.wall_gap;
      

    var ramp = LensGenerator.generateRampPath({
        rampHeight: params.lens.height,
        rampWidth: params.ramp.width,
        rampOffset: params.ramp.offset,
        alpha: params.ramp.alpha,
        beta: params.ramp.beta
    }, visual=false);
    ramp.set({
        parent: result,
        fillColor: "yellow",
        scaling: new paper.Size(-1, 1),
        pivot: ramp.bounds.bottomRight,
        position: d.lastSegment.point
    });    
    ramp.reverse();


    // Lens
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

    // // Reflector
    var reflector = new paper.Path.Rectangle({
        parent: result,
        size: new paper.Size(params.ramp.width + 2, params.lens.height + 1.9),
        name: "REF: 0.9", 
        fillColor: "red", 
        strokeScaling: false
    });
    reflector.set({
      pivot: reflector.bounds.bottomRight, 
      position:  d.lastSegment.point.add(new paper.Point(0, 3))
    });
    var lens_holder = reflector.subtract(lens)
    lens_holder.set({
        parent: result,
        name: "REF:_0.90", 
        fillColor: "red", 
    });
    reflector.remove();
    base.remove();

    // // Image Plane
    var img_plane = new paper.Path.Line({
        parent: result,
        name: "IMG: Image Plane",
        segments: [base.bounds.topLeft, base.bounds.topRight], 
        strokeColor: "white", 
        strokeWidth: 2
    });
    img_plane.position.y -= 10;   
    return result;
}

/**
 * Example call:
 * var rgen = RampGenerator.generateRampPath({
 *   rampHeight: Ruler.mm2pts(10),
 *   rampWidth: Ruler.mm2pts(15),
 *   rampOffset: Ruler.mm2pts(10),
 *   alpha: 0.5,
 *   beta: 0.5
 * }, visual=true);
 */
LensGenerator.generateRampPath = function(params, visual=false) {
  var rightmostDomePoint = new Point(0, 0);
  var offsetVector = new paper.Point(params.rampOffset, 0);
  var bottomRightPoint = rightmostDomePoint.add(offsetVector);

  var topLeftPoint = new Point(0,
          rightmostDomePoint.y - params.rampHeight);

  var topRightPoint = new Point(rightmostDomePoint.x + params.rampWidth,
          rightmostDomePoint.y - params.rampHeight);
  
  var rampPath = new Path({
    segments: [
      topRightPoint, bottomRightPoint, rightmostDomePoint
    ],
    strokeColor: 'black',
    strokeWidth: 1,
    closed: false,
    position: paper.view.center
  });

  // Add the top left and top right _segments_ as fields for
  // updating laters
  var topRightSegment = rampPath.segments[0];
  var bottomRightSegment = rampPath.segments[1];

  // Add handles for corner segments
  topRightSegment.handleOut = new Point(0, params.rampHeight * params.alpha);
  bottomRightSegment.handleIn = new Point(params.rampOffset * params.beta, 0);

  // Cleanup if necessary
  if (!visual) {
    rampPath.remove();
  }
  return rampPath;
}



LensGenerator.generateDome = function(baseWidth, baseHeight, concaveHeight) {
    // Generating geometries
    var base = new Path.Rectangle({
        size: new paper.Size(baseWidth, baseHeight),
        strokeColor: 'black',
        strokeWidth: 1,
        fillColor: "", 
        visible: false
    });
    // b2.selected = true;
    var lens = new Path.Ellipse({
        rectangle: new Rectangle(new Point(0, 0), new Size(baseWidth, concaveHeight)), 
        strokeColor: 'black',
        strokeWidth: 1,
        fillColor: "", 
        visible: false
    });

    lens.set({
        position: base.bounds.topCenter
    });    

    var dome = lens.unite(base);
    dome.visible = false;

    // Extracting spline
    var half_dome = _.filter(dome.segments, function(seg) {
        return seg.point.subtract(dome.bounds.center).x >= 0;
    });

    var spline = new paper.Path({
        segments: half_dome,
        strokeColor: '#00A8E1',
        strokeWidth: 1,
        strokeScaling: false,
        fillColor: "purple"
    });

    spline.firstSegment.handleIn = new paper.Point(0, 0);
    return spline;
}

