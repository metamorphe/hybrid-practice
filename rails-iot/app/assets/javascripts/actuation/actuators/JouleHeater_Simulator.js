function JouleHeater_Simulator(){
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
JouleHeater_Simulator.prototype =  {
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