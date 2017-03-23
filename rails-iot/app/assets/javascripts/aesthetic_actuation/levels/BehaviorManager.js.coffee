class window.BehaviorManager
	constructor: (@op) ->
		scope = this
		@play_ids = []
		@playing = false
		@activateDragAndDrop()
		$("button#compose").click(()-> scope.play())
		Widget.bindKeypress 32,((event) ->
			event.preventDefault()
			$('#compose').click()), true
			
		
	playScrubber: (start, end)->
		scope = this
		duration = parseInt((end - start))
		@scrubberSet Math.round(@scrubberPos(start))
		@op.scrubber.css
			transition: 'left '+ duration+'ms linear'
			left: Math.round(@scrubberPos(end))

		_.delay(()-> scope.op.scrubber.css
			transition : 'left 0s linear'
		, duration);
	scrubberSet: (x)->
		@op.scrubber.css
			transition : 'left 0s linear'
			left: x
	scrubberPos: (t)->
		timescale = $('#timetrack acceptor').data().timescale
		w = @op.scrubber.parent().width()
		p = t/timescale * w
		return p
	scrubberTime: ()->
		timescale = $('#timetrack acceptor').data().timescale
		w = @op.scrubber.parent().width()
		t = timescale * @op.scrubber.position().left / w
		return t
	
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
		if @playing
			@pause()
			@playing = false
			return

		scope = this
		raw_commands = @compile()
		t_start = @scrubberTime()
		
		# RESTART
		commands = _.filter raw_commands, (command)-> command.t > t_start
		if _.isEmpty commands 
			t_start = 0
			commands = raw_commands
		start = _.first(commands).t
		end = _.last(commands).t + _.last(commands).duration
		commands = _.each commands, (command)->
			command.t = command.t - t_start

		scope.play_ids = _.map commands, (command) ->
			actuator = am.getActuator(command.actuator)
			id = _.delay(am.sendCommandTo, command.t, actuator, command.channel, command.param)
			return id
		scope.playScrubber(start, end)
		@playing = true
	pause: ()->
		pos = @scrubberPos(@scrubberTime())
		@scrubberSet(pos)
		_.each @play_ids, (id)->
			clearTimeout(id)
		@play_ids = []

	activateDragAndDrop: ()->
		scope = this
		@op.scrubber.draggable
			containment: "parent"
			axis: "x"
			grid: [ 5, 200 ]
			scroll: false
