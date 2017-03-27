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
      strokeWidth: 2
      strokeColor: "#00A8E1"
  @STYLE_PARAMS = (path)->
    # styles = ["fillColor", "strokeWidth", "strokeColor", "shadowColor", "shadowOffset", "shadowBlur"]
    # return _.object(_.map styles, (s)-> [s, path[s]])
    style = 
      strokeColor: new paper.Color("black")
      strokeWidth: 1
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
     
  constructor: (op)->
    scope = this
    console.log "ChoreographyWidget"
    @buffer = {}
    scope = this
    _.extend this, op
    @canvas = @dom.find('canvas')
    

    window.paper = @paper

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
      sT.selectionPath.smooth
        type: "asymmetric"
        factor: 0.9
      sT.collectSelection()
    sT.onMouseUp = (e)->
      sT.selectionPath.addSegment e.point
      sT.selectionPath.remove()
      actuators = ChoreographyWidget.ACTUATORS()
      CanvasUtil.set(actuators, 'selected', false)
      
      hids = CanvasUtil.getIDs(sT.selection)
      hids = _.map hids, (el)-> return el.lid;

      if _.isEmpty(hids) then return
      ops =
        clear: true
        target: $("#actuator-generator")
        actuator_type: "HSBLED"
        hardware_ids: hids
        title: hids.join(',')
        constants: 
          color: "#FFFFFF"
      
      dom = ActuatorManager.create ops   
      dom.click()

    @tools.selection = sT
    @canvas.hover ()-> 
      window.paper = scope.paper
      # paper.tool = scope.tools.selection

  extractDistanceMetric: ()->
    window.paper = @paper 
    c = new paper.Path.Circle
      fillColor: "red"
      radius: 5
      position: paper.view.center
    actuators = ChoreographyWidget.ACTUATORS()
    dist = _.map actuators, (actuator)->
      hid: actuator.lid
      distance: c.position.getDistance(actuator.position)
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
class window.ActuatorWidget
  @resolveTrack: (track)->
    _.map track.find('actuator'), (act)-> return am.resolve(act)
  resolveTrack: ()->
    ActuatorWidget.resolveTrack(@track)

class window.AsynchMorph extends ActuatorWidget
  @MIN: 0
  @MAX: 1000
  constructor: (op)->
    console.log "Async"
    scope = this
    _.extend this, op
    Widget.bindKeypress @bindKey, ()-> scope.trigger.click()
    @slider.on 'input', (e)->
      v = if this.value < AsynchMorph.MIN then AsynchMorph.MIN else this.value
      console.log v
      _.each scope.resolveTrack(), (actuator)->
        actuator.form = {async_period: parseInt(v)}

class window.Saver extends ActuatorWidget
  constructor: (@op)->
    console.log "Saver"
    scope = this
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()
    
    @track = "actuator_group_library"
    @stage = "behavior_stage"
    @op.trigger.click (event)->
      track_actuators = _.map scope.op.track.find('actuator'), (actor)-> return am.resolve(actor)
      scope.saveActuators(scope.track, track_actuators)
      stage_actuators = bm.getActors()
      scope.saveActuators(scope.stage, stage_actuators)

  
  saveActuators: (name, actors)->
    console.log "SAVING", name, actors.length
    data = _.map actors, (actor)-> 
      actor.form = {saved: true}
      return _.extend actor.serialize(),
        file: fs.getName()
    console.log data
    @save(name, data)
  save: (name, data)->
    key = @generateKey(name)
    if ws then ws.set(key, JSON.stringify(data))
  loadActuator: (name, loadFN)->
    scope = this
    key = @generateKey(name)
    rtn = ws.get(key)
    actuators = if _.isNull(rtn) then [] else JSON.parse(rtn)
    console.log name, actuators.length, "FOUND"
    _.each actuators, (actuator)->
      loadFN(actuator)
    return actuators
  load:()->
    @trackLoad()
    @stageLoad()
  stageLoad: ()->
    scope = this
    @loadActuator @stage, (actuator)->
      bm.loadStage(actuator)
  trackLoad: ()->
    scope = this
    @loadActuator @track, (actuator)->
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
    console.log "GroupMaker"
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

    
    

    
