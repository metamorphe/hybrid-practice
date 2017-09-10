class window.Scheduler 
	@quanta: 50
	@pretty_print_flag: false
	@pretty_print: (commands, info, full=false)->
		if Scheduler.pretty_print_flag 
			_.each commands, (command)->
				args = command.api.args.join(',')
				if args != ""
					args = args.split(':').join(',')
				console.log command.api.flag+ "(" + args + ");"
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


	@schedule: (commands, simulation = true, final_print=false)->
		info = Scheduler.quanta_update(commands)
		commands = info.commands
		    
		Scheduler.pretty_print(commands, info.stats, final_print)
		
		return play_ids = _.map commands, (command) ->
			id = _.delay(Scheduler.sendCommandTo, parseInt(command.t + command.async_offset), command, simulation)
			return id

	@sendCommandTo: (command, simulation=true)->
		actuator = command.actuator
		if _.isUndefined actuator
			Alerter.warn
		      strong: "HEADS UP"
		      msg: "DON'T FORGET TO SELECT AN ACTUATOR"
		      delay: 2000
		    return 
		if actuatorsLive()
			$('.popover.actuator .popover-content').html("[L] to Simulate")
		sc.sendMessage(command.api, true)
		if sc and actuatorsLive()
			sc.sendMessage(command.api, {live: actuatorsLive()}) 
			actuator.perform(command, false)
			actuator.channels[command.channel].param = command.param
			am.updateChannels(actuator)
		else
			window.paper = ch.paper
			actuator.perform(command, false)
			# UPDATE SCENE GRAPH
			window.paper = ch.paper
			e = CanvasUtil.queryID(command.cid)
			if e
				switch actuator.actuator_type
					when "HSBLED"
						e.fillColor = command.expression
						# CanvasUtil.setStyle [e], fillColor: command.expression
					when "PUMP"
						bubbles = actuator.channels.bubbles.value
						bubble_make = ()->
							scale = 0.5
							bubbleSize = Math.random() * 4
							c = new paper.Path.Circle
								parent: e.parent
								radius: bubbleSize + 1
								fillColor: "white"
								opacity: 0.8
								position: e.bounds.topCenter.clone()
								start:  e.bounds.topCenter.clone()
							ch.ps.add
								onRun: (event)-> 
									scale = 3
									height = -800 / scale
									width = 200 / scale
									bubble_vx = 50 / scale

									y = c.start.y + height * event.parameter
									x = c.position.x + (bubble_vx * Math.random() - bubble_vx/2) #left or right movement
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
							stagger = 10 
							_.delay bubble_make, stagger * i
					when "HEATER"
						red = new (paper.Color)('red')
						blue = new (paper.Color)('#00A8E1')
						p = actuator.channel.param
						c = red.multiply(p).add(blue.multiply(1-p))
						CanvasUtil.setStyle [e], color: c
						chromic = CanvasUtil.query(e, {prefix: ["CHROME"]})
						temp = actuator.channels.temperatureF.value 
						if temp > 94
							CanvasUtil.setStyle chromic, {opacity: 0, fillColor: "black"}
						else if temp > 92 and temp <= 94 #cooling state
							op = (temp - 92)/ 2
							CanvasUtil.setStyle chromic, {opacity: 1 - op, fillColor: "black"}
						else
							CanvasUtil.setStyle chromic, {opacity: 1, fillColor: "black"}
			

			# UPDATE WIDGETS
			content = actuator.expression
			content = if content.className == "Color" then content.toCSS() else content.toFixed(0)
			
			$('.popover.actuator .popover-content').html(content)
			_.each $('.popover.actuator input'), (input)->
				channel = $(input).attr('name')
				$(input).val(actuator.channels[channel].param)
			am.updateChannels(actuator)