
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};


function PointLight (options) {
	this.options = options;
	this.source = this.init();
	this.emmision();
}
PointLight.prototype = {
	init: function() {
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
	emmision: function(start=-60, end=61, step=1){
		var scope = this;
		rays = _.range(start, end, step);
		rays = _.map(rays, function(theta){
			return scope.emit(source.position, scope.toLocalSpace(theta), 1, "red");
		})
		rays = _.map(rays, function(r){
			return scope.trace(r);
		})

		while(rays.length > 0){
			rays = _.map(rays, function(r){
				// console.log(r);
				if(_.isNull(r) || _.isUndefined(r)) return;
				return scope.trace(r);
			})
			rays = _.compact(rays);
		}
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
		// console.log("RAY", r.direction.toFixed(0), "HIT", hits.length);
		// PointLight.visualizeHits(hits);
		if(hits.length == 0) return null;

		var interface = hits[0];
		r.path.lastSegment.point = interface.point;

		ref_normal = PointLight.getReferenceNormal(interface.normal, r);
		// console.log("REF", ref_normal.angle)

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
		return this.emit(interface.point, back_normal.angle - theta0, r.strength * material.reflectance, "green");
	}, 
	refract: function(r, interface, material, normal){
		theta0 = PointLight.getIncidentAngle(normal, r);
		// console.log(theta0);
		theta_c = PointLight.getCriticalAngle(theta0, material.n1, material.n2);
		// console.log(theta0, theta_c, _.isNaN(theta_c));
		
		if(!_.isNaN(theta_c) && Math.abs(theta0) > Math.abs(theta_c) ){
			console.log("CRITICAL", Math.abs(theta0).toFixed(0), theta_c.toFixed(0));
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
		return this.emit(interface.point, normal.angle + flip * theta1, r.strength * 0.90, "green")


		

		
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
	return normal.getDirectedAngle(ray)

	// normal_f = normal.clone();
	// normal_b = normal.clone().multiply(-1);


	// theta_f = {theta: normal_f.getDirectedAngle(ray), normal: normal_f}
	// theta_b = {theta: normal_b.getDirectedAngle(ray), normal: normal_b}
	// console.log("B", theta_b.theta.toFixed(0), theta_b.normal.angle.toFixed(0), "F", theta_f.theta.toFixed(0), theta_f.normal.angle.toFixed(0))
	// // if(Math.abs(theta_i) > 90) theta_i = - (180 + theta_i) % 180;
	// return _.min([theta_f, theta_b], function(t){ return Math.abs(t.theta);})
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