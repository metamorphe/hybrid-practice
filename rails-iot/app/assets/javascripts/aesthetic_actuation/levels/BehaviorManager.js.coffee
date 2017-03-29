
			 
class window.BehaviorManager
	constructor: (@op) ->
		scope = this
		@play_ids = []
		@playing = false
		@scrub_ids = []
		@activateDragAndDrop()
		$("button#compose").click(()-> scope.play())
		$("button#add-stage").click(()-> scope.addStage())
		Widget.bindKeypress 32,((event) ->
			event.preventDefault()
			$('#compose').click()), true
		
	getActors: ()->
		actuators = _.map $('#stage').find('actuator'), (actor)-> return am.resolve(actor)		
	loadStage: (actuator)->
		# console.log "STAGE LOAD", actuator
		template = bm.addStage()
		ops = 
			clear: false
			target: template
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
		id = _.delay (()-> scope.pause()), duration
		@scrub_ids.push id
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
	
	play: ()->
		if @playing
			@pause()
			return

		scope = this
		raw_commands = @compile()
		if _.isEmpty raw_commands then return

		t_start = @scrubberTime()
		
		# RESTART
		commands = _.filter raw_commands, (command)-> command.t > t_start
		if _.isEmpty commands 
			t_start = 0
			commands = raw_commands

		start = _.first(commands).t
		end = _.last(commands).t + _.last(commands).duration
		commands = _.each commands, (command)-> command.t = command.t - t_start

		scope.play_ids = Scheduler.schedule(commands, true)
		scope.playScrubber(start, end)
		@playing = true
	pause: ()->
		@op.scrubber.css
			transition : 'left 0s linear'
		pos = @scrubberPos(@scrubberTime())
		@scrubberSet(pos)
		_.each _.flatten([@scrub_ids, @play_ids]), (id)->
			clearTimeout(id)
		@play_ids = []
		@playing = false


	activateDragAndDrop: ()->
		scope = this
		@op.scrubber.draggable
			containment: "parent"
			axis: "x"
			grid: [ 5, 200 ]
			scroll: false
	compile: ()->
		actors = $("#stage actuator").not(".template")
		signal_tracks = $("#timetrack acceptor").not(".template")
		choreography = _.chain actors
			.map (actor, i)->
				actor = am.resolve(actor)
				channels = _.keys(actor.physical_channels()).sort()
				if i < signal_tracks.length
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
							ts = tsm.resolve(signal)
							commands = ts.command_list_data(ts.p_signal,{offset: offset})
							commands = _.map commands, (command) -> 
								cl = actor.perform(channel, command)
								return cl
							commands =_.flatten(commands)
							commands
						.flatten()
						.value()
				else
					return []
			.flatten()
			.sortBy("t")
			.value()
		return choreography