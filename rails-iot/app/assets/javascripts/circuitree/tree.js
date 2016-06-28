// tree.js

/* 
 * Algorithm
 * ===============
 * 1. Assign SINK as root
 * 2. BFT, propagate voltages with drops
 * 3. Back propagate GROUND
 * 4. Fill in 0 cycles   
 */

/* Feedback
 * ===============
 * 1. For each LED, if the voltage drop (+) - (-) == LED_vd, turn on.
 * 2. Branch voltage drop ~= LED brightness
 * 3. Short S_V == G_V, shorting path is shortest 0-edge path to S from G.
 * 4. Negative voltage drop == Not enough voltage
 */ 

var components = parallel_circuit_with_resistors;
// var components = reverse_led_circuit;


	
	function resolveName(el){
		if(_.isUndefined(el.physical.voltage)) el.physical.voltage = 0;
		if(_.isUndefined(el.physical.voltage_drop)) el.physical.voltage_drop = 0;
		if(_.isUndefined(el.physical.reverse_voltage_drop)) el.physical.reverse_voltage_drop = Number.POSITIVE_INFINITY;


		for(var i in el.overlaps){
				for(var j in el.overlaps[i]){
					el.overlaps[i][j] = _.find(components, function(el2){ return el2.id == el.overlaps[i][j]});
			}
		}

		el.terminal = new TerminalHandler(el.digital.outlets.length, el.digital.polarity);
		// if(el.digital.polarity){
		for(var j in el.overlaps){
			for(var i in el.overlaps[j]){
				if(j == 0)
					el.terminal.add(el.overlaps[j][i], TerminalHandler.A);
				else
					el.terminal.add(el.overlaps[j][i], TerminalHandler.B);
			}
		}		
		// } 
		// else{
		// 	for(var j in el.overlaps){
		// 		for(var i in el.overlaps[j]){
		// 			if(j == 0)
		// 				el.terminal.add(el.overlaps[j][i], TerminalHandler.A);
		// 			else
		// 				el.terminal.add(el.overlaps[j][i], TerminalHandler.B);
		// 		}
		// 	}		
		// }
		delete el["digital"];

		return el;
	}
	


// function CircuitTree(components){
// 	this.components = components;
// }

// CircuitTree.prototype = {
// 	toTree: function(){
// 		var crawl_check = this.components;
// 		var root = this.getBattery();
// 		var nodes = [root];
// 		var tree = new TreeModel();

// 		while(! _.isEmpty(crawl_check)){
// 			intersects = CircuitTree.getAllIntersections(root, this.components);
// 			// remap from paper.Path to Component objects
// 			var children = _.map(intersects, function(el, i, arr){ return el.component; });

// 			crawl_check = _.reject(crawl_check, function(el, i, arr){ el.equals(root); });
// 			root
// 		}
// 	},
// 	getBattery: function(){
// 		var batteries = _.find(this.components, function(el, i , arr){
// 			return el.isBattery;
// 		});
// 		// TODO: Handle multiple batteries
// 		if(_.isEmpty(batteries)) throw "This circuit does not have a battery";
// 		return batteries[0];
// 	}
// }

// CircuitTree.getAllIntersections = function(query, components){
// 	intersections = _.reduce(components, function(memo, el){
// 		var a = el.path.getIntersections(query);
// 		if(a.length > 0)
// 			memo.push(a);
// 		return memo;
// 	}, []);
// 	return _.flatten(intersections);
// }

