
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};


function PointLight (options) {
	this.options = options;
	// this.rays = new paper.Group();
	this.source = this.init();
	this.emmision();
	this.visualize();

}
PointLight.prototype = {
	init: function(argument) {
		source = new paper.Path.Rectangle({
			size: new paper.Size(Ruler.mm2pts(5), Ruler.mm2pts(1.4)), 
			position: this.options.position,
			fillColor: "white", 
			strokeColor: "#333", 
			strokeWidth: 1
		});
		return source;
	}, 
	// remove: function(){
	// 	this.rays.remove();
	// },
	toLocalSpace: function(angle){
		return angle - 90;
	},
	emmision: function(){
		var scope = this;
		// this.remove();
		rays = _.range(-60, 61, 1);
		// rays = _.range(0, 1, 1);
		rays = _.map(rays, function(theta){
			return scope.emit(source.position, scope.toLocalSpace(theta), 1, "yellow");
		})

		while(!_.isEmpty(rays)){
			rays = _.map(rays, function(r){
				if(_.isNull(r) || _.isUndefined(r)) return;
				return scope.trace(r);
			})
			rays = _.compact(rays);
		}
	},
	visualize: function(){
		rays = CanvasUtil.queryPrefix("RAY");
		image_plane = CanvasUtil.queryPrefix("IMG");
		console.log("RAYS:", rays.length);
		if(_.isEmpty(image_plane)) return;
		image_plane = image_plane[0];

		hits = CanvasUtil.getIntersections(image_plane, rays);
		console.log("HITS:", hits.length);
		PointLight.visualizeHits(hits);
		var origin = image_plane.firstSegment.point;
		data = _.map(hits, function(h){
			var pt = h.point.subtract(origin);
			pt = pt.divide(new paper.Point(image_plane.bounds.width, 1));
			pt = pt.multiply(new paper.Point(30, 1));
			pt = pt.add(new paper.Point(-15, 0));
			return pt;
		});

		// console.log(data)
		// console.log(image_plane.bounds.leftCenter, group.parentToLocal(image_plane.bounds.leftCenter.clone());

		// MAKE RESULT RECT
		size = image_plane.bounds.clone();
		size.height = size.width = size.width / 4.0; 
		position = paper.view.bounds.rightCenter.clone().subtract(size.width/2.0).subtract(new paper.Point(5, 0));


		myGraph = new Graph({
                    name: "Radial Gradient Graph",
                    position: position,
                    // range: {x: {identity: "x", min: 0, max: Ruler.mm2pts(size.width)}, y: {identity: "y", min: 0, max:  Ruler.mm2pts(size.width)}},
                    range: {x: {identity: "x", min: -15, max: 15}, y: {identity: "y", min: -15, max:  15}},
                    shape: "circle", 
                    size: new Size(25, 25)
                });
		pts = _.map(data, function(pt){
			return myGraph.plotPoint(pt);
		});

		line_result = new paper.Group({
			children: pts, 
			pivot: myGraph.unmapPoint(new paper.Point(0, 0))
		});
		theta = _.range(-180, 180, 1);
		_.each(theta, function(t){
			lr = line_result.clone();
			lr.rotation = t;
		})
		

	},
	emit: function(origin, direction, strength, color){
		var strength = strength * 0.1 + 1;
		var rayEnd = new paper.Point(0, -1);
		rayEnd.length = 200;
		rayEnd.angle = direction;

		p = new paper.Path.Line({
			name: "RAY: Ray of Light!",
			from: origin, 
			to: origin.add(rayEnd),
			strokeColor: color, 
			strokeWidth: strength, 
			strokeScaling: false
		});
		return {
			path: p, 
			strength: strength, 
			direction: direction
		}
	}, 
	trace: function(r){
		hits = PointLight.getIntersections(r, this.options.mediums);
		// console.log("RAY", r.direction.toFixed(0), "HIT", hits.length);
		if(hits.length == 0) return null;

		var interface = hits[0];
		r.path.lastSegment.point = interface.point;

		ref_normal = PointLight.getReferenceNormal(interface.normal, r);

		// PointLight.visualizeNormal(interface.point, ref_normal, interface.tangent, r);
		
		material = PointLight.detectMaterial(interface, ref_normal);
		if(material.reflect){
			return this.reflect(r, interface, material, ref_normal);
		} else if(material.refract){
			return this.refract(r, interface, material, ref_normal);
		}
	}, 
	reflect: function(r, interface, material, normal){
		theta0 = PointLight.getIncidentAngle(normal, r);
		back_normal = normal.clone().multiply(-1);
		return this.emit(interface.point, back_normal.angle - theta0, r.strength * material.reflectance, "yellow");
	}, 
	refract: function(r, interface, material, normal){
		theta0 = PointLight.getIncidentAngle(normal, r);
		// console.log(theta0);
		theta_c = PointLight.getCriticalAngle(theta0, material.n1, material.n2);
		// console.log(theta0, theta_c, _.isNaN(theta_c));
		
		if(!_.isNaN(theta_c) && Math.abs(theta0) > Math.abs(theta_c) ){
			// console.log("CRITICAL", Math.abs(theta0).toFixed(0), theta_c.toFixed(0));
			return this.reflect(r, interface, material, normal);
		}

		// NO TOTAL INTERNAL REFLECTION POSSIBLE

		theta1 = PointLight.snell(theta0, material.n1, material.n2);
		// console.log("T", theta0.toFixed(0), theta1.toFixed(0), material)
		flip = 1;
		// if(interface.normal.angle != normal.angle){ 
		// 	console.log("flipped");
		// 	flip = -1;
		// }
		return this.emit(interface.point, normal.angle + flip * theta1, r.strength * 0.90, "yellow")


		

		
		// return console.log("SNELL", theta0.toFixed(0), "-->", theta1.toFixed(0));
	}
}
PointLight.getReferenceNormal = function(normal, r){
	ray = new paper.Point(-1, 0);
	ray.angle = r.direction;

	normal_f = normal.clone();
	normal_b = normal.clone().multiply(-1);

	theta_f = {theta: normal_f.getDirectedAngle(ray), normal: normal_f}
	theta_b = {theta: normal_b.getDirectedAngle(ray), normal: normal_b}
	// console.log(theta_f, theta_b)
	// console.log("B", theta_b.theta.toFixed(0), theta_b.normal.angle.toFixed(0), "F", theta_f.theta.toFixed(0), theta_f.normal.angle.toFixed(0))
	// if(Math.abs(theta_i) > 90) theta_i = - (180 + theta_i) % 180;
	return _.min([theta_f, theta_b], function(t){ return Math.abs(t.theta);}).normal;
}
PointLight.detectMaterial = function(interface, normal){
	var material = interface.path;

	if(! _.isUndefined(material.reflectance))
		return {reflect: true, reflectance: material.reflectance}


	// go slightly forward
	normal.length = 1;
	var forward = normal.clone().multiply(1);
	var fpt = interface.point.clone().add(forward);
	var goingIn = material.contains(fpt);


	// go slightly backward
	var backward = normal.clone().multiply(-1);
	var bpt = interface.point.clone().add(backward);
	var comingOut = material.contains(bpt);

	// console.log(goingIn);
	if(goingIn)
		return {refract: true, n1: 1.00, n2: material.n, refraction: material.refraction, reflectance: 1.0}
	if(comingOut)
		return {refract: true, n1: material.n, n2: 1.00, refraction: material.refraction, reflectance: 1.0}
	return {reflect: false, refract: false}
}
PointLight.getCriticalAngle = function(theta0, n1, n2){
	coeff = n2/n1;
	return Math.degrees(Math.asin(coeff));
}
PointLight.snell = function(theta0, n1, n2){
	theta0 = Math.radians(theta0);
	var coeff = Math.sin(theta0) * (n1/n2);
	return Math.degrees(Math.asin(coeff));
}
PointLight.getIncidentAngle = function(normal, r){
	ray = new paper.Point(-1, 0);
	ray.angle = r.direction;
	return normal.getDirectedAngle(ray);
}

PointLight.visualizeNormal = function(origin, normal, tangent, r){
	var lineLength = 5;
	normal = normal.clone();
	tangent = tangent.clone();
	normal.length = lineLength;
	tangent.length = lineLength;
	new paper.Path.Line({
			from: origin, 
			to: origin.add(normal),
			strokeColor: "black", 
			strokeWidth: 0.5, 
			dashArray: [1, 0.5],
			// strokeScaling: false
	});
	normal = normal.clone().multiply(-1);
	new paper.Path.Line({
			from: origin, 
			to: origin.add(normal),
			strokeColor: "black", 
			strokeWidth: 0.5,
			// strokeScaling: false 
	});
	new paper.Path.Line({
			from: origin, 
			to: origin.add(tangent.clone().multiply(1)),
			strokeColor: "#333", 
			strokeWidth: 0.5,
			// strokeScaling: false 
	});
	new paper.Path.Line({
			from: origin, 
			to: origin.add(tangent.clone().multiply(-1)),
			strokeColor: "#333", 
			strokeWidth: 0.5,
			// strokeScaling: false 
	});

	var wayward = new paper.Point(0, 1);
	wayward.angle = r.direction;

	new paper.Path.Line({
			from: origin, 
			to: origin.add(wayward.multiply(lineLength * 2)),
			strokeColor: "red", 
			// opacity: 0.5,
			dashArray: [2,1],
			strokeWidth: 0.5
	});
}
PointLight.visualizeHits = function(hits){
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

PointLight.getIntersections = function(ray, collection){
	hits = CanvasUtil.getIntersections(ray.path, collection);
	hits = _.reject(hits, function(h){
		return ray.path.firstSegment.point.getDistance(h.point) < 1;
	});
	return _.sortBy(hits, function(h){
		return ray.path.firstSegment.point.getDistance(h.point);
	});
}