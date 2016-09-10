
function Reflector(){}
Reflector.random = function(length){
  params = {
    lens: {
      width: length, //domain
      height: Ruler.mm2pts(10)// fixed
    }, 
    led: {
      width: Ruler.mm2pts(5), //fixed
      height: Ruler.mm2pts(1.4) // fixed
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
  params.ramp.width = params.lens.width - (params.led.width/2.0);

  return params;
}


Reflector.interpolateParams = function(a, b, tau){
    // console.log("Interpolating", a, b, tau);
    itau = 1 - tau;

    a.lens.width = a.lens.width * tau + b.lens.width * itau;
    a.ramp.a.alpha = a.ramp.a.alpha * tau + b.ramp.a.alpha * itau;
    a.ramp.a.beta = a.ramp.a.beta * tau + b.ramp.a.beta * itau;
    a.ramp.b.alpha = a.ramp.b.alpha * tau + b.ramp.b.alpha * itau;
    a.ramp.b.beta = a.ramp.b.beta * tau + b.ramp.b.beta * itau;

    return a;
}

Reflector.fabricate = function(params, l){
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
Reflector.getGradient = function(type){
  if(type == "REFL"){
    return Reflector.reflectorGradient(params);
  }
}

Reflector.reflectorGradient = function(params){
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
    
    stops = Generator.profileToGradient(params, r_grad);
    
    return stops;
}

Reflector.makeScene = function(box, params, diffuser){
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
        fillColor: "purple", 
        // applyMatrix: false
    });

    led_ref.set({
        pivot: led_ref.bounds.topCenter.clone(), 
        position: box.position.clone()
    });
    // led_ref.position = paper.view.center;
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
        pivot: ramp.bounds.bottomRight.clone(),
        position: led_ref.bounds.topLeft.clone()//.add(new paper.Point(- params.lens.width + (params.led.width/2), 0))
    });

    var cpA = Splitter.closest(ramp, "bottomRight");
    cpA.handleIn = new paper.Point(- params.ramp.width  * params.ramp.a.alpha, - params.ramp.height  * params.ramp.a.beta);
    cpA.selected = true;

    var cpB = Splitter.closest(ramp, "topLeft");
    cpB.handleOut = new paper.Point( params.ramp.width * params.ramp.b.alpha,  params.ramp.height * params.ramp.b.beta);
    
    cpB.selected = true;
    // ramp2 = ramp.clone();
    // ramp2.scaling = new paper.Size(-1, 1);
    // ramp2.pivot = ramp2.bounds.bottomLeft;
    // ramp2.position = led_ref.bounds.bottomRight.clone(); 


    
    // IMAGE PLANE
   
    ImagePlane.generate(diffuser, led_ref, ramp, result);
   
}
