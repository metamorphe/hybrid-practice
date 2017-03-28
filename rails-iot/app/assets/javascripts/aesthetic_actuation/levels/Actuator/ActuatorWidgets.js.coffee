class window.Widget 
  @bindings = {}
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
      _.each Widget.bindings, (func, key)->
        if event.which == parseInt(key)
          func(event)
    return
  @bindKeypress: (key, func, ascii = false)->
    if not ascii
      key = parseInt(key.charCodeAt(0))
    # console.log "Binding", key
    Widget.bindings[key] = func;

class window.ChoreographyWidget extends Widget
  @ACTUATORS = ()-> CanvasUtil.query paper.project, {prefix: ["NLED", "LED", "HEATER", "MOTOR"]}
  @NORMAL_SELECT = (path)->
    name = CanvasUtil.getPrefix path
    path.set
      strokeColor: "yellow"
      strokeWidth: 3
      shadowColor: "#00A8E1"
      shadowBlur: 5
  @STYLE_PARAMS = (path)->
    # styles = ["fillColor", "strokeWidth", "strokeColor", "shadowColor", "shadowOffset", "shadowBlur"]
    # return _.object(_.map styles, (s)-> [s, path[s]])
    style = 
      strokeColor: "black"
      strokeWidth: 1
      shadowColor: "#00A8E1"
      shadowBlur: 0
    return style
  deselect_all: ->
    scope = this
    flagged = CanvasUtil.query(paper.project, {flag: true})
     #DESELECT ALL
    _.each flagged, (el)->
      el.set scope.buffer[el.id]
      el.flag = false
       
  select: (ids)->
    scope = this
    window.paper = @paper
    elements = CanvasUtil.getIDs(ids)
    flagged = CanvasUtil.query(paper.project, {flag: true})

    @deselect_all()
    _.each elements, (el)->
      if not el.flag
        style = ChoreographyWidget.STYLE_PARAMS(el)
        scope.buffer[el.id] = style
        ChoreographyWidget.NORMAL_SELECT(el)
        el.flag = true
  darken: ()->   
    @canvas.css('background', "#111111")
    diffs = CanvasUtil.queryPrefix('DIF')
    CanvasUtil.set diffs, 'opacity', 0
  constructor: (op)->
    scope = this
    # console.log "ChoreographyWidget"
    @buffer = {}
    scope = this
    _.extend this, op
    @canvas = @dom.find('canvas')
    window.paper = @paper
    @darken()

    

    @tools = {}
    
    sT = new paper.Tool()
    sT.collectSelection = ()->
      actuators = ChoreographyWidget.ACTUATORS()
      ixts = CanvasUtil.getIntersections(sT.selectionPath, actuators)
      hits = _.map ixts, (ixt)-> 
        ChoreographyWidget.NORMAL_SELECT(ixt.path)
        return ixt.path.id
      hits = _.flatten([hits, sT.selection])
      sT.selection = _.sortBy(_.uniq(hits))
      scope.select(sT.selection)
      
    sT.onMouseDown = (e)->
      sT.selection = []
      sT.selectionPath = new Path
        strokeColor: "#00A8E1"
        strokeWidth: 4
        segments: [e.point]
      sT.collectSelection()
    sT.onMouseDrag = (e)->
      sT.selectionPath.addSegment e.point
      # sT.selectionPath.smooth
        # type: "asymmetric"
        # factor: 0.9
      sT.collectSelection()
    sT.onMouseUp = (e)->
      sT.selectionPath.addSegment e.point
      sT.selectionPath.remove()
      actuators = ChoreographyWidget.ACTUATORS()
      CanvasUtil.set(actuators, 'selected', false)
      
      elements = CanvasUtil.getIDs(sT.selection)
      hids = _.map elements, (el)-> return el.lid;

      if _.isEmpty(hids) then return
      console.log rgb2hex(elements[0].fillColor.toCSS())
      ops =
        clear: true
        target: $("#group-result")
        actuator_type: "HSBLED"
        hardware_ids: hids
        title: hids.join(',')
        constants: 
          color: rgb2hex(elements[0].fillColor.toCSS())
      
      dom = ActuatorManager.create ops   
      dom.click()

    @tools.selection = sT
    @canvas.hover ()-> 
      window.paper = scope.paper
      # paper.tool = scope.tools.selection
  extractDistanceMetric: ()->
    return @extractDistanceMetricTheta()
    # return @extractDistanceMetricFromCenter()
  extractDistanceMetricTheta: ()->
    window.paper = @paper 
    c = new paper.Path.Circle
      fillColor: "red"
      radius: 5
      position: paper.view.center
    actuators = ChoreographyWidget.ACTUATORS()
    dist = _.map actuators, (actuator)->
      hid: actuator.lid
      distance: actuator.position.clone().subtract(c.position).angle
    return @normalize(dist)

  extractDistanceMetricFromCenter: ()->
    window.paper = @paper 
    c = new paper.Path.Circle
      fillColor: "red"
      radius: 5
      position: paper.view.center
    actuators = ChoreographyWidget.ACTUATORS()
    dist = _.map actuators, (actuator)->
      hid: actuator.lid
      distance: c.position.getDistance(actuator.position)
    return @normalize(dist)
  normalize: (dist)->
    min = (_.min dist, (d)-> d.distance).distance
    max = (_.max dist, (d)-> d.distance).distance
    range = max - min
    dist = _.each dist, (d)-> 
      d.distance = (d.distance - min)/range
    dist = _.map dist, (d)-> [d.hid, d.distance]
    dist = _.object(dist)
    return dist


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
        signals = TimeWidget.resolveTrack(track) 
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
      return _.extend actor.form,
        file: fs.getName()
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

    
    

    
