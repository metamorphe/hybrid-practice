
function noLens(){}
noLens.random = function(length){
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
      width: 1, 
      height: Ruler.mm2pts(10)// fixed
    }
  }
  return params;
}

noLens.getOptimal = function(ws, key){
  var length = key.split("_")[2];
  return noLens.random(l);
}
noLens.fabricate = function(params, l){
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
      stops = noLens.rampGradient(params);

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
noLens.rampGradient = function(params){
    // REFLECTOR
    console.log("NO LENS FAB")
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

noLens.makeScene = function(box, params, diffuser){
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
    // console.log(params);
    var ramp = new Path.Rectangle({
        size: new paper.Size(params.ramp.width, params.lens.height),
        fillColor: "#ED1C24", 
        parent: result
    });
    ramp.set({
        name: "REF:_0.90",
        pivot: ramp.bounds.bottomRight.clone(),
        position: led_ref.bounds.bottomLeft.clone().add(new paper.Point(- params.lens.width + (params.led.width/2), 0))
    });

    // IMAGE PLANE

    // IMAGE PLANE
    if(diffuser == "Planar"){
      led_refl = led_ref.clone();
      led_refl.set({
        name: "REF:_0.20", 
        fillColor:  "red",
        parent: result
      })
      led_refl.position.y += led_refl.bounds.height;
      led_refl.firstSegment.point.x = ramp.bounds.bottomLeft.x;
      led_refl.segments[1].point.x = ramp.bounds.bottomLeft.x;
      // point.x = ramp.bounds.bottomLeft.clone();

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
          segments: [ramp.bounds.topRight, new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y)], 
          strokeColor: "green", 
          strokeWidth: 1
      });
      img_plane.position.y -= Ruler.mm2pts(4);
      // img_plane.reverse();
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
