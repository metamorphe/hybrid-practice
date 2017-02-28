
var LED = _.extend( _.clone(v10bit_actuator), 
					{
						render: true,
						modality: "light",
						color: "#FFFFFF", 
						package: "DIP",
						alpha: 1.1
					}
				);
				
var RGBLED = {
				render: true,
				parameters: {
					red: _.extend(_.clone(v10bit_actuator), {name: "red", render: false, color: "#FF0000"}), 
	   				green: _.extend(_.clone(v10bit_actuator), {name: "green", render: false, color: "#00FF00"}),
	   				blue: _.extend(_.clone(v10bit_actuator), {name: "blue", render: false, color: "#0000FF"})
	   			},
	   			package: "DIP"
			  }

var HSBLED = {
				render: true,
				parameters: {
					hue: _.extend(_.clone(v360_actuator), {name: "hue", render: false}),
	   				saturation: _.extend(_.clone(param_actuator), {name: "saturation", render: false}),
	   				brightness: _.extend(_.clone(param_actuator), {name: "brightness", render: false})
	   			},
	   			package: "SMD"
			  }
			  
function HSBLED_Simulator(op){
	_.each(LED_inherit, function(val, key){ HSBLED_Simulator.prototype[key] = val; });
	this.name = "HSB_LED"
		
	this.op = op;
	this.visuals = [];
	this.parameters = _.mapObject(this.op.parameters, function(actuator){ return new ActuationParam(actuator);});
	this.init();
}

HSBLED_Simulator.prototype = {
	init: function(){
		console.info("Making", this.name, this.op.color);
		if(this.op.render) this.makeVisuals();		
	},
	toCommand: function(){
		var v = this.value;
		return "\t" + this.name + ".setColor(\"" + rgb2hex(v.toCSS()) + "\");\n";
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
		var scope = this;
		params = _.mapObject(this.parameters, function(v, k){
		 	return v.value;
		});
		
		return new paper.Color(params);
	},
	set value(x){
		var scope = this;
		// gray
		if(typeof x == "object"){
			_.each(x, function(val, key){
				if(key in scope.parameters){
					if(x.parametrized){ scope.parameters[key].param = val; }
					else{ scope.parameters[key].value = val; }
				}
			});
		}
		else if(typeof x == "string"){
			var c = new paper.Color(x);
			this.parameters.hue.value = c.hue;
		 	this.parameters.saturation.value = c.saturation;
			this.parameters.brightness.value = c.brightness;
		}
		else{
			console.error("Attempt to set", this.name, "with invalid type", typeof(x));
		}

		_.each(this.visuals, function(v){
			var prefix = CanvasUtil.getPrefix(v);
			if(prefix == "RAY"){
				v.set({strokeColor: scope.value})
			}
			else{
				v.set({fillColor: scope.value})
			}
		});
	}
}

function RGBLED_Simulator(op){
	_.each(LED_inherit, function(val, key){ RGBLED_Simulator.prototype[key] = val; });
	this.name = "RGB_LED"
		
	this.op = op;
	this.visuals = [];
	this.parameters = _.mapObject(this.op.parameters, function(actuator){ return new ActuationParam(actuator);});
	this.init();
}

RGBLED_Simulator.prototype = {
	init: function(){
		console.info("Making", this.name, this.op.color);
		if(this.op.render) this.makeVisuals();		
	},
	toCommand: function(){
		var v = this.value;
		return "\t" + this.name + ".setColor(\"" + rgb2hex(v.toCSS()) + "\");\n";
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
		var scope = this;
		params = _.mapObject(this.parameters, function(v, k){
		 	return v.param;
		});
		
		return new paper.Color(params);
	},
	set value(x){
		var scope = this;
		// gray
		if(typeof x == "number"){
			this.parameters.red.value = x;
		 	this.parameters.green.value = x;
			this.parameters.blue.value = x;
		}
		else if(typeof x == "object"){
			_.each(x, function(val, key){
				if(key in scope.parameters){
					if(x.parametrized)
						scope.parameters[key].param = val;
					else
						scope.parameters[key].value = val;
				}
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
				v.set({strokeColor: scope.value})
			}
			else{
				v.set({fillColor: scope.value})
			}
		});
	}
}


function LED_Simulator(op){
	_.each(LED_inherit, function(val, key){ LED_Simulator.prototype[key] = val; });
	
	this.name = "LED"
	this.op = op;
	this.visuals = [];
	var scope = this;
 	this.parameters = {brightness: new ActuationParam(op)}
	this.init();
}

LED_Simulator.prototype = {	
	init: function(){ 
		console.info("Making", this.name, this.op.color, this.op.render);
		if(this.op.render) this.makeVisuals();
		
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
	toCommand: function(){
		var v = this.value;
		return "\t" + this.name + ".setBrightness(" + v.toFixed(0) + ");\n";
	},
	get param(){ return this.parameters.brightness.param; },
	get value(){ return this.parameters.brightness.value; },
	set param(x){ this.parameters.brightness.param = x; },	
	set value(x){ 
		if(typeof x == "object"){
			if(x.brightness) this.parameters.brightness.param = x.brightness;
		}
		else{
			this.parameters.brightness.value = x; 
		}
		var scope = this;
		_.each(this.visuals, function(v){
					var prefix = CanvasUtil.getPrefix(v);
					var scale = prefix == "RAY" ? 0.2 : 1;
			v.opacity = scope.param * scale;
		});
		paper.view.update();
	}
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
