
// ANGLE STEP FOR STICHING PROCESS
const MORPH_LINE_STEP = 10;
const TOPOGRAPHIC_STEP = PROFILE_SAMPLING;

function rampify(ramp_lines, parent) {
    levels = _.range(1, 0, -TOPOGRAPHIC_STEP);
    levels = _.map(levels, function(level) {
        return make_level(ramp_lines, level, new paper.Color(level));
    });
    var ramp = new paper.Group(levels);
    ramp.parent = parent;
    // ramp.sendToBack();
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

function interpolation_lines(diffuser, leds, visible=false) {
    var pts = _.range(0, diffuser.length, MORPH_LINE_STEP)
    return _.map(pts, function(i) {
        var pt = diffuser.getPointAt(i);
        closest = _.min(leds, function(l) {
            return l.position.getDistance(pt); 
        });
        l =  new paper.Path.Line({
            from: closest.position,
            to: pt,
            strokeColor: "blue",
            strokeWidth: 2,
            visible: visible
        });
        cross = l.getIntersections(diffuser);
        if(cross.length >= 2){ l.lastSegment.point = cross[0].point; return {line: l, led: closest};}
        return {line: l, led: closest};
    });
}




const DOME_DIFF_EPSILON = 10;
const DOME_STEP = MORPH_LINE_STEP;
const INF_LONG = 10000;

function sliceLines(lines, cache_gradients){
   angles = _.map(lines, function(l){
        var theta = l.line.lastSegment.point.subtract(l.line.firstSegment.point).angle;
        
        lower = theta - DOME_STEP/2.0;
        upper = theta + DOME_STEP/2.0;  
      
        upper ++; // overlap for anti-aliasing
        lower --; // overlap for anti-aliasing

        upper = upper > 180 ? - 180 + (upper % 180) : upper;
        lower = lower < -180 ? 180 + (-lower % 180) : lower;

        var length = l.roundedLength;
        
        // console.log(lower.toFixed(0), theta.toFixed(0), upper.toFixed(0));
        return {line: l.line, length: l.roundedLength, led: l.led, angleIn: lower, center: theta, angleOut: upper};
    }); 

    compact_angles = [];
    var n = angles.length;
    var current = angles[0];
    // console.log("CURRENT", current);
    // console.log("LAST", angles[angles.length - 1]);
    var travel = 0;
    for(var i = 1; i < angles.length; i++){
      var slice = angles[i];
      if(Math.abs(slice.length - current.length) < DOME_DIFF_EPSILON){
        travel += Math.abs(slice.angleOut - current.angleOut);
        current.angleOut = slice.angleOut;
        // current = (slice.length + current.length) / 2.0;
        // console.log("SETTING TO", current.angleIn.toFixed(0), slice.angleOut.toFixed(0), travel);
      }
      else{
        compact_angles.push(current);
        current = slice;
        travel = 0;
        continue;
      }
     
      if(travel > 360){
        current.angleIn = 1; 
        current.angleOut = 0.999;
        compact_angles.push(current);
      }
    }
    return compact_angles;   
}
const SLICE_SAMPLE_SIZE = 1

function generateSlicedSegment2(o, path, gradient, visible=false) {
    // Generate both the inPoint and outPoint vectors.
    var origin = o.led.position; 
    
    // // Define a circle to be the bounding box of the inputted Geometry.
   
    var circle = new paper.Path.Circle({
        radius: INF_LONG,
        position: origin, 
        strokeColor: "blue", 
        strokeWidth: 0.5, 
        visible: visible
    });
    if(o.angleIn > o.angleOut){
      var a = _.range(o.angleIn, 180, SLICE_SAMPLE_SIZE);
      var b = _.range(-180, o.angleOut, SLICE_SAMPLE_SIZE);
      var arcPoints = _.flatten([a, b]);
    }
    else
      var arcPoints = _.range(o.angleIn, o.angleOut + SLICE_SAMPLE_SIZE, SLICE_SAMPLE_SIZE);

    if(arcPoints.length < 360){

      arcPoints = _.map(arcPoints, function(theta){
         var pt = new paper.Point(0, 0);
         pt.length = INF_LONG;
         pt.angle = theta;
         pt = pt.add(origin);
         var l = new paper.Path.Line({
            from: origin, 
            to: pt, 
            visible: false
         });
         ixt = l.getIntersections(path);
         return ixt[0].point;
      });

      // // Define the intersecting path to consist of the inPoint, center, and outPoint.
      var intersectingPath = new paper.Path({
          segments: _.flatten([arcPoints, origin.clone()]),
          strokeWidth: 3,
          strokeColor: "red",
          closed: true
      });
      // intersectingPath = pieSlice.intersect(path);
      // pieSlice.remove();
    }else{
      intersectingPath = path;
      path.bringToFront();
    }

    
    intersectingPath.set({
      strokeColor: 'black', 
      strokeWidth: 0,
    })
    intersectingPath.fillColor = {
        gradient: {
            stops: gradient,
            radial: true
        },
        origin: origin,
        destination: intersectingPath.segments[0].point.clone()
    }
    return intersectingPath;
}; 


