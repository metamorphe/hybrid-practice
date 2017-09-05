window.SPECIAL_KEYS = [32]
$ ->
  $(document).keypress (event) ->
    console.log event
    # console.log event.which, Widget.bindings     

    if Widget.bindings_on
      if event.ctrlKey or _.includes window.SPECIAL_KEYS, event.which
        console.log "WIDGET ACTIVATED", event.which
        event.preventDefault()
        _.each Widget.bindings, (func, key)->
          if event.which == parseInt(key)
            func(event)
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
    

    fullscreenToggle = (dom)->
      $(dom).toggleClass('fullscreen')
      # if $(dom).hasClass('fullscreen')
        # $(dom).detach().appendTo('body')
      # else
        # $(dom).detach().appendTo('#levels')

    Widget.bindKeypress 1, (()-> $('event button.toggle').click()), true
    Widget.bindKeypress 2, (()-> fullscreenToggle($('event#behaviors'))), true
    Widget.bindKeypress 49, (()-> $('event.actuation-design button.toggle').click()), true
    Widget.bindKeypress 50, (()-> $('event.signal-design button.toggle').click()), true
    Widget.bindKeypress 51, (()-> $('event.composition-design button.toggle').click()), true
    Widget.bindKeypress 6, (()-> $('#fullscreen').click()), true
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
      bindKey: 7 #G
    @saver = new Saver
      track: $("#actuator-library .track-full")
      trigger: $("#library.actuation-design button.trigger")
      bindKey: 19 #S
    @async = new AsynchMorph
      track: $("#async .track-full")
      trigger: $("#async button")
      bindKey: 3 #C
      slider: $("#async input")
    # @comm = new Communicator
    #   trigger: $('button#live-connect')
    #   bindKey: 'l'

class window.ActuatorWidget
  @resolveTrack: (track)->
    _.map track.find('actuator'), (act)-> return am.resolve(act)
  resolveTrack: ()->
    ActuatorWidget.resolveTrack(@track)



class window.AsynchMorph extends ActuatorWidget
  @MIN: 0
  @MAX: 1000
  constructor: (op)->
    # console.log "Async"
    scope = this
    _.extend this, op
    Widget.bindKeypress @bindKey, (()-> scope.trigger.click()), true
    @slider.on 'input', (e)->
      v = if this.value < AsynchMorph.MIN then AsynchMorph.MIN else this.value
      # console.log v
      _.each scope.resolveTrack(), (actuator)->
        actuator.form = {async_period: parseInt(v)}


class window.Saver extends ActuatorWidget
  constructor: (@op)->
    console.log "Saver"
    scope = this
    Widget.bindKeypress @op.bindKey, (()-> scope.saveActuation()), true
    
    @track = "actuator_group_library"
    @stage = "behavior_stage"
    @ts_library = "ts_library"
    @behaviors = "behaviors"

    
    # SAVE BEHAVIORS
    @op.trigger.click (event)-> scope.saveActuation()

  saveBehaviors: ()->
    behaviors = _.map Behavior.library, (behavior, id)->
      behavior.save()
    @save @behaviors, behaviors

  saveActuation: (e)->
    scope = this
    track_actuators = _.map @op.track.find('actuator'), (actor)-> return am.resolve(actor)
    @saveActors(scope.track, track_actuators)

    # stage_actuators = bm.getActors()
    # scope.saveActors(scope.stage, stage_actuators)
    # signal_tracks = $(".signal-design .track-full").not("#hues")
    # signal_tracks = _.map signal_tracks, (track)->
      # signals = TimeWidget.resolveTrack(track, '.easing, .default')
      # track_id = $(track).parent('event').attr('id')
    @saveActors(scope.ts_library, tsm.timesignals)
    @saveBehaviors()

    alertify.notify "<b>SAVED!</b> We won't forget a thing!", 'success', 4
  
  save: (name, data)->
    key = @generateKey(name)
    if ws then ws.set(key, JSON.stringify(data))
  load:()->
    scope = this
    @trackLoad()
    @signalLoad()
    @behaviorLoad()

    
         

  behaviorLoad: ()->
    key = @generateKey(@behaviors)
    rtn = ws.get(key)
    
  
    behaviors = if _.isNull(rtn) then [] else JSON.parse(rtn)
    behaviors = _.map behaviors, (behaviorData, behaviorID)->
      new Behavior
        container: $('#behavior-library .track-full')
        _load: behaviorData
    window.current_behavior = behaviors[0]
    # window.current_behavior = new Behavior
    #   container: $('#behavior-library .track-full')
    #   data:
    #     name: "Stagger"
    
    playBehavior =  (event)-> 
      event.preventDefault()
      window.current_behavior.play()
    Widget.bindKeypress 32, playBehavior, true        

    $('#add-stage').click ()->
      window.current_behavior.data.manager.addStage()
    # $('#add-stage').click()


  saveActors: (name, actors)->
    data = _.map actors, (actor)-> 
      actor.form = {saved: true}
      if actor.easing then return null
      rtn =  _.extend actor.form,
        file: fs.getName()
        # parent: actor.dom.parent().data().id
        test: ""
      return rtn
    data = _.compact(data)
    @save(name, data)
  
  
  loadActors: (name, loadFN)->
    scope = this
    key = @generateKey(name)
    rtn = ws.get(key)
    actuators = if _.isNull(rtn) then [] else JSON.parse(rtn)
    _.each actuators, (actuator)->
      loadFN(actuator)
    return actuators
  
  signalLoad: ()->
    scope = this
    scope.loadActors scope.ts_library, (signal)->
      dom = TimeSignal.create
        clear: false
        target: $("#library.signal-design .track-full")
      signal = new TimeSignal dom, signal
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
    Widget.bindKeypress @op.bindKey, (()-> scope.op.trigger.click()), true
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

    
    

    
