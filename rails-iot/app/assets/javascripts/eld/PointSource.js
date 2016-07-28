
function PointLight (options) {
	this.options = options;
	this.source = this.init();
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
	toLocalSpace: function(angle){
		return angle - 90;
	},
	emmision: function(){
		var scope = this;
		rays = _.range(-60, 61, 0.5);
		rays = _.map(rays, function(theta){
			// console.log(scope.source.position.toString(), theta);
			return scope.emit(scope.source.position, scope.toLocalSpace(theta), 1, "yellow");
		})

		while(!_.isEmpty(rays)){
			rays = _.map(rays, function(r){
				if(_.isNull(r) || _.isUndefined(r)) return;
				return scope.trace(r);
			})
			rays = _.compact(rays);
		}
	},
	emit: function(origin, direction, strength, color){
		var strength = strength * 0.5 + 0.1;
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
		theta_c = PointLight.getCriticalAngle(theta0, material.n1, material.n2);

		// INTERNAL REFLECTION ACHIEVED
		if(!_.isNaN(theta_c) && Math.abs(theta0) > Math.abs(theta_c) ){
			return this.reflect(r, interface, material, normal);
		}

		// NO TOTAL INTERNAL REFLECTION POSSIBLE
		theta1 = PointLight.snell(theta0, material.n1, material.n2);
		return this.emit(interface.point, normal.angle +  theta1, r.strength * material.refraction, "yellow")
	}
}

PointLight.getReferenceNormal = function(normal, r){
	ray = new paper.Point(-1, 0);
	ray.angle = r.direction;

	normal_f = normal.clone();
	normal_b = normal.clone().multiply(-1);

	theta_f = {theta: normal_f.getDirectedAngle(ray), normal: normal_f}
	theta_b = {theta: normal_b.getDirectedAngle(ray), normal: normal_b}
	return _.min([theta_f, theta_b], function(t){ return Math.abs(t.theta);}).normal;
}
PointLight.detectMaterial = function(interface, normal){
	var material = interface.path;

	if(! _.isUndefined(material.reflectance))
		return {reflect: true, reflectance: material.reflectance}

	// go slightly forward
	normal.length = 0.1;
	var forward = normal.clone().multiply(1);
	var fpt = interface.point.clone().add(forward);
	var goingIn = material.contains(fpt);


	// go slightly backward
	var backward = normal.clone().multiply(-1);
	var bpt = interface.point.clone().add(backward);
	var comingOut = material.contains(bpt);

	if(goingIn) return {refract: true, n1: 1.00, n2: material.n, refraction: material.refraction, reflectance: 1.0}
	if(comingOut) return {refract: true, n1: material.n, n2: 1.00, refraction: material.refraction, reflectance: 1.0}
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
			dashArray: [1, 0.5]
	});
	normal = normal.clone().multiply(-1);
	new paper.Path.Line({
			from: origin, 
			to: origin.add(normal),
			strokeColor: "black", 
			strokeWidth: 0.5
	});
	new paper.Path.Line({
			from: origin, 
			to: origin.add(tangent.clone().multiply(1)),
			strokeColor: "#333", 
			strokeWidth: 0.5
	});
	new paper.Path.Line({
			from: origin, 
			to: origin.add(tangent.clone().multiply(-1)),
			strokeColor: "#333", 
			strokeWidth: 0.5
	});

	var wayward = new paper.Point(0, 1);
	wayward.angle = r.direction;

	new paper.Path.Line({
			from: origin, 
			to: origin.add(wayward.multiply(lineLength * 2)),
			strokeColor: "red", 
			dashArray: [2,1],
			strokeWidth: 0.5
	});
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