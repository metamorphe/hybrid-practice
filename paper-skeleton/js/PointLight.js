
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
		rays = _.range(-60, 61, 30);
		rays = _.map(rays, function(theta){
			return scope.emit(source.position, scope.toLocalSpace(theta), 1, "red");
		})
		rays = _.each(rays, function(r){
			return scope.trace(r);
		})
		// this.rays = new paper.Group(rays);
		// this.emit(source.position, this.toLocalSpace(0), 1, "red");
	},
	emit: function(origin, direction, strength, color){
		var strength = strength * 0.1 + 1;
		var rayEnd = new paper.Point(0, -1);
		rayEnd.length = 200;
		rayEnd.angle = direction;

		p = new paper.Path.Line({
			from: origin, 
			to: origin.add(rayEnd),
			strokeColor: color, 
			strokeWidth: strength
		});
		return {
			path: p, 
			strength: strength, 
			direction: direction
		}
	}, 
	trace: function(r){
		hits = PointLight.getIntersections(r, this.options.mediums);
		console.log("RAY", r.direction.toFixed(0), "HIT", hits.length);
		// PointLight.visualizeHits(hits);
		if(hits.length == 0) return null;

		var interface = hits[0];
		r.path.lastSegment.point = interface.point;

		PointLight.visualizeNormal(interface.point, interface.normal, interface.tangent, r);
		
		material = PointLight.detectMaterial(interface);

		if(material.reflect){
			this.reflect(r, interface, material);
		} else{
			this.refract(r, interface, material);
		}
	}, 
	reflect: function(r, interface, material){
		theta0 = PointLight.getIncidentAngle(interface.normal, r);
		this.emit(interface.point, interface.normal.angle - theta1, r.strength * material.reflectance, "green")
	}, 
	refract: function(r, interface, material){
		theta0 = PointLight.getIncidentAngle(interface.normal, r);
		theta_c = PointLight.getCriticalAngle(theta0, 1.00, 1.44);
		if(theta0 > theta_c){
			console.log("CRITICAL", theta_c.toFixed(0));
			return;
		}

		theta1 = PointLight.snell(theta0, material.n1, material.n2);
		this.emit(interface.point, interface.normal.angle + theta1, r.strength * 0.90, "green")
	}
}
PointLight.detectMaterial = function(interface){
	var material = interface.path;
	if(! _.isUndefined(material.reflectance))
		return {reflect: true, reflectance: material.reflectance}
	// go slightly forward
	var forward = interface.normal.clone().multiply(1);
	var fpt = interface.point.clone().add(forward);
	var goingIn = material.contains(fpt);
	// go slightly backward
	var backward = interface.normal.clone().multiply(-1);
	var bpt = interface.point.clone().add(forward);
	var comingOut = material.contains(bpt);
	if(material)

	if(goingIn)
		return {refract: true, n1: 1.00, n2: material.n, refraction: material.refraction, reflectance: 1.0}
	if(comingOut)
		return {refract: true, n1: interface.n, n2: 1.00, refraction: material.refraction, reflectance: 1.0}
}
PointLight.getCriticalAngle = function(theta0, n1, n2){
	return Math.degrees(Math.asin(n2/n1));
}
PointLight.snell = function(theta0, n1, n2){
	theta0 = Math.radians(theta0);
	var coeff = Math.sin(theta0) * (n1/n2);
	return Math.degrees(Math.asin(coeff));
}
PointLight.getIncidentAngle = function(normal, r){
	ray = new paper.Point(-1, 0);
	ray.angle = r.direction;
	theta_i = normal.getDirectedAngle(ray);
	return theta_i;
}

PointLight.visualizeNormal = function(origin, normal, tangent, r){
	normal = normal.clone();
	normal.length = 10;
	new paper.Path.Line({
			from: origin, 
			to: origin.add(normal),
			strokeColor: "black", 
			strokeWidth: 0.5, 
			dashArray: [1, 0.5]
	});
	normal = normal.clone().multiply(-1);
	new paper.Path.Line({
			from: origin, 
			to: origin.add(normal),
			strokeColor: "black", 
			strokeWidth: 0.5, 
	});
	new paper.Path.Line({
			from: origin, 
			to: origin.add(tangent.clone().multiply(10)),
			strokeColor: "#333", 
			strokeWidth: 0.5, 
	});
	new paper.Path.Line({
			from: origin, 
			to: origin.add(tangent.clone().multiply(-10)),
			strokeColor: "#333", 
			strokeWidth: 0.5, 
	});

	var wayward = new paper.Point(0, 1);
	wayward.angle = r.direction;

	new paper.Path.Line({
			from: origin, 
			to: origin.add(wayward.multiply(50)),
			strokeColor: "red", 
			// opacity: 0.5,
			dashArray: [2,2],
			strokeWidth: 0.5
	});
}
PointLight.visualizeHits = function(hits){
	return new paper.Group(
		_.map(hits, function(h, i){
			color = i == 0 ? "red" : "yellow";
			var c = new paper.Path.Circle({
				radius: 2, 
				fillColor: color, 
				position: h.point
			})
			return c;
		})
	);
}

PointLight.getIntersections = function(ray, collection){
	var hits = _.map(collection, function(c){
		return c.getIntersections(ray.path);
	});
	hits = _.compact(hits);
	hits = _.flatten(hits);
	hits = _.reject(hits, function(h){
		return ray.path.firstSegment.point.getDistance(h.point) < 2;
	});
	return _.sortBy(hits, function(h){
		return ray.path.firstSegment.point.getDistance(h.point);
	});
}