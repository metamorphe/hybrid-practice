
// ANGLE STEP FOR STICHING PROCESS
const MORPH_LINE_STEP = 10;

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

function interpolation_lines(diffuser, leds, visible=false) {
    var pts = _.range(0, diffuser.length, MORPH_LINE_STEP)
    return _.map(pts, function(i) {
        var pt = diffuser.getPointAt(i);
        var candidates = _.map(leds, function(led) {
            return led.position;
        });
        closest = _.min(candidates, function(c) {
            return c.getDistance(pt); 
        });
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


