            
class window.Behavior
    @template: "behaviornode.template"
    @count: 0
    @library: {}
    @parseDOM: (dom)->
        return dom
    speed: 1
    constructor: (op)->
        #defaults
        scope = this
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
        @dom.click (e)->
            $('behavior').hide()
            window.current_behavior = scope
            scope.data.manager.dom.show()
            $("behaviornode.selected").not($(this)).removeClass('selected')
            $(this).addClass('selected')
        @scrubber = new Scrubber
            behavior: this
            dom: @data.manager.dom.find('#scrubber')
    
        if _.has op, "_load"
            @load()
        
    load: ()->
        scope = this
        console.log "LOAD", @_load
        stagesN = @_load.length
        manager = @data.manager

        @dom.click()
        _.each @_load, (stageData, stageID)->
            stage = manager.addStage()
            stage.data = {id: stageID}
            actor = am.getActuator(stageData.actuator)
            stage.addActor(stage, actor)
            tracks = _.map stage.data.tracks, (track)->
                t = Track.library[track]
                return [t.data.channel, t]
            tracks = _.object tracks
            _.each stageData.tracks, (signalData, channel)->
                # console.log channel, "ADD", signalData
                _.each signalData, (entry)->
                    ts = tsm.getTimeSignal(entry.signal)
                    signal = tracks[channel].addSignal(ts, clear=false)
                    signal.dom.css('left', scope.scrubber.getPosition(entry.offset))
        # console.log @_load
    save: ()->
        return @data.manager.save()
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
    
    play: (fromStart = false)->
        scope = this
        if @playing 
            @pause()
            return
        else
            raw_commands = @data.manager.compile()
            if _.isEmpty raw_commands then return

            #RESTART/START_FROM_SCRUBBER
            t_start = if fromStart then 0 else @scrubber.getTime()
            commands = _.filter raw_commands, (command)-> command.t > t_start
            if _.isEmpty commands 
                t_start = 0
                @scrubber.reset()
                commands = raw_commands
                            
            start = _.first(commands).t
            end = _.last(commands).t + _.last(commands).duration + 100
            commands = _.each commands, (command)-> command.t = command.t - t_start

            # # SCHEDULE FOR PLAY
            scope.play_ids = Scheduler.schedule(commands, true)
            @scrubber.play(t_start, end)
            @playing = true

            endOfBehavior = ()->
                scope.pause()
                scope.scrubber.setTime(end)

            id = _.delay (()-> scope.pause()), end - t_start
    pause: ()->
        @scrubber.pause()
        _.each @play_ids, (id)->
            clearTimeout(id)
        @play_ids = []
        @playing = false


   
    toCode: ()->
        @playing = false
        




class window.BehaviorManager
    constructor: (@op) ->
        scope = this
       

   
            
    