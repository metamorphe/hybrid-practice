class window.Scheduler 
	@quanta: 50
	@pretty_print_flag = false
	@pretty_print: (commands, info, full=false)->
		if Scheduler.pretty_print_flag 
			_.each commands, (command)->
				args = command.api.args.join(',')
				if args != ""
					args = args.split(':').join(',')
				console.log command.api.flag+ "(" + args + ");"
			# console.log "------- RAW_COMMANDS ---------"
			# console.log "t", "offset", "hid", "channel", "value"
			# commands_by_quanta = _.groupBy commands, (c)-> parseInt((c.t + c.async_offset) / Scheduler.quanta)
			# _.each commands_by_quanta, (command_set, q, i)->
			# 	console.log "\tQUANTA", q
			# 	_.each command_set, (c)->
			# 		console.log ["\t\t" + c.api.flag, "@" + c.t.toFixed(0) + "+" + c.async_offset.toFixed(0), "#" + c.hid + "->" + c.channel[0]+":"+c.param.toFixed(2)].join(' ')
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


	@schedule: (commands, simulation = true, final_print=false)->
		info = Scheduler.quanta_update(commands)
		commands = info.commands
		Scheduler.pretty_print(commands, info.stats, final_print)
		
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
		if aw.comm.live
			$('.popover.actuator .popover-content').html("[L] to Simulate")
		if sc and aw.comm.live   
			sc.sendMessage(command.api, {live: aw.comm.live}) 
			# actuator.perform(command.channel, command, false)
			# actuator.channels[command.channel].param = command.param
			# am.updateChannels(actuator)
		else
			window.paper = ch.paper
			actuator.perform(command.channel, command, false)
			# UPDATE SCENE GRAPH
			window.paper = ch.paper
			e = CanvasUtil.queryID(command.cid)
			if e
				if command.expression.className == "Color"
					CanvasUtil.setStyle [e], fillColor: command.expression
				else
					bubbles = actuator.channels.bubbles.value
					bubble_make = ()->
						c = new paper.Path.Circle
							radius: Math.random() * 15 + 2
							fillColor: "white"
							position: e.bounds.topCenter.clone()
							start:  e.bounds.topCenter.clone()
						ch.ps.add
							onRun: (event)-> 
								height = -800
								width = 200
								bubble_vx = 30

								y = c.start.y + height * event.parameter
								x = c.position.x + (bubble_vx * Math.random() - bubble_vx/2) #left of right movement
								if x > c.start.x + width/2
									x = c.start.x + width/2
								if x < c.start.x - width/2
									x = c.start.x - width/2

								c.position = new paper.Point(x, y)
							onKill: (event)-> 
								if c then c.remove()
							onDone: (event)-> 
								if c then c.remove()
							duration: 1000
					_.times parseInt(bubbles), (i)->
						stagger = 100 
						_.delay bubble_make, stagger * i
							

			

			# UPDATE WIDGETS
			content = actuator.expression
			content = if content.className == "Color" then content.toCSS() else content.toFixed(0)
			
			$('.popover.actuator .popover-content').html(content)
			_.each $('.popover.actuator input'), (input)->
				channel = $(input).attr('name')
				$(input).val(actuator.channels[channel].param)
			am.updateChannels(actuator)