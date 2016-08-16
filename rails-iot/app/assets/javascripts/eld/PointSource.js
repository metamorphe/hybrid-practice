// RAILS VERSION
var angle_to_bin = {"0":15,"1":15,"2":15,"3":15,"4":15,"5":15,"6":15,"7":15,"8":15,"9":15,"10":15,"11":15,"12":15,"13":15,"14":15,"15":15,"16":16,"17":16,"18":16,"19":16,"20":16,"21":16,"22":16,"23":16,"24":16,"25":16,"26":16,"27":16,"28":16,"29":16,"30":17,"31":17,"32":17,"33":17,"34":17,"35":17,"36":17,"37":17,"38":17,"39":17,"40":17,"41":17,"42":18,"43":18,"44":18,"45":18,"46":18,"47":18,"48":18,"49":18,"50":18,"51":19,"52":19,"53":19,"54":19,"55":19,"56":19,"57":20,"58":20,"59":20,"-60":9,"-59.5":9,"-59":9,"-58.5":9,"-58":9,"-57.5":9,"-57":10,"-56.5":10,"-56":10,"-55.5":10,"-55":10,"-54.5":10,"-54":10,"-53.5":10,"-53":10,"-52.5":10,"-52":10,"-51.5":10,"-51":10,"-50.5":11,"-50":11,"-49.5":11,"-49":11,"-48.5":11,"-48":11,"-47.5":11,"-47":11,"-46.5":11,"-46":11,"-45.5":11,"-45":11,"-44.5":11,"-44":11,"-43.5":11,"-43":11,"-42.5":11,"-42":12,"-41.5":12,"-41":12,"-40.5":12,"-40":12,"-39.5":12,"-39":12,"-38.5":12,"-38":12,"-37.5":12,"-37":12,"-36.5":12,"-36":12,"-35.5":12,"-35":12,"-34.5":12,"-34":12,"-33.5":12,"-33":12,"-32.5":12,"-32":12,"-31.5":12,"-31":12,"-30.5":13,"-30":13,"-29.5":13,"-29":13,"-28.5":13,"-28":13,"-27.5":13,"-27":13,"-26.5":13,"-26":13,"-25.5":13,"-25":13,"-24.5":13,"-24":13,"-23.5":13,"-23":13,"-22.5":13,"-22":13,"-21.5":13,"-21":13,"-20.5":13,"-20":13,"-19.5":13,"-19":13,"-18.5":13,"-18":13,"-17.5":13,"-17":13,"-16.5":14,"-16":14,"-15.5":14,"-15":14,"-14.5":14,"-14":14,"-13.5":14,"-13":14,"-12.5":14,"-12":14,"-11.5":14,"-11":14,"-10.5":14,"-10":14,"-9.5":14,"-9":14,"-8.5":14,"-8":14,"-7.5":14,"-7":14,"-6.5":14,"-6":14,"-5.5":14,"-5":14,"-4.5":14,"-4":14,"-3.5":14,"-3":14,"-2.5":14,"-2":14,"-1.5":14,"-1":14,"-0.5":15,"0.5":15,"1.5":15,"2.5":15,"3.5":15,"4.5":15,"5.5":15,"6.5":15,"7.5":15,"8.5":15,"9.5":15,"10.5":15,"11.5":15,"12.5":15,"13.5":15,"14.5":15,"15.5":15,"16.5":16,"17.5":16,"18.5":16,"19.5":16,"20.5":16,"21.5":16,"22.5":16,"23.5":16,"24.5":16,"25.5":16,"26.5":16,"27.5":16,"28.5":16,"29.5":16,"30.5":17,"31.5":17,"32.5":17,"33.5":17,"34.5":17,"35.5":17,"36.5":17,"37.5":17,"38.5":17,"39.5":17,"40.5":17,"41.5":18,"42.5":18,"43.5":18,"44.5":18,"45.5":18,"46.5":18,"47.5":18,"48.5":18,"49.5":18,"50.5":19,"51.5":19,"52.5":19,"53.5":19,"54.5":19,"55.5":19,"56.5":19,"57.5":20,"58.5":20,"59.5":20}
function PointLight (options) {
	this.options = options;
	this.source = this.init();
	this.parent = options.parent;
}
PointLight.prototype = {
	init: function(argument) {
		source = new paper.Path.Rectangle({
			name: "PL: Point Light",
			size: new paper.Size(Ruler.mm2pts(5), Ruler.mm2pts(1.4)), 
			fillColor: "white", 
			strokeColor: "#333", 
			strokeWidth: 1
		});
		source.set({
			pivot: source.bounds.topCenter,
			position: this.options.position
		})
		return source;
	}, 
	toLocalSpace: function(angle){
		return angle - 90;
	},
	toOtherSpace: function(angle){
		return angle + 90;
	},
	brdf: function(theta){
		ibrdf = [ 0.99758409,  1.00262563,  0.99710179,  1.00326137,  0.99623861,  1.00448284, 
				 0.99440298,  1.00750419,  0.9886242,   1.02231681,  0.88914691,  0.39715566,
				 0.26767194,  0.19362431,  0.16863528,  0.14190512,  0.14508922,  0.14484397,
				 0.1702351 ,  0.21546385,  0.31116617,  0.48959189,  0.74914963,  0.90289915,
				 0.91303581,  0.89913619,  0.92488742,  0.96876715,  0.97801496,  0.86313787,
				 0.66156262,  0.50889306,  0.39771166,  0.30637959,  0.25547046,  0.23899432,
				 0.24002481,  0.26022431,  0.30976089,  0.51313837,  0.96759301,  1.00246528,
				 1.00058041,  0.99865814,  1.00161796,  0.99824739,  1.00184367,  0.9980743,
				 1.00201503,  0.99787902,  1.00225174]
		// console.log(ibrdf[angle_to_bin[theta] + 1]);
		// return ibrdf[angle_to_bin[theta] + 1];
		return 1;
	},
	emmision: function(start=-60, end=61, step=0.5){
		var scope = this;
		rays = _.range(start, end, step);
		rays = _.map(rays, function(theta){
			return scope.emit(scope.source.position, scope.toLocalSpace(theta), scope.brdf(theta), "yellow", theta);
		})
		count = 0;
		while(!_.isEmpty(rays)){
			rays = _.map(rays, function(r){
				if(_.isNull(r) || _.isUndefined(r)) return;
				return scope.trace(r, false);
			})
			rays = _.compact(rays);
			count ++;
			// console.log("RAY TRACE:", count, rays.length)
			if(count > 30) break;
		}
	},
	emit: function(origin, direction, strength, color, original_angle){
		var sW = strength * 0.5 + 0.1;
		var rayEnd = new paper.Point(0, -1);
		rayEnd.length = 10000;
		rayEnd.angle = direction;
		p = new paper.Path.Line({
			name: "RAY: Ray of Light!",
			from: origin, 
			to: origin.add(rayEnd),
			strokeColor: color, 
			strokeWidth: sW,
			strength: strength, 
			strokeScaling: false,
			direction: original_angle
		});

		// np = p.getIntersections(this.parent);
		// if(np.length > 0)
		// p.lastSegment.point = np[0].point;

		return {
			path: p, 
			strength: strength, 
			direction: direction
		}
	}, 
	trace: function(r, viz){
		hits = PointLight.getIntersections(r, this.options.mediums);
		if(viz)
			PointLight.visualizeHits(hits);

		if(hits.length == 0) return null;
		var interface = hits[0];
		if(!interface.normal) return null;

		r.path.lastSegment.point = interface.point;

		ref_normal = PointLight.getReferenceNormal(interface.normal, r);

		// PointLight.visualizeNormal(interface.point, ref_normal, interface.tangent, r);
		
		material = PointLight.detectMaterial(interface, ref_normal, this.options.mediums);
		if(viz) console.log(material);
		if(material.reflect){
			return this.reflect(r, interface, material, ref_normal);
		} else if(material.refract){
			return this.refract(r, interface, material, ref_normal);
		}
	}, 
	reflect: function(r, interface, material, normal){
		theta0 = PointLight.getIncidentAngle(normal, r);
		back_normal = normal.clone().multiply(-1);
		return this.emit(interface.point, back_normal.angle - theta0, r.strength * material.reflectance, "yellow", r.path.direction);
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
		return this.emit(interface.point, normal.angle +  theta1, r.strength * material.refraction, "yellow", r.path.direction)
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
PointLight.detectMaterial = function(interface, normal, mediums){
	var material = interface.path;
	// console.log(interface.path);

	if(! _.isUndefined(material.reflectance))
		return {reflect: true, reflectance: material.reflectance}

	// go slightly forward
	normal.length = 1;
	var forward = normal.clone().multiply(1);
	var fpt = interface.point.clone().add(forward);
	var backward = normal.clone().multiply(-1);
	var bpt = interface.point.clone().add(backward);

	var goingIn = material.contains(fpt);
	var other = goingIn ? bpt : fpt;	
	other = _.filter(mediums, function(m){
		return m.contains(other);
	});
	

	if(other.length == 0) other = [{n: 1.00}]
	other = other[0];
	
	
	if(!_.isUndefined(other.reflectance)) 
		return {reflect: true, refract: false, reflectance: other.reflectance}

	if(goingIn) return {refract: true, n1: other.n, n2: material.n, refraction: material.refraction, reflectance: 1.0}
	else return {refract: true, n1: material.n, n2: other.n, refraction: material.refraction, reflectance: 1.0}
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


PointLight.visualizeHits = function(hits){
	return new paper.Group(
		_.map(hits, function(h, i){
			var c = new paper.Path.Circle({
				radius: 2, 
				fillColor: "orange", 
				position: h.point
			})
			return c;
		})
	);
}

PointLight.getIntersections = function(ray, collection){
	hits = CanvasUtil.getIntersections(ray.path, collection);
	// console.log("ORIGINAL HITS", hits.length)
	hits = _.reject(hits, function(h){
		return ray.path.firstSegment.point.getDistance(h.point) <= 1;
	});
	// console.log("REFINED HITS", hits.length)
	return _.sortBy(hits, function(h){
		return ray.path.firstSegment.point.getDistance(h.point);
	});
}