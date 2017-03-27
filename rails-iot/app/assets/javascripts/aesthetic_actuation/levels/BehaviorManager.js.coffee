class window.Scheduler 
	@quanta: 500
	@pretty_print: (commands)->
		console.log "------- RAW_COMMANDS ---------"
		console.log "t", "offset", "hid", "channel", "value"
		commands_by_quanta = _.groupBy commands, (c)-> parseInt((c.t + c.async_offset) / Scheduler.quanta)
		_.each commands_by_quanta, (command_set, q, i)->
			console.log "\tQUANTA", q
			_.each command_set, (c)->
				console.log "\t\t", c.t.toFixed(0), c.async_offset.toFixed(0), c.hid, c.channel[0], c.param
	@schedule: (commands, simulation = true)->
		return play_ids = _.map commands, (command) ->
			id = _.delay(Scheduler.sendCommandTo, command.t + command.async_offset, command, simulation)
			return id

	@sendCommandTo: (command, simulation=true)->
		actuator = command.actuator
		if _.isUndefined actuator
			console.warn("FORGOT TO SELECT AN ACTUATOR!")
			return
		if simulation   
			actuator.perform(command.channel, command)
			am.updateChannels(actuator)
		if cmp and sc 
			sc.sendMessage(command.api, {live: aw.comm.live})  
		return actuator.toCommand()
class window.BehaviorManager
	constructor: (@op) ->
		scope = this
		@play_ids = []
		@playing = false
		@activateDragAndDrop()
		$("button#compose").click(()-> scope.play())
		$("button#add-stage").click(()-> scope.addStage())
		Widget.bindKeypress 32,((event) ->
			event.preventDefault()
			$('#compose').click()), true
	getActors: ()->
		actuators = _.map $('#stage').find('actuator'), (actor)-> return am.resolve(actor)		
	loadStage: (actuator)->
		console.log "STAGE LOAD", actuator
		template = bm.addStage()
		console.log "HERE"
		ops = 
			clear: false
			target: template
		console.log ops
		ops = _.extend(ops, actuator)
		ActuatorManager.create ops	
	addStage: ()->
		template = $('acceptor.actuator.template').clone().removeClass('template');
		$('#stage').append(template)
		am.activateDragAndDrop()
		return template
	addSignalTrack: (actor)->
		template = $('acceptor.datasignals.template').clone().removeClass('template');
		tracks = _.keys(actor.physical_channels()).length
		console.log "TRACKS", tracks, actor
		template.attr('data-tracks', tracks)
		$('#timetrack').append(template)
		tsm.activateDragAndDrop()
		tsm.activateTrackButtons()
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
		actors = $("#stage actuator").not(".template")
		signal_tracks = $("#timetrack acceptor").not(".template")
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
				commands = _.chain signals
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
							cl = actor.perform(channel, command)
							# console.log "C", cl
							return cl
						commands =_.flatten(commands)
						# _.each commands, (command)->
							# console.log "I", command.api.args.join(',')
						commands
					.flatten()
					# .tap (c)-> console.log "C", c
					.value()
			.flatten()
			.sortBy("t")
			.value()
		# _.each choreography, (c)->
			# console.log c.api.args.join ","
		
		return choreography
	play: ()->
		if @playing
			@pause()
			@playing = false
			return

		scope = this
		raw_commands = @compile()
		Scheduler.pretty_print(raw_commands)
		t_start = @scrubberTime()
		if _.isEmpty raw_commands then return
		 
		# RESTART
		commands = _.filter raw_commands, (command)-> command.t > t_start
		if _.isEmpty commands 
			t_start = 0
			commands = raw_commands
		start = _.first(commands).t
		end = _.last(commands).t + _.last(commands).duration
		commands = _.each commands, (command)->
			command.t = command.t - t_start

		scope.play_ids = Scheduler.schedule(commands, false)
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
