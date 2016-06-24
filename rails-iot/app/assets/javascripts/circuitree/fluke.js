

function Fluke(){}

Fluke.getInvalidConnections = function(terminal){
    var terminals = designer.circuit_layer.getAllTerminals();
    terminals =  _.filter(terminals, function(el, i, arr){
        return ! terminal.fillColor.equals(el.fillColor || terminal.id != el.id);
    });
    return _.map(terminals, function(el, i, arr){
        return el;
    });
}
Fluke.getValidConnections = function(terminal){
    var terminals = designer.circuit_layer.getAllTerminals();
    terminals =  _.filter(terminals, function(el, i, arr){
        return terminal.fillColor.equals(el.fillColor) && terminal.id != el.id;
    });
    return _.map(terminals, function(el, i, arr){
        return el;
    });
}
Fluke.calculateCircuitState = function(){
        var resA = designer.nodes.at(6);
        var resB = designer.nodes.at(7);
        console.log(resA, resB);
        
        var area = resA.path.length / resA.path.style.strokeWidth;
        var resistorA = Fluke.calculateResistanceFromArea(resA.material, area);

        var area = resB.path.length / resB.path.style.strokeWidth;
        var resistorB = Fluke.calculateResistanceFromArea(resB.material, area);
        
        var battery = materials.collection.electrical_components[12];
        var led = materials.collection.electrical_components[1];
        console.log("Circuit", resistorA, resistorB, battery, led)

        var state = Fluke.calculateLEDState(led, resistorA, resistorB, battery);
        // alert("LED state:" +  state);
        if(_.isNaN(state)) state = "Invalid";
        else state = (state * 10000).toFixed(2);
        $('#led-state').html("LED state:" +  state)
}
// assuming the trace is uniform for now
Fluke.calculateResistanceFromArea = function(material, area){ 
	var valid = Fluke.checkValidComponents([material]);
    if(valid) 
    	return {resistance: NaN};
   else
    	return {resistance: material.physical.resistance * area};
    return 0;
}

// led_brightness varies from 0 to 1. set to -1 if it's blowing up.

Fluke.calculateLEDState = function(led, resistorPos, resistorNeg,  battery) {
	var led = led.physical;
	var battery = battery.physical;


    var led_brightness = 0; 
    console.log("calc", resistorPos, resistorNeg, battery);
    var circuit_current = battery.voltage / (resistorPos.resistance + resistorNeg.resistance); 
    var circuit_voltage_drop = battery.voltage - (resistorPos.resistance * circuit_current);
    
    if (circuit_voltage_drop < parseFloat(led.turnonvoltage)) 
        led_brightness = 0; 
    else if (circuit_current > parseFloat(led.maxcurrent))
        led_brightness = -1; 
    else
        led_brightness = circuit_current / led.maxcurrent; 
    
	return led_brightness;
}     

Fluke.checkValidComponents = function(comp){
	return _.reduce(comp, function(memo, el, i, arr){
	
    	return memo && _.isUndefined(el.physical)
	}, true);
}