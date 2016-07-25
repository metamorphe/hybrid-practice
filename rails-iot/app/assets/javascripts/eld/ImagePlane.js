function ImagePlane(){
	position = paper.view.bounds.rightCenter.clone().subtract(40).subtract(new paper.Point(5, 0));

	var width = 30;
	this.graph = new Graph({
                    name: "Radial Gradient Graph",
                    position: position,
                    range: {x: {identity: "x", min: -width/2.0, max: width/2.0}, y: {identity: "y", min: -width/2.0, max:  width/2.0}},
                    shape: "circle", 
                    size: new Size(40, 40),
                    fillColor: "black"
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
