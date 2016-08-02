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
	this.graph.plotPoint(new paper.Point(10, 0));
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

		console.log("RAYS:", rays.length);
		if(_.isEmpty(image_plane)) return;
		image_plane = image_plane[0];

		hits = CanvasUtil.getIntersections(image_plane, rays);
		console.log("HITS:", hits.length);
		
		var origin = image_plane.firstSegment.point;
		data = _.map(hits, function(h){
			var pt = h.point.subtract(origin);
			pt = pt.divide(new paper.Point(image_plane.bounds.width, 1));
			pt = pt.multiply(new paper.Point(30, 1));
			pt = pt.add(new paper.Point(-15, 0));
			return pt;
		});
		scope.graph.plotPoint(new paper.Point(0, 0));
		
		pts = _.map(data, function(pt){
			return scope.graph.plotPoint(pt, {fillColor: "white"});
		});

		line_result = new paper.Group({
			children: pts, 
			pivot: scope.graph.unmapPoint(new paper.Point(0, 0))
		});

		theta = _.range(-180, 180, 1);

		_.each(theta, function(t){
			lr = line_result.clone();
			lr.rotation = t;
		})
		
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
