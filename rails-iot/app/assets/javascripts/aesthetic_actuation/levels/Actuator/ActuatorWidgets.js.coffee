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
    
    Widget.bindKeypress "U", ()-> $('event button.toggle').click()
    Widget.bindKeypress "I", ()-> $('event.actuation-design button.toggle').click()
    Widget.bindKeypress "O", ()-> $('event.signal-design button.toggle').click()
    Widget.bindKeypress "P", ()-> $('event.composition-design button.toggle').click()

    $(document).keypress (event) ->
      _.each Widget.bindings, (func, key)->
        if event.shiftKey
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
      bindKey: 'G'
    @saver = new Saver
      track: $("#library.actuation-design .track-full")
      trigger: $("#library.actuation-design button.trigger")
      bindKey: 'S'

class window.Saver extends Widget
  constructor: (@op)->
    console.log "Saver"
    scope = this
    @name = "actuator_group_library"
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()

    @op.trigger.click (event)->
      info = _.chain scope.op.track.find('actuator')
        .map (actor)->  
          actor = am.resolve(actor)
          actor.form = {saved: true}
          return _.extend actor.serialize(),
            file: fs.getName()
        .value()
      console.log "INFO", info
      scope.save(info)
  generateKey: ->
    return [fs.getName(), @name].join(':')
  save: (data)->
    console.log "SAVING"
    key = @generateKey()
    if ws then ws.set(key, JSON.stringify(data))
  load: ->
    scope = this
    key = @generateKey()
    actuators = JSON.parse(ws.get(key))
    _.each actuators, (actuator)->
      # console.log "\tLOAD", actuator
      ops = 
        clear: false
        target: scope.op.track
      ops = _.extend(ops, actuator)
      ActuatorManager.create ops
      
class window.Grouper extends Widget
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

    
    

    
