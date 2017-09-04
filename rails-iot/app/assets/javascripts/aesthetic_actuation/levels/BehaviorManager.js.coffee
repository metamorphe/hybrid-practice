            
class window.Behavior
    @template: "behaviornode.template"
    @count: 0
    @library: {}
    @parseDOM: (dom)->
        return dom
    speed: 1
    constructor: (op)->
        #defaults
        @playing = false
        @play_ids = []

        @dom = @toDOM()
        _.extend this, _.omit op, "data"
        @_data = {}
        @data =  
            id: Behavior.count++
            name: "Behavior"
            period: 0
            stages: []
            actuators: []
            timescale: 10000
            repeat: "no-repeat"
        @data = 
            manager: new StageManager
                parent: this
                container: $('#behavior_environment')
        _.extend this, _.pick op, "data"    
        @container.append(@dom).addClass('accepted')
        Behavior.library[this.data.id] = this
        
    setStage: ()->
        return
    clearStage: ()->
        if @data.manager
            console.log "DATA", @data.manager.data
            _.each @data.manager.data.stages, (stage)->
                console.log "STAGE"
                stage = Stage.library[stage]
                _.each stage.data.tracks, (track)->
                    track = Track.library[track]
                    track.clearTrack()
                stage.clearActor()
    Object.defineProperties @prototype,
        data: 
            get: ->
                @_data
            set:(obj)->
                if _.isEmpty(obj) then return

                scope = this
                # BLANKET INTERNAL UPDATES
                @_data = _.extend(@_data, obj)
                @dom.data _.pick(@_data, "id", "name", "period", "repeat")
                #MANUAL INTERNAL UPDATES
                if @_data.manager
                    @_data.stages = @_data.manager.data.stages
                    @_data.period = @_data.manager.data.period

                # BLANKET UPDATES
                _.each @_data, (v, k)->
                    domupdate = scope.dom.find("." + k)
                    if domupdate.length > 0 then domupdate.html(v)
                    domupdate = scope.dom.find("." + k + "-length")
                    if domupdate.length > 0 then domupdate.html(v.length)

                # MANUAL UPDATES
                scope.dom.find(".period").html(TimeSignal.pretty_time(@_data.period))
                if @_data.name.length > 25
                    scope.dom.find(".name").html(@_data.name.slice(0, 25) + "...")

    toDOM: ()->
        dom = $(Behavior.template).clone().removeClass('template')
        dom.draggable
            cursorAt: { bottom: 5 }
            appendTo: '#ui2'
            revert: true
            scroll: false
            helper: ()->
                copy = $(this).clone()
                return copy;
    save: ()->
        return
    play: (fromStart = false)->
        scope = this
        if @playing 
            @pause()
            return
        else
            raw_commands = @data.manager.compile()
            if _.isEmpty raw_commands then return

            #RESTART/START_FROM_SCRUBBER
            t_start = if fromStart then 0 else scrubber.getTime()
            commands = _.filter raw_commands, (command)-> command.t > t_start
            if _.isEmpty commands 
                t_start = 0
                scrubber.reset()
                commands = raw_commands
                
            console.log "PLAYING", commands.length, commands
            
            start = _.first(commands).t
            end = _.last(commands).t + _.last(commands).duration + 100
            commands = _.each commands, (command)-> command.t = command.t - t_start

            # # SCHEDULE FOR PLAY
            scope.play_ids = Scheduler.schedule(commands, true)
            scrubber.play(t_start, end)
            @playing = true

            endOfBehavior = ()->
                scope.pause()
                scrubber.setTime(end)

            id = _.delay (()-> scope.pause()), end - t_start
    pause: ()->
        scrubber.pause()
        _.each @play_ids, (id)->
            clearTimeout(id)
        @play_ids = []
        @playing = false


   
    toCode: ()->
        @playing = false
        

class window.StageManager
    @count: 0
    @template: "behavior.template"
    constructor: (op)->
        _.extend this, _.omit op, "data"
        @dom = @toDOM()
        @_data = {}
        @data = 
            id: StageManager.count++
            name: "StageManager"
            stages: []
        _.extend this, _.pick op, "data"    
        @container.append(@dom)

    addStage: ()->
        sid = new Stage
            parent: this
            container: @dom.find("#stage")
            numTracks: 3
        this.data.stages.push sid.data.id
        this.data = {trigger: true}
        return
    compile: ()->
        cl = _.map @data.stages, (stage)->
            stage = Stage.library[stage]
            stage.compile()
        cl = _.compact _.flatten(cl)
        if cl.length == 0 
            alertify.notify "<b> Whoops! </b> Nothing to play... Add something to the time track.", 'error', 4
            return null
        else
            return _.sortBy cl, "t"


    removeStage: (stageID)->
        return
    toDOM: ()->
        scope = this
        dom = $(StageManager.template).clone().removeClass('template')

        return dom
    Object.defineProperties @prototype,
        data: 
            get: ->
                @_data
            set:(obj)->
                if _.isEmpty(obj) then return
                
                scope = this
                # BLANKET INTERNAL UPDATES
                @_data = _.extend(@_data, obj)
                @dom.data _.pick(@_data, "id")
                
                # BLANKET UPDATES
                _.each @_data, (v, k)->
                    domupdate = scope.dom.find("." + k)
                    if domupdate.length > 0 then domupdate.html(v)
                    
                # MANUAL UPDATES
                times = _.map @_data.stages, (id)->
                    return Stage.library[id].data.period
                @_data.period = _.max(times)
                # PROPAGATION UPDATES
                # console.log "PARENT", @parent.data
                if @parent.data
                    @parent.data = {update: true}

class window.Stage
    @count: 0
    @template: "acceptor.actuator.template"
    @library: {}
    constructor: (op)->
        _.extend(this, _.omit(op, "data"))  
        scope = this
        @dom = @toDOM()
        @trackparent = scope.parent.dom.find('#timetrack')
        @trackdom = $('<div>').addClass('track-dom')

        @_data = {}
        @data = 
            id: Stage.count++
            name: "Stage"
            tracks: []

        _.extend this, op   
        @container.append(@dom)
        @trackparent.append(@trackdom)

        _.extend this, _.pick op, "data"    

        
        Stage.library[this.data.id] = this
        return this
    clearActor: ()->
        return
    setStage: (actor)->        
        scope = this
        @trackdom.find("acceptor.datasignals").remove()
        scope.data.tracks = []
        scope.data = {trigger: true}
        scope.parent.data = {trigger: true}

        channels = actor.physical_channels()
        n = Object.size(channels)
        _.each channels, (v, channel)->
            t = new Track
                parent: scope
                container: scope.trackdom
                data: 
                    channel: channel
                    tracks: n
            
            scope.data.tracks.push t.data.id
            scope.data = {trigger: true}
            scope.parent.data = {trigger: true}

        return
    getActor: ()->
        actuator = @dom.find("actuator")
        if actuator.length == 0
            return null
        else
            return am.resolve(actuator)
    compile: ()->
        # $('')
        actor = @getActor()
        commands = _.map @data.tracks, (trackID)->
            track = Track.library[trackID]
            track.toCommands()
        commands = _.flatten(commands)
        if not actor and commands.length > 0
            alertify.notify "<b> Heads up! </b> Looks like you forgot to specify an actuator in the track.", 'error', 4
            return null
        else if not actor and commands.length == 0
            return null
        else
            console.log "ACTOR PERFORMING"
            commands = _.map commands, (command) -> 
                return actor.perform(command)
            return _.flatten commands
    toDOM: ()->
        scope = this
        dom = $(Stage.template).clone()
            .removeClass('template')
            .droppable
                accept: "actuator.draggable"
                classes: { "droppable-active": "droppable-default"}
                drop: (event, ui) ->
                    empty = $(this).html() == ""
                    actor = am.resolve(ui.draggable)

                    # stageLogic 
                    d = $(this).data()
                    if d.name == "Stage"
                        stage = Stage.library[d.id]
                        stage.setStage(actor)
                    else
                        console.log "Not a stage..."

                    choreo = Choreography.default()

                    # sync = $(this).parents('#async').length == 0
                    # compose = $(this).parents(".composition-design").length != 0
                    # if compose 
                    #   idx = $('#stage acceptor').index(this) - 1
                    #   choreos = $("#choreography-binders choreography")
                    #   console.log "ALMOST", idx, choreos.length
                    #   if idx < choreos.length
                    #     potential = Choreography.get($(choreos[idx]))
                    #     if potential
                    #       choreo = potential

                    num_to_accept = $(this).data().accept
                    ops = _.extend actor.form,
                        clear: num_to_accept == 1
                        target: $(this)
                        choreo: choreo
                    ActuatorManager.create ops
            
        return dom
    Object.defineProperties @prototype,
        data: 
            get: ->
                @_data
            set:(obj)->
                if _.isEmpty(obj) then return
                
                scope = this
                # BLANKET INTERNAL UPDATES
                @_data = _.extend(@_data, obj)
                @dom.data @_data
                
                # BLANKET UPDATES
                _.each @_data, (v, k)->
                    domupdate = scope.dom.find("." + k)
                    if domupdate.length > 0 then domupdate.html(v)
                
                # TIME UPDATE
                times = _.map @_data.tracks, (t)->
                    return Track.library[t].getTime()
                @_data.period = _.max times
                # MANUAL UPDATES
                if @parent.data
                    @parent.data = {update: true}
class window.Track
    @count: 0
    @library: {}
    @template: "acceptor.datasignals.template"
    constructor: (op)->
        _.extend this, _.omit op, "data"
        @_data = {}
        @dom = @toDOM()
        @data = 
            id: Track.count++
            name: "Track"
            period: 0
            num_to_accept: 100
            view: "intensity"
            semantic: "disabled"
            timescale: 10000
            exportable: "disabled"
            composeable: "enabled"
            channel: ""
            signals: []
        _.extend this, _.pick op, "data"    
        @container.append(@dom)
        Track.library[this.data.id] = this
    update: ()->
        @data = {trigger: true}
    addSignal: (ts, clear)->
        # console.log "ADDING SIGNAL", ts.id
        ts = ts.form
        dom = TimeSignal.create
            clear: clear
            target: @dom#$(this)
        signal = new TimeSignal(dom)
        signal.form = 
            track: @data.id
            signal: ts.signal 
            period: ts.period
        signal.dom.click()
        @dom.addClass('accepted')
        @update()
    getSignals: ()->
        return _.map @dom.find('datasignal'), (signal)-> return $(signal).data("id")
    getPeriod: ()->
        return
    clearTrack: ()->
        scope = this
        _.each @getSignals(), (signal)-> scope.removeSignal(signal)
        @dom.removeClass("accepted")
    removeSignal: (signalID)->
        tsm.getTimeSignal(signalID).dom.remove()
    toDOM: ()->
        scope = this
        dom = $(Track.template).clone().removeClass('template')
        
        dropBehavior = 
            accept: "datasignal.exportable", 
            classes: { "droppable-active": "droppable-default"},
            drop: (event, ui) ->
                num_to_accept = $(this).data().accept
                ts = tsm.resolve(ui.draggable)
                scope.addSignal(ts, num_to_accept)

        viewToggle = (e)->
            state =  scope.data.view
            orState = if state == "hue" then "intensity" else "hue"
            scope.data = {view: orState}

        $(dom).droppable(dropBehavior)
        $(dom).find('.view-toggle').click viewToggle
        $(dom).find('.trash').click ()-> scope.clearTrack()
        return dom
    toCommands: ()->

        scope = this
        timescale = @data.timescale
        width = @dom.width()
        commands =  _.map @getSignals(), (signal, i)->
            ts = tsm.getTimeSignal(signal)
            ts.dom.removeClass("selected")
            # penalty = if ts.dom.hasClass('selected') then 2 else 0
            
            # a = ts.dom.parent().offset() 
            # b = ts.dom.offset() 
            # pos = {top: b.top - a.top, left: b.left - a.left}
            pos = ts.dom.position()
            offset = (pos.left / width) * timescale
            # offset -= 81.3 * (i)
            commands = ts.command_list_data(ts.p_signal, {offset: offset})
            return commands
        commands = _.flatten commands
        commands = _.each commands, (command)->
            command.channel = scope.data.channel
        return commands
    getTime: ()->
        commands = @toCommands()
        if commands.length == 0 then return 0
        else return commands[commands.length - 1].t  + commands[commands.length - 1].duration
      
               
    Object.defineProperties @prototype,
        data: 
            get: ->
                return _.omit @_data, "trigger"
            set:(obj)->
                if _.isEmpty(obj) then return
                scope = this
                # BLANKET INTERNAL UPDATES
                @_data = _.extend(@_data, obj)
                @dom.data @_data
                
                    
                # VIEW UPDATES
                signals = _.map @_data.signals, (signal)-> tsm.getTimeSignal(signal)
                _.each signals, (s)-> s.form =  {view: scope._data.view}
                @_data.period = scope.getTime()

                if @_data.tracks == 1
                    @dom.removeClass("mini")
                else
                    @dom.addClass("mini")

                # MANUAL UPDATES

                if @parent.data
                    @parent.data = {update: true}
class window.Scrubber
    constructor: (op)->
        _.extend this, op
        @scrub_ids = []
        @dom.draggable
            containment: "parent"
            axis: "x"
            grid: [ 5, 200 ]
            scroll: false
    getPosition: (t)-> #convert to pixel location
        tt = $('behavior:not(.template)').find('#timetrack')
        timescale = @behavior.data.timescale
        w = tt.width()
        p = t/timescale * w
        return p
    toTime: (x)->
        tt = $('behavior:not(.template)').find('#timetrack')
        timescale = @behavior.data.timescale
        w = tt.width()
        t = timescale * x / w
        return t
    getTime: ()->
        tt = $('behavior:not(.template)').find('#timetrack')
        timescale = @behavior.data.timescale
        w = tt.width()
        t = timescale * @dom.position().left / w
        return t
    setTime: (t)->
        x = @getPosition(t)
        @setPosition(x)
    reset: ()->
        @setPosition(0)
    play: (start, end)-> # milliseconds
        scope = this
        duration = parseInt (end - start)
        startPos = Math.round @getPosition(start)
        endPos = Math.round @getPosition(end)
        @setPosition startPos
        scrubPlay = ()->
            scope.dom.css
                transition: 'left '+ duration+'ms linear'
                left: Math.round endPos
        _.delay scrubPlay, 10
        # id = _.delay (()-> scope.pause()), duration
        # @scrub_ids.push id
    setPosition: (x)->
        @dom.css
            transition : 'left 0s linear'
            left: x
    pause: ()->
        @dom.css
            transition : 'left 0s linear'
            left: @dom.position().left
        # _.each @scrub_ids, (id)-> clearTimeout(id)
    

class window.BehaviorManager
    constructor: (@op) ->
        scope = this
       

   
            
    