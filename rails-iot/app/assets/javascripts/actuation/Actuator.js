// var EXPRESSO = {
// 	name: "EXPRESSO Test Device",
// 	yellow_light: LED(0x0000FF), 
// 	purple_light: LED(0x800080), 
// 	green_light: LED(0x00FF00),
// 	motion:  SERVOMOTOR
// }

// var LIVEWIRE = {
// 	name: "LIVEWIRE", 
// 	motion: MOTOR,
// 	light: LED
// };

// var MOTOR = {
// 	angular_speed: {
// 			range: [0, 4], 
// 			resolution: 1,
// 			alpha: 1, 
// 			inertia: function(from, to){ return Math.abs(to - from) * 16.6; } // ms per unit
// 	}
// }

// var SERVOMOTOR = {
// 	name: "ServoMotor", 
// 	motion: {
// 		angle: {
// 			range: [0, 180], 
// 			resolution: 1,
// 			alpha: 1.1, 
// 			inertia: function(from, to){ return Math.abs(to - from) * 15; } // ms per unit
// 		}
// 	}
// };

// function RGB_LED_Simulator(){
// 	this.name = "RGB_LED";
// 	name: "RGB_LED", 
// 	red_light: LED(0x0000FF), 
// 	green_light: LED(0x00FF00), 
// 	blue_light: LED(0x0000FF), 
// }
var v10bit_actuator = { range: {min: 0, max: 255}, resolution: 1}; 
var param_actuator = { range: {min: 0, max: 1}, resolution: 0.01}; 
var v360_actuator = { range: {min: 0, max: 360}, resolution: 1}; 
var v180_actuator = { range: {min: 0, max: 180}, resolution: 1}; 

var smd_LED = _.extend( _.clone(v10bit_actuator), 
					{
						modality: "light",
						color: "#FFFFFF", 
						package: "SMD",
						alpha: 1.1
					}
				);
				
var RGB_LED = {
				render: true,
				parameters: {
					red: _.extend(_.clone(v10bit_actuator), {name: "red", render: false, color: "#FF0000"}), 
	   				green: _.extend(_.clone(v10bit_actuator), {name: "green", render: false, color: "#00FF00"}),
	   				blue: _.extend(_.clone(v10bit_actuator), {name: "blue", render: false, color: "#0000FF"}),
	   				hue: _.extend(_.clone(v360_actuator), {name: "hue", render: false}),
	   				saturation: _.extend(_.clone(param_actuator), {name: "saturation", render: false}),
	   				brightness: _.extend(_.clone(param_actuator), {name: "brightness", render: false})
	   			},
	   			package: "SMD"
			  }

function RGBLED_Simulator(op){
	_.each(LED_inherit, function(val, key){ RGBLED_Simulator.prototype[key] = val; });
	this.name = "RGB LED"
	this.op = op;
	this.visuals = [];
	this.parameters = _.mapObject(this.op.parameters, function(actuator){ return new ActuationParam(actuator);});
	// this.active = ["red", "green", "blue"];
	this.active = ["hue", "saturation", "brightness"];
	this.init();
}

RGBLED_Simulator.prototype = {
	init: function(){
		console.info("Making", this.name, this.op.color);
		if(this.op.render) this.makeVisuals();		
	},
	set active(x){
		this._active = x;
	},
	get active(){
		return this._active;
	},
	makeVisuals: function(){
		switch(this.op.package){
			case "SMD":
				var c = new paper.Path.Rectangle({
					name: "EMITTER: emit",
			        position: paper.view.center,
			        size: [16, 8], 
			        fillColor: "white"
			    });
			    break;
			default:
			    var c = new paper.Path.Circle({
			    	name: "EMITTER: emit",
			        position: paper.view.center,
			        radius: 8, 
			        fillColor: "white"
			    });
			    break;
		}
		var rays =  this._createRays({
			emitter: c,
			position: c.position,
			boundaries: [new paper.Path.Rectangle(paper.view.bounds)], 
			color: "#FFFFFF", 
			max_ray_length: 30
		});
		this.visuals.push(c);
		this.visuals.push(rays);
		this.visuals = _.flatten(this.visuals);
		this.setBackground();
	},
	get value(){
		var physical_properties = ["red", "green", "blue", "hue"];
		
		params = _.pick(this.parameters, this.active);
		params = _.mapObject(params, function(v, k){
			if(_.contains(physical_properties, k)) return v.value;
			else return v.param;
		});
		
		return new paper.Color(params);
	},
	set value(x){
		var scope = this;
		// gray
		if(typeof x == "number"){
			console.log(this.parameters);
			this.parameters.red.value = x;
		 	this.parameters.green.value = x;
			this.parameters.blue.value = x;
		}
		else if(typeof x == "object"){
			_.each(x, function(val, key){
				if(key in scope.parameters)
					scope.parameters[key].value = val;
			});
		}
		else if(typeof x == "string"){
			var c = new paper.Color(x);
			this.parameters.red.param = c.red;
		 	this.parameters.green.param = c.green;
			this.parameters.blue.param = c.blue;
		}
		else{
			console.error("Attempt to set", this.name, "with invalid type", typeof(x));
		}

		_.each(this.visuals, function(v){
			var prefix = CanvasUtil.getPrefix(v);
			if(prefix == "RAY"){
				v.set({
					strokeColor: scope.value
				})
			}
			else{
				v.set({
					fillColor: scope.value
				})
			}
		});
	}
}


function LED_Simulator(op){
	_.each(LED_inherit, function(val, key){ LED_Simulator.prototype[key] = val; });
	
	this.name = "LED"
	this.op = op;
	this.visuals = [];

	this.parameter = new ActuationParam(_.extend(op, {
			onChange: function(v){
				_.each(this.visuals, function(v){
					var prefix = CanvasUtil.getPrefix(v);
					var scale = prefix == "RAY" ? 0.2 : 1;
					v.opacity = p * scale;
				});
			}
		})
	);

	this.init();
}

LED_Simulator.prototype = {	
	init: function(){ 
		console.info("Making", this.name, this.op.color);
		if(this.op.render) this.makeVisuals();
		this.value = 0; 
		this.param = 0; 
	}, 
	makeVisuals: function(){
		switch(this.op.package){
			case "SMD":
				var c = new paper.Path.Rectangle({
					name: "EMITTER: emit",
			        position: paper.view.center,
			        size: [16, 8], 
			        fillColor: this.op.color
			    });
			    break;
			default:
			    var c = new paper.Path.Circle({
			    	name: "EMITTER: emit",
			        position: paper.view.center,
			        radius: 8, 
			        fillColor: this.op.color
			    });
			    break;
		}

		var rays =  this._createRays({
			emitter: c,
			position: c.position,
			boundaries: [new paper.Path.Rectangle(paper.view.bounds)], 
			color: this.op.color, 
			max_ray_length: 30
		});

		this.visuals.push(c);
		this.visuals.push(rays);
		this.visuals = _.flatten(this.visuals);
		this.setBackground();
	},
	get param(){ return this.parameter._param; },
	get value(){ return this.parameter._value; },
	set param(x){ this.parameter.param = x; },	
	set value(x){ this.parameter.value = x; }
}



var LED_inherit = {
	_createRays: function(rops){
		var rays = _.range(-180, 180, RAY_RESOLUTION);	
		return  _.map(rays, function(theta){
			var point = new paper.Point(1, 0);
			point.length = Ruler.mm2pts(rops.max_ray_length);
			point.angle = theta;
			var line = new paper.Path.Line({
				name: "RAY: Cast",
				from: rops.position.clone(), 
				to: rops.position.clone().add(point), 
				strokeColor: rops.color, 
				strokeWidth: 1,
				opacity: 0.2, 
				parent: CanvasUtil.queryPrefix("ELD")[0], 
				originAngle: theta
			});
			line.pivot = line.firstSegment.point.clone();		
			ixts = CanvasUtil.getIntersections(line, rops.boundaries);
			if(ixts.length > 0){
				var closestIxT = _.min(ixts, function(ixt){ return ixt.point.getDistance(line.position); })
				line.lastSegment.point = closestIxT.point.clone();
			}
			return line;
		});
	},
	setBackground: function(){
		this.op.dom.css("background", "black");
	}
}



