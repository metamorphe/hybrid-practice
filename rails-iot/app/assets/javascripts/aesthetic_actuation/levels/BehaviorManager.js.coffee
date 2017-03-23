class window.BehaviorManager
	constructor: (@op) ->
		scope = this
		@activateDragAndDrop()
		$("button#compose").click(()-> scope.play())
			
		Widget.bindKeypress "b", ()-> $('#compose').click()
	compile: ()->
		actors = $("#stage actuator")
		signal_tracks = $("#timetrack acceptor")
		choreography = _.chain actors
			.map (actor, i)->
				actor = am.resolve(actor)
				channels = _.keys(actor.physical_channels()).sort()
				signal_track = $(signal_tracks[i])
				signals = signal_track.find('datasignal')
				tracks = signal_track.data().tracks
				timescale = signal_track.data().timescale
				height = signal_track.height()
				width = signal_track.width()
				_.chain signals
					.map (signal, j)->
						# CENTER LEFT CORNER POSITION VECTOR
						a = $(signal).parent().offset()
						b = $(signal).offset()
						pos = {top: b.top - a.top, left: b.left - a.left}
						pos.top += $(signal).height() / 2.0;

						# COLLAPSING TO INDEX 
						i = Math.floor(pos.top / height * tracks)

						# RESOLVING CHANNEL
						channel = channels[i]

						# TIME OFFSET
						offset = (pos.left / width) * timescale

						# COMPILING INSTRUCTIONS PER CHANNEL
						commands = tsm.resolve(signal).command_list({offset: offset})
						commands = _.map commands, (command) -> 
							cl = actor.perform(channel, command.param)
							_.extend command, {channel: channel, actuator: actor.id, commands: cl.commands, expression: cl.expression}
					.flatten()
					.value()
			.flatten()
			.sortBy("t")
			.value()
	play: ()->
		commands = @compile()
		_.each commands, (command) ->
			actuator = am.getActuator(command.actuator)
			_.delay(am.sendCommandTo, command.t, actuator, command.channel, command.param) 
			return





	activateDragAndDrop: ()->
		scope = this
		@op.scrubber.draggable
			containment: "parent"
			axis: "x"
			grid: [ 5, 200 ]
			scroll: false
