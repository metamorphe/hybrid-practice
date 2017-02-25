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




function JouleHeaterSimulator(){
	this.name =  "Heater", 
	this.sheet_resistance =  0.3;
	this.area =  320;
	this.resistance = 78.5;
	// this.area = Ruler.pts2mm(this.length) / Ruler.pts2mm(this.strokeWidth);
	this.temperature = 0;
	this.init();

	this.heat = {
		range: [0, 5],
		resolution: [0.01],
		cooling_factor: 0.016,
		kappa: 0.00137236
	}
}
JouleHeaterSimulator.prototype =  {
	init: function(){ this.temperature = 72},
	update: function(value, deltaTime){
		var heat = this.heating_coeff(value);
		var cool = this.cooling_coeff(deltaTime);
		this.temperature += cool * heat * deltaTime;
	},
	cooling_coeff: function(deltaTime){
		return Math.exp(- this.heat.cooling_factor * deltaTime)
 	}, 
	heating_coeff: function(value){
		var R = this.resistance_calc();
		return (value * value) / (R * this.heat.kappa * this.area) ;
	}, 
 	resistance_calc: function(){
 		if(_.isUndefined(this.resistance)){
			var cross_sectional_area = Ruler.pts2mm(this.length) / Ruler.pts2mm(this.strokeWidth);
			this.resistance = this.sheet_resistance * cross_sectional_area;
		}
		return this.resistance;
	}
}


// var RGB_LED = {
// 	name: "RGB_LED", 
// 	red_light: LED(0x0000FF), 
// 	green_light: LED(0x00FF00), 
// 	blue_light: LED(0x0000FF), 
// };

// var LED = function(color=0xFFFFFF){
// 	return {
// 		name: "LED", 
// 		light: {
// 			features: {color: color}
// 			range: [0, 256], 
// 			resolution: 1,
// 			alpha: 1.1, 
// 			inertia: function(from, to){ return 0;}
// 		}
// 	}
// };