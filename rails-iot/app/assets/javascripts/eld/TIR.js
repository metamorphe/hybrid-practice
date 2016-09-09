
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

  // params.ramp.width = params.lens.width - (params.led.width/2.0);
  var ratio = Math.random();
  ratio = ratio > 0.5 ? 1 - ratio: ratio; 
  // params.dome.width = (length - params.led.width / 2.0) * ratio;
  params.dome.width += params.led.width;
  params.dome.concave = params.dome.height * ratio;
  // params.dome.concave += Ruler.mm2pts(2);

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
TIR.generateDome = function(params, reflector, parent, visible=true) {
    // console.log(baseWidth, baseHeight, concaveHeight)
    // Generating geometries
    
    var base = new Path.Rectangle({
        parent: parent,
        size: new paper.Size(params.lens.width, params.lens.height),
        fillColor: "#87CEFA", 
        visible: visible
    });
    reflector.bringToFront();
    var lens = Splitter.boolean(base, reflector, "subtract");
    return lens;

    // return base;
    // var lens = new Path.Ellipse({
    //     rectangle: new Rectangle(new Point(0, 0), new Size(params.dome.width, params.dome.concave)), 
    //     strokeColor: '#87CEFA',
    //     strokeWidth: 1,
    //     fillColor: "", 
    //     // visible: true
    // });

    // lens.set({
    //     position: base.bounds.topCenter
    // });    

    // var dome = lens.unite(base);
    // dome.visible = true;
    // dome.position = paper.view.center;
    // lens.remove();
    // base.remove();
    // return dome;
    
    // var test = new paper.Group([lens, base]);
    // test.position = paper.view.center;
    // Extracting spline
    var half_dome = _.filter(dome.segments, function(seg) {
        return seg.point.subtract(dome.bounds.center).x <=0;
    });
    // return
    // var spline = new paper.Path({
    //     segments: half_dome,
    //     strokeColor: '#87CEFA',
    //     strokeWidth: 1,
    //     strokeScaling: false,
    //     fillColor: "yellow", 
    //     visible: visible
    // });
    // dome.remove();

    // spline.firstSegment.handleIn = new paper.Point(0, 0);
    // return spline;
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
    
    //  var dome = new Path.Rectangle({
    //     size: new paper.Size(params.dome.width, params.dome.height),
    //     fillColor: "#87CEFA", 
    //     parent: result
    // });

    // dome.set({
    //     name: "LENS:_1.44",
    //     pivot: dome.bounds.bottomRight.clone(),
    //     position: led_ref.bounds.bottomCenter.clone()
    // });

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
    cpA.selected = true;

    var cpB = Splitter.closest(ramp, "topLeft");
    cpB.handleOut = new paper.Point( params.ramp.width * params.ramp.b.alpha,  params.ramp.height * params.ramp.b.beta);
    
    cpB.selected = true;


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
    domeSegment.selected = true;
    lens.segments[domeSegment.index].point.y -= params.dome.height - params.dome.concave; 
    lens.segments[domeSegment.index].point.x -= params.dome.width; 
    lens.segments[domeSegment.index].selected = true;

    var peakSegment = Splitter.closest(lens, "topRight");
    var peakSegment = lens.insert(peakSegment.index + 1, peakSegment.point.clone());
    peakSegment.point.y += params.lens.height - params.dome.height;
    
    if(params.dome.direction < 0) peakSegment.point.y += params.dome.concave * 2; 
    lens.segments[peakSegment.index].handleOut = new paper.Point(- 0.5 * params.dome.width, 0);
    lens.segments[peakSegment.index].selected = true;
    lens.segments[domeSegment.index].handleIn = new paper.Point(0, - 0.5 * params.dome.concave * params.dome.direction);

    // IMAGE PLANE
    if(diffuser == "Planar"){
      // var img_plane = new Path.Line({
      //     parent: result,
      //     name: "IMG: Image Plane",
      //     segments: [new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y) , ramp.bounds.topLeft], 
      //     strokeColor: "green", 
      //     strokeWidth: 1
      // });
      // // img_plane.position.y += 0.5; 
      // img_plane.reverse();
      led_refl = led_ref.clone();
      led_refl.set({
        name: "REF:_0.90", 
        fillColor:  "red",
        parent: result
      });
      led_refl.position.y +=1; // led_refl.bounds.height;
      led_refl.firstSegment.point.x -= 100;
      led_refl.firstSegment.point.y -= 2;
      led_refl.segments[1].point.x -= 100;
      led_refl.segments[1].point.y -= 2;
      var diff = new Path.Line({
          parent: result,
          name: "DIFF:_1.44",
          segments: [new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y) , ramp.bounds.topLeft], 
          strokeColor: "blue", 
          strokeWidth: 1
      });
     
      var img_plane = new Path.Line({
          parent: result,
          name: "IMG: Image Plane",
          segments: [new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y) , ramp.bounds.topLeft], 
          strokeColor: "green", 
          strokeWidth: 1
      });
      img_plane.position.y -= Ruler.mm2pts(4);
      img_plane.reverse();
    }
    if(diffuser == "Hemisphere"){
      var hemis = new Path.Circle({
        parent: result, 
        name: "IMG: Image Plane", 
        radius: Ruler.mm2pts(30), 
        position: new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y), 
        strokeColor: "green", 
        strokeWidth: 1
      });
      hemis.segments[0].handleIn = null;
      hemis.segments[1].handleOut = null;
      hemis.segments[2].remove();
      hemis.segments[2].remove();
      hemis.closed = false;
    }
    if(diffuser == "Cuboid"){
      var cuboid = new Path.Rectangle({
        parent: result, 
        name: "IMG: Image Plane", 
        size: new paper.Size(params.lens.width, Ruler.mm2pts(30)), 
        strokeColor: "green", 
        strokeWidth: 1
      });
      cuboid.set({
        pivot: cuboid.bounds.bottomRight,
        position: new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y), 
      });
      cuboid.segments[3].remove();
      cuboid.closed = false;
    }
   
}
