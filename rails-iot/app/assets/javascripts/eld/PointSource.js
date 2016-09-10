// RAILS VERSION
const WAVE_ENERGY = 60;
const ENERGY_DEATH = 0.04; // when a ray's energy gets below value, it is no longer rendered;

var angle_to_bin = {"0":25,"1":25,"2":25,"3":25,"4":25,"5":25,"6":25,"7":25,"8":25,"9":25,"10":26,"11":26,"12":26,"13":26,"14":26,"15":26,"16":26,"17":26,"18":26,"19":27,"20":27,"21":27,"22":27,"23":27,"24":27,"25":27,"26":27,"27":27,"28":28,"29":28,"30":28,"31":28,"32":28,"33":28,"34":28,"35":29,"36":29,"37":29,"38":29,"39":29,"40":29,"41":29,"42":30,"43":30,"44":30,"45":30,"46":30,"47":30,"48":31,"49":31,"50":31,"51":31,"52":32,"53":32,"54":32,"55":32,"56":33,"57":33,"58":33,"59":33,"-60":15,"-59.5":15,"-59":16,"-58.5":16,"-58":16,"-57.5":16,"-57":16,"-56.5":16,"-56":16,"-55.5":17,"-55":17,"-54.5":17,"-54":17,"-53.5":17,"-53":17,"-52.5":17,"-52":18,"-51.5":18,"-51":18,"-50.5":18,"-50":18,"-49.5":18,"-49":18,"-48.5":18,"-48":18,"-47.5":18,"-47":19,"-46.5":19,"-46":19,"-45.5":19,"-45":19,"-44.5":19,"-44":19,"-43.5":19,"-43":19,"-42.5":19,"-42":19,"-41.5":20,"-41":20,"-40.5":20,"-40":20,"-39.5":20,"-39":20,"-38.5":20,"-38":20,"-37.5":20,"-37":20,"-36.5":20,"-36":20,"-35.5":20,"-35":21,"-34.5":21,"-34":21,"-33.5":21,"-33":21,"-32.5":21,"-32":21,"-31.5":21,"-31":21,"-30.5":21,"-30":21,"-29.5":21,"-29":21,"-28.5":21,"-28":21,"-27.5":22,"-27":22,"-26.5":22,"-26":22,"-25.5":22,"-25":22,"-24.5":22,"-24":22,"-23.5":22,"-23":22,"-22.5":22,"-22":22,"-21.5":22,"-21":22,"-20.5":22,"-20":22,"-19.5":22,"-19":23,"-18.5":23,"-18":23,"-17.5":23,"-17":23,"-16.5":23,"-16":23,"-15.5":23,"-15":23,"-14.5":23,"-14":23,"-13.5":23,"-13":23,"-12.5":23,"-12":23,"-11.5":23,"-11":23,"-10.5":23,"-10":24,"-9.5":24,"-9":24,"-8.5":24,"-8":24,"-7.5":24,"-7":24,"-6.5":24,"-6":24,"-5.5":24,"-5":24,"-4.5":24,"-4":24,"-3.5":24,"-3":24,"-2.5":24,"-2":24,"-1.5":24,"-1":24,"-0.5":24,"0.5":25,"1.5":25,"2.5":25,"3.5":25,"4.5":25,"5.5":25,"6.5":25,"7.5":25,"8.5":25,"9.5":25,"10.5":26,"11.5":26,"12.5":26,"13.5":26,"14.5":26,"15.5":26,"16.5":26,"17.5":26,"18.5":26,"19.5":27,"20.5":27,"21.5":27,"22.5":27,"23.5":27,"24.5":27,"25.5":27,"26.5":27,"27.5":28,"28.5":28,"29.5":28,"30.5":28,"31.5":28,"32.5":28,"33.5":28,"34.5":28,"35.5":29,"36.5":29,"37.5":29,"38.5":29,"39.5":29,"40.5":29,"41.5":29,"42.5":30,"43.5":30,"44.5":30,"45.5":30,"46.5":30,"47.5":31,"48.5":31,"49.5":31,"50.5":31,"51.5":31,"52.5":32,"53.5":32,"54.5":32,"55.5":32,"56.5":33,"57.5":33,"58.5":33,"59.5":34}
function PointLight (options) {
	this.options = options;
	this.source = this.init();
	this.parent = options.parent;
}
PointLight.prototype = {
	init: function(argument) {
		source = new paper.Path.Rectangle({
			name: "PL: Point Light",
			size: new paper.Size(Ruler.mm2pts(5) , Ruler.mm2pts(1.4) ), 
			fillColor: "white", 
			strokeColor: "#333", 
			strokeWidth: 1, 
			// strokeScaling: false, 
			// applyMatrix: false
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
		// console.log(ibrdf[angle_to_bin[theta]]);
		if(angle_to_bin[theta] in ibrdf)
		return ibrdf[angle_to_bin[theta]]
		else
			return 1;
	},
	emmision: function(start=-60, end=61, step=0.5){
		var scope = this;
		rays = _.range(start, end, step);
		rays = _.map(rays, function(theta){
			return scope.emit(scope.source.position, scope.toLocalSpace(theta), scope.brdf(theta), "yellow", theta, 0);
		})
		count = 0;
		while(!_.isEmpty(rays)){
			rays = _.map(rays, function(r){
				if(_.isNull(r) || _.isUndefined(r)) return;
				return scope.trace(r, false);
			})
			rays = _.compact(_.flatten(rays));
			count ++;
			// console.log("RAY TRACE:", count, rays.length)
			if(count > 30) break;
		}
	},
	emit: function(origin, direction, strength, color, original_angle, distance_travelled=0){
		// console.log("S", strength);
		if(strength < ENERGY_DEATH) return null;
		// else(console.log(strength, "MADE IT"));
		var sW = strength * 0.5 + 0.1;

		var rayEnd = new paper.Point(0, -1);
		rayEnd.length = 10000;
		rayEnd.angle = direction;
		// console.log("REFL", strength)
		p = new paper.Path.Line({
			name: "RAY: Ray of Light!",
			from: origin, 
			to: origin.add(rayEnd),
			strokeColor: color, 
			strokeWidth: sW,
			strength: strength, 
			strokeScaling: false,
			direction: original_angle, 
			distance_travelled: distance_travelled
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

		if(hits.length == 0){
			// r.path.lastSegment.point = r.path.getPointAt(50);
			return null;
		}
		var interface = hits[0];
		if(!interface.normal) return null;

		r.path.lastSegment.point = interface.point;
		r.path.distance_travelled += r.path.length;

		// console.log(r.path.distance_travelled, Ruler.mm2pts(10));
		if(r.path.distance_travelled > Ruler.mm2pts(WAVE_ENERGY)){  return null;} //KILL RAYS THAT GOT TOO LONG ;(


		ref_normal = PointLight.getReferenceNormal(interface.normal, r);

		// PointLight.visualizeNormal(interface.point, ref_normal, interface.tangent, r);
		
		materials = PointLight.detectMaterial(interface, ref_normal, this.options.mediums);
		// if(viz) console.log(material);
		var scope = this;
		new_rays = _.map(materials, function(material){
			// console.log(material);
			if(material.reflect){
				return scope.reflect(r, interface, material, ref_normal);
			} else if(material.refract){
				return scope.refract(r, interface, material, ref_normal);
			}
		});
		return new_rays;
	}, 
	reflect: function(r, interface, material, normal){
		theta0 = PointLight.getIncidentAngle(normal, r);
		back_normal = normal.clone().multiply(-1);

		return this.emit(interface.point, back_normal.angle - theta0, r.strength * material.reflectance, "yellow", r.path.direction, r.path.distance_travelled);
	}, 
	refract: function(r, interface, material, normal){
		theta0 = PointLight.getIncidentAngle(normal, r);
		theta_c = PointLight.getCriticalAngle(theta0, material.n1, material.n2);

		// INTERNAL REFLECTION ACHIEVED
		if(!_.isNaN(theta_c) && Math.abs(theta0) > Math.abs(theta_c) ){
			theta1 = PointLight.snell(theta0, 1.00, 1.44);
			return [this.reflect(r, interface, material, normal), this.emit(interface.point, normal.angle +  theta1 , r.strength * 0.3, "yellow", r.path.direction, r.path.distance_travelled)];
		}

		// NO TOTAL INTERNAL REFLECTION POSSIBLE
		theta1 = PointLight.snell(theta0, material.n1, material.n2);
		return this.emit(interface.point, normal.angle +  theta1, r.strength * material.refraction, "yellow", r.path.direction, r.path.distance_travelled)
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

	if(! _.isUndefined(material.reflectance) && material.optic_type != "diffuser")
		return [{reflect: true, reflectance: material.reflectance}]
	
	if(material.optic_type == "diffuser"){
		var rand = Math.random();
		// console.log("PROB", material.probability, rand)
		// if(rand > material.probability) 
			// return [{reflect: true, refract: false, reflectance: material.reflectance}]
		// else
			return [{reflect: true, refract: false, reflectance: material.reflectance}, {refract: true, n1: 1.00, n2: material.n, refraction: material.refraction, reflectance: 1.0}]
	}

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
	// console.log(material);

	if(other.length == 0) other = [{n: 1.00}]
	other = other[0];
	
	

	
	if(!_.isUndefined(other.reflectance)) 
		return [{reflect: true, refract: false, reflectance: other.reflectance}]

	if(goingIn) return [{refract: true, n1: other.n, n2: material.n, refraction: material.refraction, reflectance: 1.0}]
	else return [{refract: true, n1: material.n, n2: other.n, refraction: material.refraction, reflectance: 1.0}]
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