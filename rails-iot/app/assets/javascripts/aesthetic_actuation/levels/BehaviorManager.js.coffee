class window.Scheduler 
	@quanta: 50
	@pretty_print: (commands, info, full=false)->
		if full 
			console.log "------- RAW_COMMANDS ---------"
			console.log "t", "offset", "hid", "channel", "value"
			commands_by_quanta = _.groupBy commands, (c)-> parseInt((c.t + c.async_offset) / Scheduler.quanta)
			_.each commands_by_quanta, (command_set, q, i)->
				console.log "\tQUANTA", q
				_.each command_set, (c)->
					console.log ["\t\t" + c.api.flag, "@" + c.t.toFixed(0) + "+" + c.async_offset.toFixed(0), "#" + c.hid + "->" + c.channel[0]+":"+c.param.toFixed(2)].join(' ')
		total_quanta = info.idle + info.non_idle
		utilization = info.non_idle / total_quanta * 100
		utilization = utilization.toFixed(1) +  "% util"
		console.log "@" + info.time.toFixed(0)+ "~>" + TimeSignal.pretty_time(info.quanta)+ "|" + utilization +  "|" +  "q="+ total_quanta.toFixed(0)+"|" + "n=" + info.n.toFixed(0)
	@quanta_update: (commands)->
		commands_by_quanta = _.groupBy commands, (c)-> parseInt((c.t + c.async_offset) / Scheduler.quanta)
		commands_by_quanta = _.mapObject commands_by_quanta, (commands, q)->
			update_command = _.clone(_.last(commands))
			update_command.api = 
				flag: "U"
				args: []
			commands.push(update_command)
			return commands
		non_idle = _.keys(commands_by_quanta).length
		commands_by_quanta = _.values(commands_by_quanta)
		commands = _.flatten(commands_by_quanta)
		l = _.last(commands)
		total_time = l.t + l.async_offset
		commands: commands
		stats: 
			non_idle: non_idle
			quanta: Scheduler.quanta
			idle: (total_time / Scheduler.quanta) - non_idle
			n: commands.length
			time: total_time


	@schedule: (commands, simulation = true)->
		info = Scheduler.quanta_update(commands)
		commands = info.commands
		Scheduler.pretty_print(commands, info.stats)
		return play_ids = _.map commands, (command) ->
			id = _.delay(Scheduler.sendCommandTo, command.t + command.async_offset, command, simulation)
			return id

	@sendCommandTo: (command, simulation=true)->
		actuator = command.actuator
		if _.isUndefined actuator
			Alerter.warn
		      strong: "HEADS UP"
		      msg: "DON'T FORGET TO SELECT AN ACTUATOR"
		      delay: 2000
		    return 
		if sc and aw.comm.live   
			sc.sendMessage(command.api, {live: aw.comm.live}) 
		else
			actuator.perform(command.channel, command)
			am.updateChannels(actuator)
			 
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
							commands = tsm.resolve(signal).command_list({offset: offset})
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