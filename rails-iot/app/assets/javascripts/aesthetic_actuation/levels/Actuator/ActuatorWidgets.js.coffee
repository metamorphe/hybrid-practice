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
    
    Widget.bindKeypress "u", ()-> $('event button.toggle').click()
    Widget.bindKeypress "i", ()-> $('event.actuation-design button.toggle').click()
    Widget.bindKeypress "o", ()-> $('event.signal-design button.toggle').click()
    Widget.bindKeypress "p", ()-> $('event.composition-design button.toggle').click()

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
    name = Artwork.getPrefix path
    path.set
      strokeWidth: 2
      strokeColor: "#00A8E1"
    

  constructor: (op)->
    console.log "ChoreographyWidget"
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
        ixt.path.selected = true
        return ixt.path.lid
      hits = _.flatten([hits, sT.selection])
      sT.selection = _.sortBy(_.uniq(hits))

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
      sT.collectSelection()
      console.log sT.selection
      sT.selectionPath.remove()
      actuators = ChoreographyWidget.ACTUATORS()
      CanvasUtil.set(actuators, 'selected', false)
      
      # act = am.getActuator(actuator.expresso_id)
      # act = am.clone act.op.dom.parents("actuator"),
      #     activate: true
      #     clear: true
      #     parent: $("#actuator-generator")
      # act.op.dom.click()

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

class window.Saver extends Widget
  constructor: (@op)->
    console.log "Saver"
    scope = this
    @name = "actuator_group_library"
    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()

    @op.trigger.click (event)->
      info = _.chain scope.op.track.find('actuator')
        .map (dom)->  
          act = am.getActuator(parseInt($(dom).data 'id'))
          ids: act.hardware_id
          canvas_id: act.canvas_id
          expression: rgb2hex(act.expression.toCSS())
          type: act.op.type
          title: act.getTitle()
          file: fs.getName()
        .value()
      # console.log "INFO", info
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
    console.log "LOADING", actuators.length, "FROM CACHE"
    if scope.op.track.length == 0 then return 
    _.each actuators, (actuator)->
      actuatorops = _.extend actuator, 
        parent: scope.op.track
        activate: true
      act = am.clone null, actuatorops
      
class window.Grouper extends Widget
  constructor: (@op)->
    scope = this
    console.log "GroupMaker"
    $('[contenteditable]').on('focus', ()->
      scope = $(this)
      scope.data 'before', scope.html()
      return scope;
    ).on('blur keyup paste', ()->
      scope = $(this);
      if scope.data('before') != scope.html()
        scope.data 'before', scope.html()
        scope.trigger('change')
      return scope;
    )
    $('label.title[contenteditable').on 'change', ()->
      actor = am.resolve($(this).parents('actuator'))

    

    Widget.bindKeypress @op.bindKey, ()-> scope.op.trigger.click()
    # @op.clear.click (event)->
    #   console.log "CLEARING"
    #   scope.op.track.html("")
    #   scope.op.result.html("")
    #   return
    # @op.trigger.click (event)->
    #   ids = _.chain scope.op.track.find('actuator')
    #     .map (dom)-> return $(dom).data 'hardware-id'
    #     .flatten()
    #     .uniq()
    #     .value()
    #     .sort()
    #   if _.isEmpty(ids) then return
    #   act = scope.op.track.find('actuator:first')
    #   act = am.clone act, 
    #     title: "Group"
    #     group: ids
    #     activate: true
    #     clear: true
    #     parent: scope.op.result
    #   return
    # $('#name-button').on 'click', ->
    #   name = $(this).siblings('input').val()
    #   $(this).parents('event').find('.track-unit').find('label.title:first').html name
    #   return
    # $('#group input').on 'input', ->
    #   name = $(this).val()
    #   $(this).parents('event').find('.track-unit').find('label.title:first').html name
    #   return
    
