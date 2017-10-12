class window.StageManager
    @count: 0
    @template: "behavior.template"
    save: ()->
        data = {}
        _.each @_data.stages, (id)->
            data[id] = Stage.library[id].save()
        return data
    destroy: ()->
        @dom.remove()
        _.each @data.stages, (stageID)->
            console.log 'DESTROYING STAGE', stageID
            s = Stage.library[stageID]
            s.destroy()
    constructor: (op)->
        _.extend this, _.omit op, "data"
        @dom = @toDOM()
        @_data = {}
        StageManager.count++
        @data = 
            id: guid()
            name: "StageManager"
            stages: []
        _.extend this, _.pick op, "data"    
        @container.append(@dom)
        @dom.hide()

    addStage: ()->
        sid = new Stage
            parent: this
            container: @dom.find("#stage")
            numTracks: 3
        this.data.stages.push sid.data.id
        this.data = {trigger: true}
        return sid
        
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
                numActuators = 0
                times = _.map @_data.stages, (id)->
                    stage =  Stage.library[id]
                    numActuators += stage.data.numActuators
                    return stage.data.period
                @_data.period = _.max(times)
                @_data.numActuators = numActuators
                # PROPAGATION UPDATES
                # console.log "PARENT", @parent.data
                if @parent.data
                    @parent.data = {update: true}

class window.Stage
    @count: 0
    @template: "acceptor.actuator.template"
    @library: {}
    destroy: ()->
        @dom.remove()
        _.each @data.tracks, (trackID)->
            t = Track.library[trackID]
            t.destroy()
        delete Stage.library[@data.id]
    save: ()->
        saveData = {}
        if @getActor()
            saveData.actuator = @getActor().id
        if @data.tracks.length > 0
            saveData.tracks = {}
            _.each @data.tracks, (trackID)->
                t = Track.library[trackID]
                channel = t.data.channel
                saveData.tracks[channel] = t.save()
        return saveData
    constructor: (op)->
        _.extend(this, _.omit(op, "data"))  
        scope = this
        @dom = @toDOM()
        @trackparent = scope.parent.dom.find('#timetrack')
        @trackdom = $('<div>').addClass('track-dom')

        @_data = {}
        @data = 
            id: guid()
            name: "Stage"
            tracks: []
            dtracks: []
            numActuators: 0
        Stage.count++

        _.extend this, op   
        @container.append(@dom)
        @trackparent.append(@trackdom)

        _.extend this, _.pick op, "data"    
        
        Stage.library[this.data.id] = this
        return this
    clearActor: ()->
        return
    setStage: (actor)->   
        if not actor
            console.error "ACTOR NOT FOUND"
            return
        scope = this
        @trackdom.find("acceptor.datasignals").remove()
        scope.data.tracks = []
        scope.data = {trigger: true, numActuators: actor.form.hardware_ids.length}        
        scope.parent.data = {trigger: true}

        channels = actor.physical_channels()
        derived = actor.derived_channels()

        n = Object.size(channels) + Object.size(derived)
        tracks = _.each channels, (v, channel)->
            t = new Track
                parent: scope
                container: scope.trackdom
                data: 
                    channel: channel
                    tracks: n
                    derived: false
            
            scope.data.tracks.push t.data.id
            scope.data = {trigger: true}
            scope.parent.data = {trigger: true}
            return [channel, t]
        
        dtracks = _.each derived, (v, channel)->
            t = new Track
                parent: scope
                container: scope.trackdom
                data: 
                    channel: channel
                    tracks: n
                    derived: true
            scope.data.dtracks.push t.data.id
            scope.data = {trigger: true}
            scope.parent.data = {trigger: true}

        tracks = _.object(tracks)


        return tracks
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
                    stage = Stage.library[$(this).data().id]
                    scope.addActor(stage, am.resolve(ui.draggable))
        return dom
    addActor: (stage, actor)->
        if not actor
            console.error "ACTOR NOT FOUND"
            return
        empty = stage.dom.html() == ""
        # stageLogic 
        d = stage.dom.data()
        num_to_accept = stage.dom.data().accept
        
        if d.name == "Stage"
            stage = Stage.library[d.id]
            stage.setStage(actor)
            actor.stage = @data.id
        else
            console.log "Not a stage..."
        
        ops = _.extend actor.form,
            clear: num_to_accept == 1
            target: stage.dom
        ActuatorManager.create ops
            
        
    Object.defineProperties @prototype,
        data: 
            get: ->
                @_data
            set:(obj)->
                if _.isEmpty(obj) then return
                
                scope = this
                if obj.id and @parent.data.stages.length > 0
                    if obj.id != @_data.id
                        delete Stage.library[@_data.id]
                        Stage.library[obj.id] = this
                        idx = @parent.data.stages.indexOf(@_data.id)
                        @parent.data.stages[idx] = obj.id
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
    destroy: ()->
        @dom.remove()
        delete Track.library[@data.id]
    constructor: (op)->
        _.extend this, _.omit op, "data"
        @_data = {}
        @dom = @toDOM(op.data.derived)
        Track.count++
        @data = 
            id: guid()
            name: "Track"
            period: 0
            num_to_accept: 100
            view: "intensity"
            semantic: "disabled"
            timescale: Choreography.SCALE
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
        return signal
    save: ()->
        scope = this
        signals = @getSignals()
        signalData = _.map signals, (signalID)->
            ts = tsm.getTimeSignal(signalID)
            timeOffset = scope.parent.parent.parent.scrubber.toTime(ts.dom.position().left)
            return {signal: signalID, offset: timeOffset}
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
    toDOM: (derived)->
        scope = this
        dom = $(Track.template).clone().removeClass('template')
        if derived
            dom.find('.trash').remove()
            dom.find('.view-toggle').remove()
        else
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
            if pos.left < 0
                pos.left = 0
            offset = (pos.left / width) * timescale
            # offset -= 81.3 * (i)
            commands = ts.command_list_data(ts.data, {offset: offset})
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
                
                console.log "TRACK", obj.derived
                if obj.derived
                    @dom.addClass("derived")    
                # VIEW UPDATES
                signals = _.map @getSignals(), (signal)-> tsm.getTimeSignal(signal)
                _.each signals, (s)-> 
                    s.form =  {view: scope._data.view}
                @_data.period = scope.getTime()

                switch @_data.tracks
                    when 1
                        @dom.removeClass("mini")
                    when 2
                        @dom.removeClass("mini")
                        @dom.addClass("mini-2")
                    when 3
                        @dom.addClass("mini")
                        

                # MANUAL UPDATES

                if @parent.data
                    @parent.data = {update: true}