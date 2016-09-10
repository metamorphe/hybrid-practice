
function TIR(){}
TIR.random = function(length){
  params = {
    lens: {
      width: length, //domain
      height: Ruler.mm2pts(10)// fixed
    }, 
    led: {
      width: Ruler.mm2pts(5), //fixed
      height: Ruler.mm2pts(1.4) // fixed
    }, 
    dome: {
      height: Ruler.mm2pts(9) * Math.random(), 
      width: Ruler.mm2pts(10) * Math.random(), 
    },
    ramp: {
      a: {
        alpha: Math.random(), 
        beta: Math.random()
      }, 
      b: {
        alpha: Math.random(), 
        beta: Math.random()
      }, 
      height: Ruler.mm2pts(10)// fixed
    }
  }

  var ratio = Math.random();
  ratio = ratio > 0.5 ? 1 - ratio: ratio; 
  params.dome.width += params.led.width;
  params.dome.concave = params.dome.height * ratio;

  params.ramp.width = (length - params.dome.width/2);
  params.dome.width = length - params.ramp.width;
  params.dome.direction = Math.random() > 0.5 ? 1 : -1;
  return params;
}


TIR.interpolateParams = function(a, b, tau){
    // console.log("Interpolating", a, b, tau);
    itau = 1 - tau;

    a.lens.width = a.lens.width * tau + b.lens.width * itau;
    a.dome.width = a.dome.width * tau + b.dome.width * itau;
    a.dome.concave = a.dome.concave * tau + b.dome.concave * itau;
    a.dome.height = a.dome.height * tau + b.dome.height * itau;
    a.ramp.a.alpha = a.ramp.a.alpha * tau + b.ramp.a.alpha * itau;
    a.ramp.a.beta = a.ramp.a.beta * tau + b.ramp.a.beta * itau;
    a.ramp.b.alpha = a.ramp.b.alpha * tau + b.ramp.b.alpha * itau;
    a.ramp.b.beta = a.ramp.b.beta * tau + b.ramp.b.beta * itau;

    return a;
}

TIR.getGradient = function(type){
  if(type == "RFL"){
    return TIR.rampGradient(params);
  }
}

TIR.rampGradient = function(params){
    // REFLECTOR
    ref = CanvasUtil.queryPrefix('REF')[0];
    led = CanvasUtil.queryPrefix('LS')[0];

    var r_grad = new paper.Path({
      segments: ref.segments.slice(1, 4), 
      strokeColor: "yellow",
      strokeWidth: 1, 
      strokeScaling: false,
      fillColor: null
    });
    r_grad.add(led.bounds.bottomCenter);
    r_grad.reverse();
     
    r_grad.set({
       pivot: r_grad.bounds.topRight.clone(),
       position: new paper.Point(0, 0)
    });

    r_grad.scaling = new paper.Size(-1/(r_grad.bounds.width), -1/r_grad.bounds.height);
    r_grad.position.y ++;
    
    var segment_positions = _.map(r_grad.segments, function(seg){return r_grad.getOffsetOf(seg.point); });
    var samples = _.flatten([_.range(0, r_grad.length, 0.01), segment_positions]);
  
    var stops = _.chain(samples).map(function(sample){
      var pt = r_grad.getPointAt(sample);
      var x = pt.x;
      if(x == 1) x = 0.99;
      y = pt.y;
      return [new paper.Color(y), x]
    }).unique(function(g){ return g[1]; }).value();

    total_ref_height = params.lens.height + Ruler.mm2pts(0.01); 
    
    stops.push([new paper.Color(Ruler.mm2pts(0.01) / total_ref_height), 0]); 
    stops.push([new paper.Color(0, 0 , 0, 0), 1.0]); 
    r_grad.remove();
    return stops;
}


TIR.fabricate = function(params, l){
    var gradient = noLens.rampGradient(params);
     var reflector_group = new paper.Group({
            name: "REFL: Secondary Optics_GROUP"
     });
      var reflector = Path.Circle({
        name: "REF_C: Secondary Optics", 
        radius: l, 
        position: paper.view.center.add(new paper.Point(l * 2,  40)), 
        fillColor: "white", 
        strokeColor: "black", 
        strokeWidth: 1, 
        parent: reflector_group
      })  
      stops = Reflector.rampGradient(params);

      reflector.fillColor = {
        gradient: {
          stops: stops, 
          radial: true
        },
        origin: reflector.bounds.center.clone(), 
        destination: reflector.bounds.rightCenter.clone()
      };
      var led_hole = new paper.Path.Rectangle({
        size: new paper.Size(Ruler.mm2pts(LED_WIDTH), Ruler.mm2pts(LED_WIDTH)), 
        fillColor: "black", 
        position: reflector.bounds.center, 
        parent: reflector_group
      })

      bg = new paper.Path.Rectangle({
        rectangle: reflector_group.bounds, 
        fillColor: "black", 
        parent: reflector_group
      });
      bg.sendToBack();

      console.log("REFLECTOR DIMENSIONS", Ruler.pts2mm(reflector_group.bounds.width).toFixed(2), Ruler.pts2mm(reflector_group.bounds.height).toFixed(2), Ruler.pts2mm(total_ref_height.toFixed(2)));
          
    paper.view.update();
}

TIR.makeScene = function(box, params, diffuser){
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
        applyMatrix: false
    });

    led_ref.set({
        pivot: led_ref.bounds.topCenter.clone(), 
        position: box.position.clone()
    });
  
    // MAKING RAMP
    var ramp = new Path.Rectangle({
        size: new paper.Size(params.ramp.width, params.lens.height),
        fillColor: "#ED1C24", 
        parent: result
    });
    var topLeft = Splitter.closest(ramp, "topRight");
    ramp.removeSegment(topLeft.index);
  
    ramp.set({
        name: "REF:_0.90",
        pivot: ramp.bounds.bottomLeft.clone(),
        position: led_ref.bounds.topCenter.clone().add(new paper.Point(- params.lens.width, 0))
    });

    var cpA = Splitter.closest(ramp, "bottomRight");
    cpA.handleIn = new paper.Point(- params.ramp.width  * params.ramp.a.alpha, - params.ramp.height  * params.ramp.a.beta);
    var cpB = Splitter.closest(ramp, "topLeft");
    cpB.handleOut = new paper.Point( params.ramp.width * params.ramp.b.alpha,  params.ramp.height * params.ramp.b.beta);


    // MAKING DOME
    var base = new Path.Rectangle({
        parent: result,
        size: new paper.Size(params.lens.width, params.lens.height),
        fillColor: "#87CEFA", 
        visible: true
    });
    base.set({
        pivot: base.bounds.bottomRight.clone(), 
        position: led_ref.bounds.topCenter.clone().add(new paper.Point(-0.1, -0.1))
    });
    ramp.bringToFront();
    var lens = Splitter.boolean(base, ramp.clone(), "subtract");
    lens.set({
      name: "LENS:_1.44"
    })

    var domeSegment = Splitter.closest(lens, "bottomRight");
    lens.segments[domeSegment.index].point.y -= params.dome.height - params.dome.concave; 
    lens.segments[domeSegment.index].point.x -= params.dome.width; 
 
    var peakSegment = Splitter.closest(lens, "topRight");
    var peakSegment = lens.insert(peakSegment.index + 1, peakSegment.point.clone());
    peakSegment.point.y += params.lens.height - params.dome.height;
    
    if(params.dome.direction < 0) peakSegment.point.y += params.dome.concave * 2; 
    lens.segments[peakSegment.index].handleOut = new paper.Point(- 0.5 * params.dome.width, 0);
    lens.segments[peakSegment.index].selected = true;
    lens.segments[domeSegment.index].handleIn = new paper.Point(0, - 0.5 * params.dome.concave * params.dome.direction);

    ImagePlane.generate(diffuser, led_ref, ramp, result);
   
}
