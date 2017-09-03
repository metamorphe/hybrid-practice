            
class window.Behavior
    @template: "behaviornode.template"
    @count: 0
    @library: {}
    @parseDOM: (dom)->
        return dom
    speed: 1
    constructor: (op)->
        #defaults
        @dom = @toDOM()
        _.extend this, _.omit op, "data"
        @_data = {}
        @data =  
            id: Behavior.count++
            name: "Behavior"
            period: 0
            stages: []
            actuators: []
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
    play: ()->
        return
    stop: ()->
        return
    toCode: ()->
        return

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
        @_data = {}
        @data = 
            id: Stage.count++
            name: "Stage"
            tracks: []

        _.extend this, op   
        @container.append(@dom)
        _.extend this, _.pick op, "data"    

        _.times @numTracks, (i)->
            t = new Track
                parent: scope
                container: scope.parent.dom.find('#timetrack')
            scope.data.tracks.push t.data.id
            scope.data = {trigger: true}
            scope.parent.data = {trigger: true}
        Stage.library[this.data.id] = this
        return this
    setActor: ()->
        return
    toDOM: ()->
        scope = this
        dom = $(Stage.template).clone().removeClass('template')
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
                if @parent.data
                    @parent.data = {update: true}
class window.Track
    @count: 0
    @library: {}
    @template: "acceptor.datasignals.template"
    constructor: (op)->
        _.extend(this, _.omit(op, "data"))  
        @_data = {}
        @dom = @toDOM()
        @data = 
            id: Track.count++
            name: "Track"
            num_to_accept: 100
            view: "intensity"
            semantic: "disabled"
            timescale: 10000
            tracks: 3
            exportable: "disabled"
            composeable: "enabled"
            signals: []
        _.extend this, _.pick op, "data"    
        @container.append(@dom)
        Track.library[this.data.id] = this
        
    addSignal: (ts, clear)->
        ts = ts.form
        dom = TimeSignal.create
            clear: clear
            target: @dom#$(this)
        signal = new TimeSignal(dom)
        signal.form = 
            track: @id
            signal: ts.signal 
            period: ts.period
        signal.dom.click()
        @dom.addClass('accepted')
        @data.signals.push signal.id
        @data = {trigger: true}
    getPeriod: ()->
        return
    clearTrack: ()->
        scope = this
        _.each @data.signals, (signal)-> scope.removeSignal(signal)
        @data = {signals: []}
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
            console.log "state", state
            orState = if state == "hue" then "intensity" else "hue"
            scope.data =
                view: orState

        $(dom).droppable(dropBehavior)
        $(dom).find('.view-toggle').click viewToggle
        $(dom).find('.trash').click ()-> scope.clearTrack()
        return dom
    Object.defineProperties @prototype,
        data: 
            get: ->
                return @_data
            set:(obj)->
                if _.isEmpty(obj) then return
                scope = this
                # BLANKET INTERNAL UPDATES
                @_data = _.extend(@_data, obj)
                @dom.data @_data
                
                    

                # VIEW UPDATES
                signals = _.map @_data.signals, (signal)-> tsm.getTimeSignal(signal)
                _.each signals, (s)-> s.form =  {view: scope._data.view}
    
                # MANUAL UPDATES

                if @parent.data
                    @parent.data = {update: true}
        
class window.BehaviorManager
    constructor: (@op) ->
        # $("*").not('.popover').not('actuator').not('datasignal').not('track-full').not('.track-unit').click (event)->
        #   console.log this
        #   $('.popover').fadeOut(100)
        scope = this
        @play_ids = []
        @playing = false
        @scrub_ids = []
        @activateDragAndDrop()
        $("button#compose").click(()-> scope.play())
        # $("button#add-stage").click(()-> scope.addStage())
        Widget.bindKeypress 32,((event) ->
            event.preventDefault()
            $('#compose').click()), true
        @throttlePlay = _.throttle @play, 2000

    getActors: ()->
        actuators = _.map $('#stage').find('actuator'), (actor)-> return am.resolve(actor)      
    loadStage: (actuator)->
        if _.isUndefined(actuator.parent)
            template = bm.addStage()
        else
            template = $('#stage acceptor[data-id='+ actuator.parent+']')   
            
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
        console.log "PLAYING"
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
        choreography = _.map actors, (actor, i)->
            actor = am.resolve(actor)
            channels = _.keys(actor.physical_channels()).sort()
            channel_commands = _.map channels, (channel, j)->
                track_j = i * 3 + j
                track = $(signal_tracks[track_j])
                timescale = track.data().timescale
                width = track.width()

                commands =  _.map track.find('datasignal'), (signal, k)->
                    a = $(signal).parent().offset()
                    b = $(signal).offset()
                    pos = {top: b.top - a.top, left: b.left - a.left}
                    offset = (pos.left / width) * timescale

                    # COMPILING INSTRUCTIONS PER CHANNEL
                    ts = tsm.resolve(signal)
                    if not ts then return []

                    commands = ts.command_list_data(ts.p_signal, {offset: offset})
                    commands = _.map commands, (command) -> 
                        cl = actor.perform(channel, command)
                        return cl
                    commands =_.flatten(commands)
                    return commands
                return _.flatten(commands)
            return _.flatten(channel_commands)
        choreography = _.flatten(choreography)
        return _.sortBy(choreography, "t")
            
    