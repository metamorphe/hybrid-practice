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
//= require aesthetic_actuation/Composer
//= require aesthetic_actuation/FileManagers
//= require aesthetic_actuation/SocketControl
# LEVELS
//= require aesthetic_actuation/levels/TimeSignalManager
//= require aesthetic_actuation/levels/ActuatorManager
//= require aesthetic_actuation/levels/BehaviorManager
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
# COMPOSITIOn
//= require aesthetic_actuation/levels/Actuator/Keyframe

class window.AestheticActuation
	@enable: ->
		console.info "AestheticActuation PROJECT"
		# ACTUATIOR MANAGER
		window.am = new ActuatorManager
		am.init()
		# TIME SIGNAL MANAGER
		window.tsm = new TimeSignalManager
			collection: $('datasignal canvas[data]')
		tsm.init()
		window.bm = new BehaviorManager
			scrubber: $('#scrubber')
		# COMPOSER
		window.cmp = new Composer
			signal_button: $('#apply-signal')
			live_button: $('#slider-live')
			slider: $('event#actuators input.master')
		Widget.enable()
		window.tw = TimeWidgets()
		window.aw = new ActuatorWidgets()
		aw.saver.load()
		return