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

ImagePlane.calculateUniformity = function(){
	rays = CanvasUtil.queryPrefix("RAY");
	image_plane = CanvasUtil.queryPrefix("IMG");

	if(_.isEmpty(image_plane)) return;
	image_plane = image_plane[0];

	hits = CanvasUtil.getIntersections(image_plane, rays);
	
	var origin = image_plane.lastSegment.point;
	data = _.map(hits, function(h){
		var pt = h.point.subtract(origin);
		return pt.x;
	});
	min = _.min(data);
	data = _.map(data, function(x){
		x -= min;
		return x;
	});

	var range = _.max(data);
	var bins = 100;
	var step = range/bins;

	hist = _.groupBy(data, function(x){
		return Math.floor(x / step);
	});
	
	hist = _.each(hist, function(v, k){
		hist[k] = v.length;
	});
	var signal = [];


	for(var i = 0; i < bins; i+= 1){
		signal[i] = _.isUndefined(hist[i]) ?  0 : hist[i];
	}
	// clamp
	for(var i = 0; i < bins; i+= 1){
		signal[i] = _.isUndefined(hist[i]) ?  0 : 1;
	}
	// console.log(signal.join(","))
	hits = _.reduce(signal, function(sum, v){
		return sum + v;
	}, 0);
	area = hits/bins;

	// var switches = 0;
	// var lastVal = signal[i];
	// var sparse = [];
	// for(var i = 1; i < bins; i+= 1){
	// 	if(signal[i] != lastVal) sparse.push(signal[i]);
	// 	lastVal = signal[i];
	// }

	// console.log(JSON.stringify(signal), JSON.stringify(sparse));
	return area;
}
