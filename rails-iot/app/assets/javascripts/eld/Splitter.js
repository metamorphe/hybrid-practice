
function Splitter(){}
Splitter.random = function(length){
  params = {
    lens: {
      width: length, //domain
      height: Ruler.mm2pts(10)// fixed
    }, 
    collimator: {
      width: Ruler.mm2pts(4), // fixed
      gap: Ruler.mm2pts(1) // above the LED
    }, 
    led: {
      width: Ruler.mm2pts(5), //fixed
      height: Ruler.mm2pts(1.4) // fixed
    }, 
    ramp: {
      a:{
        alpha: Math.random(),  // free variables
        beta: Math.random(),  // free variables
      },
      b:{
        alpha: Math.random(),  // free variables
        beta: Math.random(),// free variables
      }
    },
    prism:{
      width: Ruler.mm2pts(6.5) // fixed 
    }
  }
  params.prism.height = (Ruler.mm2pts(10) - params.collimator.gap - Ruler.mm2pts(1) ) * Math.random(),  // available height is based on collimator gap + 1 mm minimum 
  params.collimator.height = (Ruler.mm2pts(10) - params.prism.height) / 2.0 * Math.random();
  return params;
}
Splitter.getOptimal = function(ws, l){
    if(ws.includes(l)){
        return JSON.parse(ws.get(l));
    }
    else{
        keys = _.sortBy(_.map(ws.keys(), function(k){ return parseFloat(k);}));
        keys = _.compact(keys);
        if(keys.length == 0) return Splitter.random(l);
        b = _.min(keys, function(k){ if(k - l < 0) return 10000000; else return k - l; });
        a = _.min(keys, function(k){ if(l - k < 0) return 10000000; else return l - k; });
        tau = (b-l)/(b-a);

        // console.log("KEYS", a, b, tau);

        a = JSON.parse(ws.get(a));
        b = JSON.parse(ws.get(b));
        // return b;
        return Splitter.interpolateParams(a, b, tau);
    }  
}
Splitter.interpolateParams = function(a, b, tau){
    // console.log("Interpolating", a, b, tau);
    itau = 1 - tau;

    a.lens.width = a.lens.width * tau + b.lens.width * itau;
    a.ramp.a.alpha = a.ramp.a.alpha * tau + b.ramp.a.alpha * itau;
    a.ramp.a.beta = a.ramp.a.beta * tau + b.ramp.a.beta * itau;
    
    a.ramp.b.alpha = a.ramp.b.alpha * tau + b.ramp.b.alpha * itau;
    a.ramp.b.beta = a.ramp.b.beta * tau + b.ramp.b.beta * itau;

    a.prism.height = a.prism.height * tau + b.prism.height * itau;
    a.collimator.height = a.collimator.height * tau + b.collimator.height * itau;

    return a;
}
Splitter.moldGradient = function(params){
    lens = CanvasUtil.queryPrefix('LENS')[0]; 
    var mold_gradient = new Path({
      segments:  lens.segments.slice(2, 6), 
      strokeColor: "yellow",
      strokeWidth: 1
      // position: paper.view.center
    });
    var mold_height = mold_gradient.bounds.height;
    mold_gradient.reverse();
    mold_gradient.set({
       pivot: mold_gradient.bounds.topRight,
       position: new paper.Point(0, 0), 
    })
    mold_gradient.scaling = new paper.Size(-1/mold_gradient.bounds.width, 1/mold_gradient.bounds.height);

    var samples = _.range(0, mold_gradient.length, 0.01);

    var stops = _.chain(samples).map(function(sample){
      var pt = mold_gradient.getPointAt(sample);
      var x = pt.x;
      var range_y = mold_height / params.lens.height;
      y = (1 - pt.y);
      y *= range_y;
      return [new paper.Color(y), x]
    }).unique(function(g){ return g[1]; }).value();
    return stops;
}
Splitter.coneGradient = function(params){
  lens = CanvasUtil.queryPrefix('LENS')[0]; 
  var cone_assembly_height = params.prism.height + WING_HEIGHT;
 

    var cone_gradient = new Path.Line({
      from: lens.segments[0].point, 
      to: lens.segments[1].point, 
      strokeColor: "yellow",
      strokeWidth: 0.1
    });
    cone_gradient.set({
       pivot: cone_gradient.bounds.topRight,
       position: new paper.Point(0, 0), 
    })
    cone_gradient.scaling = new paper.Size(-1/cone_gradient.bounds.width, 1/cone_gradient.bounds.height);

    var samples = _.range(0, cone_gradient.length, 0.01);
    var stops = _.chain(samples).map(function(sample){
      var pt = cone_gradient.getPointAt(sample);
      var x = pt.x;
      if(x == 1) x = 0.99;
      var off_y = WING_HEIGHT / cone_assembly_height;
      var range_y = 1 - off_y;
      y = (pt.y * range_y) + off_y;
      // console.log(pt.y, x);
      return [new paper.Color(y), x]
    }).unique(function(g){ return g[1]; }).value();
    
    stops.push([new paper.Color(0, 0 , 0, 0), 1.0]); 
    cone_gradient.scaling = new paper.Size(-1, 1);
    cone_gradient.remove();
    return stops;
}
Splitter.rampGradient = function(params){
    // REFLECTOR
    ref = CanvasUtil.queryPrefix('REF')[0];

    var reflector_gradient = new paper.Path({
      segments: ref.segments.slice(1, 4), 
      strokeColor: "yellow",
      strokeWidth: 1
    });
    reflector_gradient.reverse();
     
    reflector_gradient.set({
       pivot: reflector_gradient.bounds.topRight.clone(), 
       position: new paper.Point(0, 0), 
    })
    reflector_gradient_width = reflector_gradient.bounds.width + Ruler.mm2pts(6.5);
    reflector_gradient.scaling = new paper.Size(-1/(reflector_gradient.bounds.width + Ruler.mm2pts(6.5)), 1/reflector_gradient.bounds.height);
    reflector_gradient.position = new paper.Point(Ruler.mm2pts(6.5) / reflector_gradient_width, 0);
    var samples = _.range(0, reflector_gradient.length, 0.01);
    var stops = _.chain(samples).map(function(sample){
      var pt = reflector_gradient.getPointAt(sample);
      var x = pt.x;
      if(x == 1) x = 0.99;
      y = 1 - pt.y;
      return [new paper.Color(y), x]
    }).unique(function(g){ return g[1]; }).value();
    
    total_ref_height = params.lens.height + Ruler.mm2pts(0.01); 
    stops.push([new paper.Color(Ruler.mm2pts(0.01) / total_ref_height), 0]); 
    stops.push([new paper.Color(0, 0 , 0, 0), 1.0]); 

    reflector_gradient.scaling = new paper.Size(-1, 1);
    reflector_gradient.position = paper.view.center;
    reflector_gradient.remove();
    return stops;
}

Splitter.makeWings = function(geometry, parent, color){
    var wings = [
      new Path.Line({
        from: geometry.bounds.leftCenter.clone().add(new paper.Point(-WING_OFFSET, 0)),
        to: geometry.bounds.rightCenter.clone().add(new paper.Point(WING_OFFSET, 0)),
        parent: parent
      }), 
      new Path.Line({
        from: geometry.bounds.topCenter.clone().add(new paper.Point(0, -WING_OFFSET)),
        to: geometry.bounds.bottomCenter.clone().add(new paper.Point(0, WING_OFFSET)),
        parent: parent
      })
    ];

    wings = _.map(wings, function(wing){
      return wing.expand({
        strokeAlignment: "exterior", 
        strokeOffset: Ruler.mm2pts(4), 
        fillColor: color, 
        joinType: "round", 
        parent: parent,
      });
      wing.remove();
    });
    return wings;
}

Splitter.makeScene = function(box, params){
    var result = new paper.Group({
      name: "RT: Ray Tracing Scene", 
    });

    result.set({
      pivot: result.bounds.topCenter,
      position: box.position.clone()
    });

    var led_ref = new paper.Path.Rectangle({
        size: new paper.Size(params.led.width, params.led.height),
        name: "LS: APA102C",
        fillColor: "white", 
    });

    led_ref.set({
        pivot: led_ref.bounds.topCenter.clone(), 
        position: box.position.clone()
    });


    var lens = new Path.Rectangle({
        size: new paper.Size(params.prism.width * 2, params.lens.height)
    });
    lens.set({
        pivot: lens.bounds.bottomCenter.clone(),
        position: led_ref.position.clone(),
    });

    var lens_hole = new Path.Rectangle({
        size: new paper.Size((params.prism.width * 2) - Ruler.mm2pts(5), params.collimator.height + params.collimator.gap + 10),
    });
    lens_hole.set({
        pivot: lens_hole.bounds.bottomCenter.clone(),
        position: led_ref.position.clone().subtract(new paper.Point(0, -10)),
    });

    lens = Splitter.boolean(lens, lens_hole, "subtract");

    var collimator = new Path.Ellipse({
        rectangle: new Rectangle(new Point(0, 0), new Size(params.collimator.width * 2, params.collimator.height * 2)), 
        fillColor: "green", 
    });
    collimator.set({
        pivot: collimator.bounds.bottomCenter.clone().add(new paper.Point(0, params.collimator.gap)),
        position: led_ref.position.clone()
    });

    lens = Splitter.boolean(lens, collimator, "unite");

    var center = lens.bounds.topRight.clone().subtract(lens.bounds.topLeft.clone());
    center.length = center.length / 2.0; // midpoint
    center = center.add(lens.bounds.topLeft.clone()); // anchor it
    center.y += params.prism.height;

    var prism = new paper.Path({
        segments: [lens.bounds.topLeft.clone(), lens.bounds.topLeft.clone().add(new paper.Point(0, -10)), lens.bounds.topRight.clone().add(new paper.Point(0, -10)), lens.bounds.topRight.clone(), center],
        fillColor: "green", 
        closed: true
    });

    lens = Splitter.boolean(lens, prism, "subtract");
    
    // HALF LENS
    half_lens = _.filter(lens.segments, function(seg){
        return seg.point.subtract(lens.bounds.center).x <= 0.01;
    });
    lens.remove();
    half_lens = new paper.Path({
        name: "LENS:_1.44", 
        segments: half_lens, 
        fillColor: "#00FFFF", 
        parent: result
    });
    var bR = _.min(half_lens.segments, function(seg){ return seg.point.getDistance(half_lens.bounds.bottomRight); })
    bR.handleIn = new paper.Point(0, 0);
    

    // MAKING RAMP
    ramp_height = params.led.height + params.collimator.gap; //+ params.collimator.height
    ramp_width = (params.lens.width) - params.prism.width;
    var ramp = new Path.Rectangle({
        size: new paper.Size(ramp_width, ramp_height),
        fillColor: "#ED1C24", 
        parent: result
    });
    ramp.set({
        name: "REF:_0.90",
        pivot: ramp.bounds.bottomRight.clone(),
        position: lens.bounds.bottomLeft.clone().add(new paper.Point(0, 0))
    });
   
    var topLeft = Splitter.closest(ramp, "topLeft");
    var topRight = Splitter.closest(ramp, "topRight");
    var diff = lens.bounds.topLeft.y - topLeft.point.y;
    topLeft.point.y = lens.bounds.topRight.y;    
    topRight.handleIn = new paper.Point(- ramp_width * params.ramp.a.alpha, - params.lens.height * params.ramp.a.beta);
    topLeft.handleOut = new paper.Point( ramp_width * params.ramp.b.alpha,  - diff * params.ramp.b.beta);
  
    // IMAGE PLANE
    var img_plane = new Path.Line({
        parent: result,
        name: "IMG: Image Plane",
        segments: [result.bounds.topLeft, ramp.bounds.topRight], 
        strokeColor: "green", 
        strokeWidth: 1
    });
   
}

Splitter.closest = function(path, boundsPoint){
  return _.min(path.segments, function(seg){ return seg.point.getDistance(path.bounds[boundsPoint]); })
}

Splitter.boolean = function(pathA, pathB, operation){
  var temp = pathA[operation](pathB);
  pathA.remove();
  pathB.remove();
  return temp;
}