# ACTUATION AESTHETICS
//= require ace-rails-ap
//= require ace/theme-monokai
//= require ace/mode-javascript
//= require finitestatemachine
//= require jquery.preventMacBackScroll.js
# //= require aesthetic_actuation/ComponentSelectTool
# //= require aesthetic_actuation/PathSelectTool
# //= require aesthetic_actuation/BurstSelectTool
# //= require aesthetic_actuation/SIA
# COMPOSER
//= require circuitree/animation_handler
//= require aesthetic_actuation/Composer
//= require aesthetic_actuation/FileManagers
//= require aesthetic_actuation/SocketControl
# LEVELS
//= require aesthetic_actuation/levels/TimeSignalManager
//= require aesthetic_actuation/levels/ActuatorManager
//= require aesthetic_actuation/levels/BehaviorManager
//= require aesthetic_actuation/levels/Stage
//= require aesthetic_actuation/levels/TimeSignal
//= require aesthetic_actuation/levels/Recorder
//= require aesthetic_actuation/levels/Composition
//= require aesthetic_actuation/levels/StateMachine
//= require aesthetic_actuation/levels/Benchmark/Benchmark
# ACTUATORS
//= require aesthetic_actuation/levels/Actuator/ActuationParam
//= require aesthetic_actuation/levels/Actuator/ActuatorSpecs
//= require aesthetic_actuation/levels/Actuator/Actuator
//= require aesthetic_actuation/levels/Actuator/Lights
//= require aesthetic_actuation/levels/Actuator/Heaters
//= require aesthetic_actuation/levels/Actuator/Motors
//= require aesthetic_actuation/levels/Actuator/ActuatorWidgets
//= require aesthetic_actuation/levels/Actuator/TimeSignalWidgets
//= require aesthetic_actuation/levels/Actuator/BehaviorWidgets
//= require aesthetic_actuation/levels/Choreography
//= require aesthetic_actuation/levels/Scheduler
//= require aesthetic_actuation/levels/Scrubber
//= require aesthetic_actuation/levels/Tools
# COMPOSITIOn
//= require aesthetic_actuation/levels/Actuator/Keyframe
//= require jquery.sparkline.min
//= require jquery.loading.min

class window.AestheticActuation
	@enable: (artwork_paper)->
		console.info '✓ Paper'
		$('button').click ()->
			$(this).blur()
		window.main_paper = artwork_paper

		window.ch = new ChoreographyWidget
			paper: artwork_paper
			dom: $('#projectviewer')

		window.initTools(main_paper)
		console.info '✓ Paper Tools'

		console.info '✓ Choreography'
		# window.bm = new BehaviorManager
		# 	scrubber: $('#scrubber')
		# ACTUATIOR MANAGER
		window.am = new ActuatorManager
		am.init()
		console.info '✓ Actuation'
		# TIME SIGNAL MANAGER
		window.tsm = new TimeSignalManager
			collection: ()-> $('datasignal').not('.template').find('canvas').not('.skip')
		tsm.init()
		console.info '✓ TimeSignals'

		
		# COMPOSER
		window.cmp = new Composer
			signal_button: $('#apply-signal')
			live_button: $('#slider-live')
			slider: $('event#project input.master')
		Widget.enable()
		window.aw = new ActuatorWidgets()
		aw.saver.load()
		# $('event.signal-design button.toggle').click()
		window.tw = new TimeWidgets()
		
		name = fs.getName()
		if not _.has sens.devices, name
			console.log "x Sensors", name
		else
			console.log "✓ Sensors", name
			window.sm = new SensorManager
	      		load: sens.devices[name].sensors
	      		parent: $("#sensors.tab-content .flex-wrapper")
		return
	
