# temp.js.coffee


    # HEATERS
    heaters = CanvasUtil.queryPrefix("HEATER")
    heaters = _.map heaters, (heater, i)->
      data = JSON.parse(CanvasUtil.getName(heater))
      ActuatorManager.create
        target: $('#actuators .track-full')
        clear: false
        actuator_type: "Heater"
        hardware_ids: [heater.id]
        canvas_ids: [heater.id]
        constants: 
          resistance: data.resistance
    
    motors = CanvasUtil.queryPrefix("MOTOR")
    motors = _.map heaters, (motor, i)->
      data = JSON.parse(CanvasUtil.getName(motor))
      ActuatorManager.create
        target: $('#actuators .track-full')
        clear: false
        actuator_type: "Stepper"
        hardware_ids: [motor.id]
        canvas_ids: [motor.id]
        constants: 
          max: data.max
     
    LEDS = _.map CanvasUtil.queryPrefix("LED"), (led, i)->
      ActuatorManager.create
        target: $('#actuators .track-full')
        clear: false
        actuator_type: "LED"
        hardware_ids: [i]
        canvas_ids: [led.id]
        constants: 
          color: CanvasUtil.getName(led)
    actuators = _.flatten([LEDS, hsbLEDs, heaters, motors])   