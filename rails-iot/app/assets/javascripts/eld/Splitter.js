
function Splitter(){}
Splitter.neighbor = function(params){
  // lens and led are fixed
  params.ramp.a.alpha = normNeighbor(params.ramp.a.alpha);
  params.ramp.a.beta = normNeighbor(params.ramp.a.beta);

  params.ramp.b.alpha = normNeighbor(params.ramp.b.alpha);
  params.ramp.b.beta = normNeighbor(params.ramp.b.beta);

  var ratio = params.prism.height / Ruler.mm2pts(8);
  var nratio = normNeighbor(ratio);  
  params.prism.height = Ruler.mm2pts(8) * nratio;
  params.collimator.height = (Ruler.mm2pts(10) - params.prism.height) / 2.0 * Math.random(); 
  return params;
}

Splitter.random = function(length){
  params = {
    lens: {
      width: length, //domain
      height: Ruler.mm2pts(10)// fixed
    }, 
    collimator: {
      width: Ruler.mm2pts(4), // fixed
      gap: Ruler.mm2pts(1) // fixed, above the LED
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
Splitter.getGradient = function(type, params){
  if(type == "REFL"){
    return Splitter.rampGradient(params);
  }
  if(type == "MOLD")
    return Splitter.moldGradient(params);
  
  if(type == "CONE")
    return Splitter.coneGradient(params);
  paper.view.update();
}

Splitter.moldGradient = function(params){
  lens = CanvasUtil.queryPrefix('LENS')[0];
  var profile = new Path({
    segments:  lens.segments.slice(2, 6), 
    strokeColor: "yellow",
    strokeWidth: 3
  });
  profile.add(lens.bounds.topLeft.clone());
  var stops = Generator.profileToGradient(params, profile);
  return stops;
}
Splitter.coneGradient = function(params){
    lens = CanvasUtil.queryPrefix('LENS')[0]; 
    led_ref = CanvasUtil.queryPrefix('LS')[0];


    var profile = new paper.Path({
      segments: lens.segments.slice(0, 2),
      strokeColor: "yellow",
      strokeWidth: 1
    });
    // profile.add(led_ref.bounds.topCenter.clone());
    // console.log(params);
    stops = Generator.profileToGradient(params, profile, invert=true, offset=0.1); 
    return stops; 
}

Splitter.rampGradient = function(params){
    // REFLECTOR
    ref = CanvasUtil.queryPrefix('REF')[0];
    led_ref = CanvasUtil.queryPrefix('LS')[0];

    var profile = new paper.Path({
      segments: ref.segments.slice(1, 4), 
      strokeColor: "yellow",
      strokeWidth: 1
    });
    profile.add(led_ref.bounds.topCenter.clone());
    profile.reverse();
    
    stops = Generator.profileToGradient(params, profile, invert=false);
    
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

Splitter.makeScene = function(box, params, diffuser){
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
    
    

    ImagePlane.generate(diffuser, led_ref, ramp, result, params);
   
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

Splitter.fabricate = function(params, l){
   lens = CanvasUtil.queryPrefix('LENS')[0];
          ref = CanvasUtil.queryPrefix('REF')[0];
  // MOLD
          var mold_group = new paper.Group({
            name: "MOLD:  Mold ASSEMBLY"
          })
          var mold = paper.Path.Circle({
            name: "FAB: Secondary Optics", 
            radius: Ruler.mm2pts(6.5), 
            position: paper.view.center.add(new paper.Point(0, 40)), 
            fillColor: "black", 
            parent: mold_group
          });
          Splitter.makeWings(mold, mold_group, "white");

          wall = mold.expand({
             strokeAlignment: "exterior", 
             strokeWidth: 0.1,
             strokeOffset: Ruler.mm2pts(MOLD_WALL), 
             fillColor: "white", 
             joinType: "miter", 
             parent: mold_group
          });
        
          mold.bringToFront();

          stops = Splitter.moldGradient(params);
          mold.fillColor = {
            gradient: {
              stops: stops, 
              radial: true
            },
            origin: mold.bounds.center.clone(), 
            destination: mold.bounds.rightCenter.clone()
          };

         
          mold.bringToFront();
         
           bg = new paper.Path.Rectangle({
            rectangle: mold_group.bounds, 
            fillColor: "black", 
            parent: mold_group
          });
          bg.sendToBack();

          console.log("MOLD DIMENSIONS", Ruler.pts2mm(mold_group.bounds.width).toFixed(2), Ruler.pts2mm(mold_group.bounds.height).toFixed(2), Ruler.pts2mm(params.lens.height).toFixed(2));

          // CONE
          var cone_assembly_height = params.prism.height + WING_HEIGHT;
          var cone_assembly = new paper.Group({
            name: "CONE: ASSEMBLY"
          })
          var cone = Path.Circle({
            name: "FAB: Secondary Optics", 
            radius: Ruler.mm2pts(6.5), 
            position: paper.view.center.add(new paper.Point(- this.length * 2,  40)), 
            fillColor: "black",
            parent: cone_assembly 
          });
          var stops = Splitter.coneGradient(params);
         
          cone.fillColor = {
            gradient: {
              stops: stops, 
              radial: true
            },
            origin: cone.bounds.center.clone(), 
            destination: cone.bounds.rightCenter.clone()
          };
          
          Splitter.makeWings(cone, cone_assembly, new paper.Color(WING_HEIGHT / cone_assembly_height));


          cone.bringToFront();
          // cone_assembly.selected = true;
          console.log("CONE DIMENSIONS", Ruler.pts2mm(cone_assembly.bounds.width).toFixed(2), Ruler.pts2mm(cone_assembly.bounds.height).toFixed(2), Ruler.pts2mm(cone_assembly_height.toFixed(2)));

          bg = new paper.Path.Rectangle({
            rectangle: cone_assembly.bounds, 
            fillColor: "black", 
            parent: cone_assembly
          });
          bg.sendToBack();
         

          // REFLECTOR
          var reflector_group = new paper.Group({
            name: "REF_GROUP"
          });
          var reflector = Path.Circle({
            name: "REFL: Secondary Optics", 
            radius: l, 
            position: paper.view.center.add(new paper.Point(this.length * 2,  40)), 
            fillColor: "black", 
            strokeColor: "black", 
            strokeWidth: 1, 
            parent: reflector_group
          })  
          stops = Splitter.rampGradient(params);

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
          // reflector_group.selected =true;
          // reflector_gradient.position = reflector.bounds.center.add(new paper.Point(Ruler.mm2pts(6.5), 0));
}