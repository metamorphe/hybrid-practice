class window.Scheduler 
    @quanta: 50
    @baudrate: 19200
    @pretty_print_flag: false
    @bytes_per_second : Scheduler.baudrate/8
    @bytes_per_quanta : ()->
        Scheduler.bytes_per_second / Scheduler.quanta
    @commands_per_quanta : ()->
        Scheduler.bytes_per_quanta()/ 9
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
        utilization = utilization.toFixed(1)

        quanta_budget = Scheduler.commands_per_quanta()
        budget = _.reduce info.breakdown, ((memo, val)->
            return memo + val), 0

        
        budget_util = budget/(quanta_budget * info.non_idle)
        budget_util *= 100
        console.log "B", budget, quanta_budget * info.non_idle 
        stats = 
            time: TimeSignal.pretty_time(info.time)
            utilization: utilization
            period: TimeSignal.pretty_time(Scheduler.quanta)
            quanta: total_quanta.toFixed(0)
            commands: info.n.toFixed(0)
            breakdown: info.breakdown
            budget: budget_util.toFixed(1)
        # console.log "STATS", stats, info.non_idle

        # results = "@" + info.time.toFixed(0)+ "~>" + TimeSignal.pretty_time(info.quanta)+ "|" + utilization +  "|" +  "q="+ total_quanta.toFixed(0)+"|" + "n=" + info.n.toFixed(0)+ "\n" + info.breakdown.join(",")
        _.each stats, (v, k)->
            $('#stats').find("." + k).html(v)

        $('.dynamicsparkline').sparkline stats.breakdown, 
            height: 40 
            width: 250
            chartRangeMin: 0
            chartRangeMax: 10

    @quanta_update: (commands)->
        commands_by_quanta = _.groupBy commands, (c)-> parseInt((c.t + c.async_offset) / Scheduler.quanta)
        commands_by_quanta = _.mapObject commands_by_quanta, (commands, q)->
            metacommands = _.groupBy commands, (c)->
                return c.hid
            commands = _.map metacommands, (command_array, meta)->
                if command_array.length == 1 then return command_array[0]
                else return command_array[0].actuator.performMultiple(command_array)
            update_command = _.clone(_.last(commands))
            update_command.api = 
                flag: "U"
                args: []
            commands.push(update_command)
            return commands

        non_idle = _.keys(commands_by_quanta).length

        commands = _.values(commands_by_quanta)
        commands = _.flatten(commands)

        l = _.last(commands)
        total_time = l.t + l.async_offset + l.duration

        breakdown = _.range(0, total_time/Scheduler.quanta)
        # console.log 'breakdown', breakdown
        # console.log 'commands_by_quanta', commands_by_quanta
        breakdown = _.map breakdown, (q)->
            return if commands_by_quanta[q] then commands_by_quanta[q].length else 0


        commands: commands
        stats: 
            non_idle: non_idle
            quanta: Scheduler.quanta
            idle: parseInt(total_time / Scheduler.quanta) - non_idle
            n: commands.length
            time: total_time
            breakdown: breakdown


    @schedule: (commands, simulation = true, final_print=false)->
        info = Scheduler.quanta_update(commands)
        commands = info.commands
            
        Scheduler.pretty_print(commands, info.stats, final_print)
        
        play_ids = _.map commands, (command) ->
            id = _.delay(Scheduler.sendCommandTo, parseInt(command.t + command.async_offset), command, simulation)
            return id

        last = _.last(commands)
        async_end = parseInt(last.t + last.duration + last.async_offset)
        
        # console.log "END", async_end
        # endOfBehavior = ()->
        #     # console.log "SHUTDOWN"
        #     current_behavior.pause()
        #     current_behavior.scrubber.setTime(0)
        #     if current_behavior.data.repeat == "repeat"
        #         current_behavior.play(true)
        # id = _.delay endOfBehavior, async_end
        # play_ids.push(id) 
        rtn = 
            play_ids: play_ids
            start: _.first(commands).t
            end: async_end
        return rtn

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
            # actuator.channels[command.channel].param = command.param
            # am.updateChannels(actuator)
        else
            window.paper = ch.paper
            actuator.perform(command, false)
            # UPDATE SCENE GRAPH
            window.paper = ch.paper
            e = CanvasUtil.queryID(command.cid)
            if e
                switch actuator.actuator_type
                    when "STEPPER"
                        arms = CanvasUtil.query(e, {prefix: ["ARM"]})
                        pivot = CanvasUtil.query(e, {prefix: ["PIVOT"]})[0]
                        
                        _.each arms, (arm)->
                            arm.pivot = pivot.position.clone()
                            console.log -1 * command.expression
                            arm.rotation = -1 * command.expression
                    when "MOTOR"
                        console.log "MOTOR CANVAS UPDATE"
                    when "SERVO"
                        console.log "SERVO CANVAS UPDATE"
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
                        # tempCurve  = actuator.getSimulation().signal
                        red = new (paper.Color)('red')
                        blue = new (paper.Color)('#00A8E1')
                        # p = (actuator.channels.temperatureF.value - 72) / (110 - 72)
                        p = command.param
                        c = red.multiply(p).add(blue.multiply(1-p))
                        # debugger;
                        chromic = CanvasUtil.query(e, {prefix: ["CHROME"]})
                        # joule = CanvasUtil.query(e, {prefix: ["JOULE"]})
                        # CanvasUtil.setStyle joule, color: c
                        CanvasUtil.setStyle chromic, color: c
                        # temp = actuator.channels.temperatureF.value 
                        # temp = 94
                        # if temp > 94
                            # CanvasUtil.setStyle chromic, {opacity: 1}
                        # else if temp > 92 and temp <= 94 #cooling state
                        #     op = (temp - 92)/ 2
                        #     CanvasUtil.setStyle chromic, {opacity: op}
                        # else
                        #     CanvasUtil.setStyle chromic, {opacity: 0}
            

            # UPDATE WIDGETS
            content = actuator.expression
            content = if content.className == "Color" then content.toCSS() else content.toFixed(0)
            
            $('.popover.actuator .popover-content').html(content)
            _.each $('.popover.actuator input'), (input)->
                channel = $(input).attr('name')
                $(input).val(actuator.channels[channel].param)
            am.updateChannels(actuator)