            
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
        @bindEvents()
        @scrubber = new Scrubber
            behavior: this
            dom: @data.manager.dom.find('#scrubber')
    
        if _.has op, "_load"
            @load()
    bindEvents: ()->
        scope = this
        @dom.click (e)->
            $('behavior').hide()
            window.current_behavior = scope
            scope.data.manager.dom.show()
            $("behaviornode.selected").not($(this)).removeClass('selected')
            $(this).addClass('selected')
            $('#behavior_name').val(current_behavior.data.name)
        @dom.find(".close").click (e)->
            e.preventDefault()
            e.stopPropagation()
            bid = $(this).parents('behaviornode').data().id
            b = Behavior.library[bid]
            b.data.manager.destroy()
            b.dom.remove() 
            delete Behavior.library[bid]
        @dom.find('.play').click (e)->
            e.preventDefault()
            e.stopPropagation()
            bid = $(this).parents('behaviornode').data().id
            b = Behavior.library[bid]
            b.dom.click()
            b.play()
            $(this).blur()


    load: ()->
        scope = this
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
                _.each signalData, (entry)->
                    ts = tsm.getTimeSignal(entry.signal)
                    signal = tracks[channel].addSignal(ts, clear=false)
                    signal.dom.css('left', scope.scrubber.getPosition(entry.offset))
    save: ()->
        x =  
            data: _.pick @data, "id", "name", "timescale", "repeat"
            manager: @data.manager.save()
        return x
    clearStage: ()->
        if @data.manager
            _.each @data.manager.data.stages, (stage)->
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
                    @_data.numActuators = @_data.manager.data.numActuators

                # BLANKET UPDATES
                _.each @_data, (v, k)->
                    domupdate = scope.dom.find("." + k)
                    if domupdate.length > 0 then domupdate.html(v)
                    domupdate = scope.dom.find("." + k + "-length")

                    if domupdate.length > 0 then domupdate.html(v.length)
                    if k == "stages"
                        abbv = if v.length == 1 then "stage" else "stages"
                        scope.dom.find(".abbv").html(abbv)

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
            commands = _.filter raw_commands, (command)-> command.t >= t_start
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

            # endOfBehavior = ()->
            #     console.log "SHUTDOWN"
            #     scope.pause()
            #     scope.scrubber.setTime(end)
            #     if scope.data.repeat == "repeat"
            #         scope.play(true)
            # async_end = end + _.last(commands).async_offset + 200
            # id = _.delay endOfBehavior, async_end - t_start
            # @play_ids.push(id) 
            
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
       

   
            
    