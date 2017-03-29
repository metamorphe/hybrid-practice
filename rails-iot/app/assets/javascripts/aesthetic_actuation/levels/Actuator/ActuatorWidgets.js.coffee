class window.Widget 
  @bindings = {}
  @bindings_on = true
  @enable: ->
    $(".toggle").click ()->
      $(this).parent().toggleClass('shrink')
      state = $(this).parent().hasClass('shrink')
      $(this).parent().find('.trigger').prop("disabled", state)
      if state
        $(this).find('span').removeClass('glyphicon-collapse-up')
        $(this).find('span').addClass('glyphicon-collapse-down')
      else
        $(this).find('span').removeClass('glyphicon-collapse-down')
        $(this).find('span').addClass('glyphicon-collapse-up')
    
    Widget.bindKeypress 96, (()-> $('event button.toggle').click()), true
    Widget.bindKeypress 49, (()-> $('event.actuation-design button.toggle').click()), true
    Widget.bindKeypress 50, (()-> $('event.signal-design button.toggle').click()), true
    Widget.bindKeypress 51, (()-> $('event.composition-design button.toggle').click()), true

    $(document).keypress (event) ->
      if Widget.bindings_on
        _.each Widget.bindings, (func, key)->
          if event.which == parseInt(key)
            func(event)
    return
  @bindKeypress: (key, func, ascii = false)->
    if not ascii
      key = parseInt(key.charCodeAt(0))
    # console.log "Binding", key
    Widget.bindings[key] = func;




class window.ActuatorWidgets 
  constructor: ()->
    console.log "ENABLING WIDGETS"
    @group = new Grouper
      track: $("#actuator-group")
      result: $("#group-result") 
      trigger: $("#group-button.trigger")
      clear: $("#group-clear")
      bindKey: 'g'
    @saver = new Saver
      track: $("#library.actuation-design .track-full")
      trigger: $("#library.actuation-design button.trigger")
      bindKey: 's'
    @async = new AsynchMorph
      track: $("#async .track-full")
      trigger: $("#async button")
      bindKey: 'a'
      slider: $("#async input")
    @comm = new Communicator
      trigger: $('button#live-connect')
      bindKey: 'l'
class window.ActuatorWidget
  @resolveTrack: (track)->
    _.map track.find('actuator'), (act)-> return am.resolve(act)
  resolveTrack: ()->
    ActuatorWidget.resolveTrack(@track)

class window.Communicator extends ActuatorWidget
  constructor: (op)->
    scope = this
    @live = false
    _.extend this, op
    @update()
    Widget.bindKeypress @bindKey, ()-> scope.trigger.click()
    @trigger.click (event)->
      event.preventDefault()
      $(this).blur()
      scope.live = not scope.live
      scope.update()
      if sc and sc.state == 1 and scope.live
        Alerter.warn
          strong: "YOU ARE LIVE!"
          msg: "Look at the device. Things won't update on the screen anymore."
          delay: 4000
          color: 'alert-success'
      else if not scope.live
        Alerter.warn
          strong: "ENTERING SIMULATION!"
          msg: "The simulation will now update. The device is no longer in use."
          delay: 4000
          color: 'alert-info'
  update: ()->
    if @live
      @trigger.addClass('btn-success') 
      if sc.state == 0
        $('#port-connect').click()
    else @trigger.removeClass('btn-success')

class window.AsynchMorph extends ActuatorWidget
  @MIN: 0
  @MAX: 1000
  constructor: (op)->
    # console.log "Async"
    scope = this
    _.extend this, op
    Widget.bindKeypress @bindKey, ()-> scope.trigger.click()
    @slider.on 'input', (e)->
      v = if this.value < AsynchMorph.MIN then AsynchMorph.MIN else this.value
      # console.log v
      _.each scope.resolveTrack(), (actuator)->
        actuator.form = {async_period: parseInt(v)}


class window.Saver extends ActuatorWidget
  constructor: (@op)->
    console.log "Saver"
    scope = this
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()
    
    @track = "actuator_group_library"
    @stage = "behavior_stage"
    @ts_library = "ts_library"

    

    # SAVE BEHAVIORS
    @op.trigger.click (event)->
      track_actuators = _.map scope.op.track.find('actuator'), (actor)-> return am.resolve(actor)
      scope.saveActors(scope.track, track_actuators)
      stage_actuators = bm.getActors()
      scope.saveActors(scope.stage, stage_actuators)



      signal_tracks = $(".signal-design .track-full").not("#hues")
      signal_tracks = _.map signal_tracks, (track)->
        signals = TimeWidget.resolveTrack(track, '.easing, .default')
        track_id = $(track).parent('event').attr('id')
        scope.saveActors(scope.ts_library + ":" + track_id, signals)


      Alerter.warn
        strong: "SAVED!"
        msg: "We won't forget a thing!"
        delay: 2000
        color: 'alert-success'

  save: (name, data)->
    key = @generateKey(name)
    if ws then ws.set(key, JSON.stringify(data))
  load:()->
    scope = this
    @trackLoad()
    @stageLoad()
    @signalLoad()
    
         

  
  saveActors: (name, actors)->
    # console.log "SAVING", name, actors.length

    data = _.map actors, (actor)-> 
      actor.form = {saved: true}
      if actor.easing then return null
      rtn =  _.extend actor.form,
        file: fs.getName()
        parent: actor.dom.parent().data().id
        test: ""
      # console.log "SAVING", rtn.parent
      return rtn
    data = _.compact(data)
    @save(name, data)
  
  
  loadActors: (name, loadFN)->
    scope = this
    key = @generateKey(name)
    rtn = ws.get(key)
    actuators = if _.isNull(rtn) then [] else JSON.parse(rtn)
    # console.log name, actuators.length, "FOUND"
    _.each actuators, (actuator)->
      loadFN(actuator)
    return actuators
  
  signalLoad: ()->
    scope = this
    signal_tracks = $(".signal-design .track-full").not("#hues")
    signal_tracks = _.map signal_tracks, (track)->
      track_id = $(track).parent('event').attr('id')
      # console.log "LOADING", track_id
      scope.loadActors scope.ts_library + ":" + track_id, (signal)->
        dom = TimeSignal.create
          clear: false
          target: $(track)
        signal = new TimeSignal dom, signal
  stageLoad: ()->
    scope = this
    @loadActors @stage, (actuator)->
      bm.loadStage(actuator)
  trackLoad: ()->
    scope = this
    @loadActors @track, (actuator)->
      ops = 
        clear: false
        target: scope.op.track
      ops = _.extend(ops, actuator)
      ActuatorManager.create ops
  generateKey: (name)->
    return [fs.getName(), name].join(':')
class window.Grouper extends ActuatorWidget
  constructor: (@op)->
    scope = this
    # console.log "GroupMaker"
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()
    @op.trigger.click (event)->
      acts = scope.op.track.find('actuator')
      ids = _.chain acts
        .map (dom)-> return am.resolve(dom).form.hardware_ids
        .flatten()
        .uniq()
        .sortBy()
        .value()
      if _.isEmpty(ids) then return
      # # ALL HAVE TO BE THE SAME TYPE...
      ops = _.extend am.resolve(_.first(acts)).form, 
        clear: true
        target: scope.op.result
        hardware_ids: ids
        title: ids.join(',')
      ActuatorManager.create ops      
      return

    
    

    
