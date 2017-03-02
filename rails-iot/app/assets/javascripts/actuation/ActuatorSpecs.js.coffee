_.extend(window, 
	v10bit_actuator:
	  range:
	    min: 0
	    max: 255
	  resolution: 1
	param_actuator:
	  range:
	    min: 0
	    max: 1
	  resolution: 0.01
	v360_actuator:
	  range:
	    min: 0
	    max: 360
	  resolution: 1
	v180_actuator:
	  range:
	    min: 0
	    max: 180
	  resolution: 1
	voltage_actuator:
	  range:
	    min: 0
	    max: 12
	  resolution: 12 / 256
)
_.extend(window, 
	LED:
	  name: 'LED'
	  color: '#FFFFFF'
	  package: 'DIP'
	  dimension: 'brightness'
	  channels: brightness: _.extend(_.clone(v10bit_actuator),
	    modality: 'light'
	    alpha: 1.1)
	RGBLED:
	  name: 'RGBLED'
	  channels:
	    red: _.extend(_.clone(v10bit_actuator),
	      modality: 'light'
	      alpha: 1.1)
	    green: _.extend(_.clone(v10bit_actuator),
	      modality: 'light'
	      alpha: 1.1)
	    blue: _.extend(_.clone(v10bit_actuator),
	      modality: 'light'
	      alpha: 1.1)
	  package: 'DIP'
	HSBLED:
	  name: 'HSBLED'
	  channels:
	    hue: _.extend(_.clone(v360_actuator),
	      modality: 'light'
	      alpha: 1.1)
	    saturation: _.extend(_.clone(v10bit_actuator),
	      modality: 'light'
	      alpha: 1.1)
	    brightness: _.extend(_.clone(v10bit_actuator),
	      modality: 'light'
	      alpha: 1.1)
	  package: 'SMD'
	Stepper:
	  name: 'Stepper'
	  dimension: 'angle'
	  channels: angle: _.extend(_.clone(v180_actuator),
	    modality: 'motion'
	    alpha: 1)
	Stepper360:
	  name: 'Stepper360'
	  dimension: 'angle'
	  channels: angle: _.extend(_.clone(v360_actuator),
	    modality: 'motion'
	    alpha: 1)
	Heater:
	  name: 'Heater'
	  dimension: 'voltage'
	  channels: voltage: _.extend(_.clone(voltage_actuator),
	    modality: 'heat'
	    alpha: 1)
)
