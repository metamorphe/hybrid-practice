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
	var origin = image_plane.firstSegment.point;
	data = _.map(hits, function(h){
		var pt = h.point.subtract(origin);
		return {x: pt.x, strength: h.path.strength, direction: h.path.direction};
	});

	var range = image_plane.length;
	
	var step = range/bins;

	hist = _.groupBy(data, function(ray){
		return Math.floor(ray.x / step);
	});


	// brdf_association = {}
	// _.each(hist, function(v, k){
	// 	_.each(v, function(ray){ 
	// 		brdf_association[ray.direction] = parseInt(k);
	// 	})
	// });
	// console.log('BRDF', JSON.stringify(brdf_association));


	hist = _.each(hist, function(v, k){
		hist[k] = _.reduce(v, function(sum, ray){ return sum + ray.strength}, 0);
	});

	var signal = [];
	for(var i = 0; i < bins; i+= 1){
		signal[i] = 0;
	}
	for(var i in hist){
		var key = parseInt(i);
		signal[key] = hist[i];
	}
	console.log(signal, _.max(signal));

	console.log(numeric.div(signal, _.max(signal)))
	return numeric.div(signal, _.max(signal));
	
}

ImagePlane.calculateUniformity = function(bins=100){
	var signal = ImagePlane.getSignal(bins);
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
