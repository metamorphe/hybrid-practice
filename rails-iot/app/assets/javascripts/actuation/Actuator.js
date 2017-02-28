var v10bit_actuator = { range: {min: 0, max: 255}, resolution: 1}; 
var param_actuator = { range: {min: 0, max: 1}, resolution: 0.01}; 
var v360_actuator = { range: {min: 0, max: 360}, resolution: 1}; 
var v180_actuator = { range: {min: 0, max: 180}, resolution: 1}; 
var voltage_actuator = { range: {min: 0, max: 12}, resolution: 12/256};

var Heater = {
				render: true,
				parameters: {
					voltage: _.extend(_.clone(voltage_actuator), {name: "voltage", render: false})
	   			}
			  }
			  
function Heater_Simulator(op){
	_.each(LED_inherit, function(val, key){ Heater_Simulator.prototype[key] = val; });
	
	this.name = "Heater"
	this.op = op;
	this.visuals = [];
	this.parameters = _.mapObject(this.op.parameters, function(actuator){ return new ActuationParam(actuator);});
	this.init();
}

Heater_Simulator.prototype = {
	init: function(){
		console.info("Making", this.name);
		if(this.op.render) this.makeVisuals();		
	},
	makeVisuals: function(){
		var heater = new paper.Path.Rectangle({
			name: "EMIT: emit",
	        position: paper.view.center,
	        fillColor: "red",
	        size: [16, 16]
	    });
	    var rays =  this._createRays({
			emitter: heater,
			position: heater.position,
			boundaries: [new paper.Path.Rectangle(paper.view.bounds)], 
			color: "red", 
			max_ray_length: 30
		});

		this.visuals.push(heater);
		this.visuals.push(rays);
		this.visuals = _.flatten(this.visuals);
	},
	toCommand: function(){
		var v = this.value;
		return "\t" + this.name.toLowerCase() + ".set(" + v.toFixed(0) + ");\n";
	},
	get param(){ return this.parameters.voltage.param; },
	get value(){ return this.parameters.voltage.value; },
	set param(x){ this.parameters.voltage.param = x; },	
	set value(x){ 
		if(typeof x == "object"){
			if(x.voltage) this.parameters.voltage.param = x.voltage;
		}
		else{
			this.parameters.voltage.value = x; 
		}
		var scope = this;
		var red = new paper.Color("red");
		var blue = new paper.Color("blue");
		var current = red.multiply(scope.param * 2).add(blue.multiply(1 - (scope.param * 2)));
		_.each(this.visuals, function(v){
			var prefix = CanvasUtil.getPrefix(v);
			if(prefix == "RAY"){
				if(scope.param < 0.5)
					v.opacity = 0;
				else
					v.opacity = (scope.param - 0.5) * 2 * 0.2;
			}else{
				if(scope.param > 0.5){
					v.fillColor.hue = 0;
					// v.opacity = scope.param + 0.2 > 1 ? 1 : scope.param + 0.2;
				} else{
					//270 ---> 0
					v.fillColor = current;
				}
			}
		});
	
		paper.view.update();
	}
}




