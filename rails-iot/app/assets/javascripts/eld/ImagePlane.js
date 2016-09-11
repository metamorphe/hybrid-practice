
function ImagePlane(options){
	var width = Ruler.pts2mm(options.width);

	this.graph = new Graph({
                    name: "Radial Gradient Graph",
                    // position: options.position,
                  	range: options.range,
                    shape: "circle",
                    size: new Size(options.width, options.width ),
                    fillColor: "black"
                });
	// this.graph.plotPoint(new paper.Point(10, 0));
	this.graph.dom.set({
		pivot: this.graph.dom.bounds.bottomRight,
		position: options.position
	});

}

ImagePlane.generate = function(diffuser, led_ref, ramp, result, params){
	bottomReflector = new paper.Path({
      parent: result,
      name: "REF:_0.90", 
      fillColor:  "#ED1C24",
      segments: [ramp.bounds.bottomLeft, ramp.bounds.bottomRight, led_ref.bounds.topLeft, led_ref.bounds.bottomLeft, led_ref.bounds.bottomCenter, led_ref.bounds.bottomCenter.clone().add(new paper.Point(0, 3)), ramp.bounds.bottomLeft.clone().add(new paper.Point(0, 3 + led_ref.bounds.height))]
    })
    
	if(diffuser == "Planar"){
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
       var cuboid = new Path.Rectangle({
        parent: result, 
        name: "DIFF:_1.44", 
        size: new paper.Size(params.lens.width * 2, Ruler.mm2pts(30) * 2), 
        strokeColor: "orange", 
        strokeWidth: 1
      });
      cuboid.set({
        pivot: cuboid.bounds.center,
        position: new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y), 
      });

      var hemis = new paper.Path.Ellipse(cuboid.bounds);

      hemis.set({
        parent: result, 
        strokeColor: "blue", 
        strokeWidth: 1,
        name: "DIFF:_1.44"
      });

      hemis.segments[0].handleIn = null;
      hemis.segments[2].handleOut = null;
      hemis.segments[3].remove();
      hemis.segments[2].remove();
      hemis.closed = false;

       var expanded  = cuboid.expand({
          strokeAlignment: "exterior", 
          strokeWidth: 1,
          name: "IMG: Image Plane",
          strokeOffset: Ruler.mm2pts(4), 
          strokeColor: "green", 
          fillColor: null, 
          joinType: "square", 
          parent: result
      });
        cuboid.remove();

      var hemis = new paper.Path.Ellipse(expanded.bounds);
      hemis.set({
        parent: result, 
        strokeColor: "green", 
        strokeWidth: 1,
        name: "IMG: Image Plane"
      });
      hemis.segments[0].handleIn = null;
      hemis.segments[2].handleOut = null;
      hemis.segments[3].remove();
      hemis.segments[2].remove();
      hemis.closed = false;
      expanded.remove();

      
    }
    if(diffuser == "Cuboid"){
      

      var cuboid = new Path.Rectangle({
        parent: result, 
        name: "DIFF:_1.44", 
        size: new paper.Size(params.lens.width, Ruler.mm2pts(30)), 
        strokeColor: "blue", 
        strokeWidth: 1
      });
      cuboid.set({
        pivot: cuboid.bounds.bottomRight,
        position: new paper.Point(led_ref.bounds.topCenter.x, ramp.bounds.topRight.y), 
      });

      

      var expanded  = cuboid.expand({
          strokeAlignment: "exterior", 
          strokeWidth: 1,
          name: "IMG: Image Plane",
          strokeOffset: Ruler.mm2pts(4), 
          strokeColor: "green", 
          fillColor: null, 
          joinType: "miter", 
          parent: result, 
          closed: false
      });
      cuboid.segments[3].remove();
      expanded.removeSegments(0, expanded.segments.length - 4)

      cuboid.closed = false;
    }
}

ImagePlane.prototype = {

	visualize: function(){
		var scope = this;
		rays = CanvasUtil.queryPrefix("RAY");
		image_plane = CanvasUtil.queryPrefix("IMG");

		// console.log("RAYS:", rays.length);
		if(_.isEmpty(image_plane)) return;
		image_plane = image_plane[0];

		hits = CanvasUtil.getIntersections(image_plane, rays);
		// console.log("HITS:", hits.length);

		var origin = image_plane.lastSegment.point;
		data = _.map(hits, function(h){
			var pt = h.point.subtract(origin);
			// pt = pt.divide(new paper.Point(image_plane.bounds.width, 1));
			// pt = pt.multiply(new paper.Point(image_plane.bounds.width, 1));
			// pt = pt.add(new paper.Point(-image_plane.bounds.width/2, 0));
			return pt;
		});
		// console.log(_.map(data, function(d){ return d.toString();}));
		// scope.graph.plotPoint(data[0]);
		// console.log(data[0])
		pts = _.map(data, function(pt){
			return scope.graph.plotPoint(pt, {fillColor: "white"});
		});

		line_result = new paper.Group({
			children: pts,
			pivot: scope.graph.unmapPoint(new paper.Point(0, 0))
		});

		return line_result;
	},
	visualizeWheel: function(){
		line_result = this.visualize();

		theta = _.range(-180, 180, 1);
		_.each(theta, function(t){
			lr = line_result.clone();
			lr.rotation = t;
		});
	},
	visualizeAt: function(orientation){
		line_result = this.visualize();
		lr.rotation = orientation;
		return this;
	}
}
ImagePlane.visualizeHits = function(hits){
	return new paper.Group(
		_.map(hits, function(h, i){
			var c = new paper.Path.Circle({
				radius: 0.1,
				fillColor: "orange",
				position: h.point
			})
			return c;
		})
	);
}
ImagePlane.getSignal = function(bins=100){
	rays = CanvasUtil.queryPrefix("RAY");
	image_plane = CanvasUtil.queryPrefix("IMG");

	if(_.isEmpty(image_plane)) return;
	image_plane = image_plane[0];

	hits = CanvasUtil.getIntersections(image_plane, rays);
	n = hits.length;
	var origin = image_plane.firstSegment.point;

	data = _.map(hits, function(h){
		// var pt = h.point.subtract(origin); // planar surface
		var pt = image_plane.getNearestPoint(h.point);
		var offset = image_plane.getOffsetOf(pt);
		var rel_pos = offset;
		// console.log(h.path.strength);
		return {x: rel_pos, strength: h.path.strength, direction: h.path.direction};
	});

	var range = image_plane.length;
	
	var step = range/bins;

	hist = _.groupBy(data, function(ray){
		return Math.floor(ray.x / step);
	});

	// console.log("STEP", step, "RANGE", range, "BINS", bins);
	// brdf_association = {}
	// _.each(hist, function(v, k){
	// 	_.each(v, function(ray){ 
	// 		console.log(ray.direction, ray.x, parseInt(k));
	// 		brdf_association[ray.direction] = parseInt(k);
	// 	})
	// });
	// console.log('BRDF', JSON.stringify(brdf_association));


	hist = _.each(hist, function(v, k){
		hist[k] = _.reduce(v, function(sum, ray){ return sum + ray.strength}, 0);
	});
	// console.log(hist);
	var signal = [];
	for(var i = 0; i < bins; i+= 1){
		signal[i] = 0;
	}
	for(var i in hist){
		var key = parseInt(i);
		signal[key] = hist[i];
	}
	return {signal: numeric.div(signal, _.max(signal) + 0.01), hits: n};
	
}
ImagePlane.calculateNormality = function(visualize=false){
	rays = CanvasUtil.queryPrefix("RAY");
	image_plane = CanvasUtil.queryPrefix("IMG");

	if(_.isEmpty(image_plane)) return 0;
	image_plane = image_plane[0];

	hits = CanvasUtil.getIntersections(image_plane, rays);
	if(hits.length == 0) return 0;

	sum = _.reduce(hits, function(sum, hit){
		// console.log("ANG", hit.path.lastSegment.point.angle);
		var offset = image_plane.getOffsetOf(hit.point);
		var normal = image_plane.getNormalAt(offset);
		
		normal.length = 30;
		if(visualize){
			var c = new paper.Path.Line({
				from: hit.point, 
				to: hit.point.add(normal), 
				strokeColor: "purple", 
				strokeWidth: 0.5, 
				name: "DRAY: Desired Ray"
			});
		}
		test = hit.path.lastSegment.point.subtract(hit.point);
		return sum + (Math.abs(normal.angle - test.angle) % 180);
	}, 0);	
	// console.log(sum, hits.length)

	sum /= hits.length;
	// NORMALIZE AND INVERT
	norm = sum / 90;
	invert = 1 - norm;
	
	return invert * (hits.length / rays.length);
}
ImagePlane.calculateEnergy = function(bins=100){
	var data = ImagePlane.getSignal(bins);
	var signal = data.signal;
	return _.reduce(signal, function(memo, s){ return memo + s}, 0)/ 50;
}

ImagePlane.calculateUniformity = function(bins=100){
	var data = ImagePlane.getSignal(bins);
	var signal = data.signal;
	// console.log(signal);
	// CAP
	for(var i = 0; i < bins; i += 1){
		signal[i] = signal[i] > 0 ?  1 : 0;
	}
	hits = _.reduce(signal, function(sum, v){
		return sum + v;
	}, 0);
	var area = hits/bins;
	return area;
}
