
var parallel_circuit_with_resistors = [
		Object.create({
			id: "battery", 
			uuid: guid(),
			physical: {
				voltage: 5,
				package: "battery", 
			}, 
			style: {
				color: "#F9ED32"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistor1"],["resistor6"]]
		}),
		Object.create({
			id: "led-green-through-hole", 
			uuid: guid(),
			physical: {
				maxcurrent: 20, 
				current_unit: "amp",
				current_unit_scale: "-3", 
				voltage_drop: 2, 
				package: "5mm through-hole", 
			}, 
			style: {
				color: "#39B54A"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistor2"], ["resistor3"]]
		}), 
		Object.create({
			id: "led-red-through-hole", 
			uuid: guid(),
			physical: {
				maxcurrent: 20, 
				current_unit: "amp",
				current_unit_scale: "-3", 
				voltage_drop: 2, 
				package: "5mm through-hole", 
			}, 
			style: {
				color: "#EE1122"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistor4"], ["resistor5"]]
		}),
		Object.create({
			id: "resistor1", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["battery"], ["resistor2", "resistor4"]]
		}), 
		Object.create({
			id: "resistor2", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["resistor1"], ["led-green-through-hole"]]
		}), 
		Object.create({
			id: "resistor3", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["led-green-through-hole"], ["resistor5","resistor6"]]
		}), 
		Object.create({
			id: "resistor4", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["resistor1", "resistor2"], ["led-red-through-hole"]]
		}), 
		Object.create({
			id: "resistor5", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["led-red-through-hole"], ["resistor3", "resistor6"]]
		}), 
		Object.create({
			id: "resistor6", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["resistor3", "resistor5"], ["battery"]]
		}), 
	];



var simple_led_circuit = [
		Object.create({
			id: "battery", 
			uuid: guid(),
			physical: {
				voltage: 5,
				package: "battery", 
			}, 
			style: {
				color: "#F9ED32"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistorA"], ["resistorB"]]
		}),
		Object.create({
			id: "led-green-through-hole", 
			uuid: guid(),
			physical: {
				maxcurrent: 20, 
				current_unit: "amp",
				current_unit_scale: "-3", 
				voltage_drop: 2, 
				package: "5mm through-hole", 
			}, 
			style: {
				color: "#39B54A"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistorA"], ["resistorB"]]
		}), 
		Object.create({
			id: "resistorA", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["led-green-through-hole"], ["battery"]]
		}), 
		Object.create({
			id: "resistorB",
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["led-green-through-hole"], ["battery"]]
		})
	];
var parallel_circuit = [
		Object.create({
			id: "battery", 
			uuid: guid(),
			physical: {
				voltage: 5,
				package: "battery", 
			}, 
			style: {
				color: "#F9ED32"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["led-green-through-hole", "led-red-through-hole"], ["led-green-through-hole", "led-red-through-hole"]]
		}),
		Object.create({
			id: "led-green-through-hole", 
			uuid: guid(),
			physical: {
				maxcurrent: 20, 
				current_unit: "amp",
				current_unit_scale: "-3", 
				voltage_drop: 2, 
				package: "5mm through-hole", 
			}, 
			style: {
				color: "#39B54A"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["battery"], ["battery"]]
		}), 
		Object.create({
			id: "led-red-through-hole", 
			uuid: guid(),
			physical: {
				maxcurrent: 20, 
				current_unit: "amp",
				current_unit_scale: "-3", 
				voltage_drop: 2, 
				package: "5mm through-hole", 
			}, 
			style: {
				color: "#EE1122"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["battery"], ["battery"]]
		}),
	];

var reverse_led_circuit = [
		Object.create({
			id: "battery", 
			uuid: guid(),
			physical: {
				voltage: 5,
				package: "battery", 
			}, 
			style: {
				color: "#F9ED32"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistorB"], ["resistorA"]]
		}),
		Object.create({
			id: "led-green-through-hole", 
			uuid: guid(),
			physical: {
				maxcurrent: 20, 
				current_unit: "amp",
				current_unit_scale: "-3", 
				voltage_drop: 2, 
				package: "5mm through-hole", 
			}, 
			style: {
				color: "#39B54A"
			},
			digital: {
				polarity: 2, 
				outlets: [1, -1]
			}, 
			overlaps: [["resistorA"], ["resistorB"]]
		}), 
		Object.create({
			id: "resistorA", 
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["led-green-through-hole"], ["battery"]]
		}), 
		Object.create({
			id: "resistorB",
			uuid: guid(),
			physical: {
				resistance: 200, 
				current_unit: "ohm",
				current_unit_scale: "0", 
				package: "resistor", 
			}, 
			style: {
				color: "#COCOCO"
			},
			digital: {
				polarity: 1, 
				outlets: [1, 1]
			}, 
			overlaps: [["led-green-through-hole"], ["battery"]]
		})
	];
	