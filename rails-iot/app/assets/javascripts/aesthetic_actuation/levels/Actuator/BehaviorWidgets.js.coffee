class window.ChoreographyWidget extends Widget
  @SESSION_COUNTER: 0
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
  # get_choreography: ()->
  #   CanvasUtil.queryPrefix("")
  # load_choreography: (ids)->
  #   CanvasUtil.set(CanvasUtil.getIDs(ids), "opacity", 1)
  update: ()->
    if @mode == "choreography"
      @paper.tool = @tools.choreography

      s = Choreography.selected()
      if s and @prev_selected.id != s.id
        @prev_selected.form = {ids: @paper.tool.clearSession()}
        @prev_selected = s
      else
        @paper.tool.loadSession(s.form.ids)
      @selection_trigger.removeClass('btn-success')
      $('#remove-arrows').prop('disabled', false)
      $('#view-order').prop('disabled', false)
    if @mode == "selection"
      s = Choreography.selected()
      if s and @paper.tool.clearSession
        s.form = {ids: @paper.tool.clearSession()}
      $('choreography').removeClass('selected')
      $('#add-arrows span.info').html("INACTIVE")
      $('#remove-arrows').prop('disabled', true)
      $('#view-order').prop('disabled', true)
      @paper.tool = @tools.selection

      # @chor_trigger.removeClass('btn-success')
      @selection_trigger.addClass('btn-success')
      # @last_session = if @paper.tool.clearSession then @paper.tool.clearSession()
      # console.log "SAVING CHOREO TO ", @active
      # if @active then @active.data('ids', @last_session)
     

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
    @mode = "selection"
    @prev_selected = {id: -1}
    @prev_mode = "choreography"
    @chor_trigger = $('#add-arrows')
    @chor_clear = $('#remove-arrows')
    @selection_trigger = $('#selection-tool')
    $('#view-order').click ()->
      s = Choreography.selected()
      if s
        s.view_order()
    @selection_trigger.click ()->
      scope.mode = "selection"
      scope.update()
    # @chor_trigger.click ()->
    #   scope.mode = "choreography"
    #   scope.update()
    @chor_clear.click ()->
      if scope.mode != "choreography"
        Alerter.warn
          strong: "WHOOPS!"
          msg: "We aren't in choreography mode. Hit the arrow button above to begin."
          delay: 2000
          color: 'alert-danger'
        return
      scope.paper.tool.clearSession()
      CanvasUtil.set ChoreographyWidget.ACTUATORS(), 'fillColor', '#ffffff'


    
    @buffer = {}
    scope = this
    _.extend this, op
    @canvas = @dom.find('canvas')
    window.paper = @paper
    @darken()
    @tools = {}
    @tools.selection = @makeSelectionTool()
    @tools.choreography = @makeChoreographyTool()
    @canvas.hover ()-> 
      window.paper = scope.paper
    @update()
    
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
  @ARROW_COLOR: new paper.Color("#00A8E1")
  makeChoreographyTool: ()->
    scope = this
    cT = new paper.Tool()
    cT.initSession = ()->
      cT.arrows = []
    cT.clearSession = ()->
      CanvasUtil.set(cT.arrows, "opacity", 0)
      session = cT.getSession()
      cT.arrows = []
      return session
    cT.getSession = ()->
      ids = _.map cT.arrows, (arrow)-> return arrow.id

      return ids
    cT.loadSession = (ids)->
      if ids.length == 0 
        cT.initSession()
        return
      cT.arrows = CanvasUtil.getIDs(ids)
      CanvasUtil.set(cT.arrows, "opacity", 1)
    cT.onMouseDown = (e)->

      cT.arrow = new paper.Group
        name: "ARROW: arrow"
        t_0: 0
        t_f: 1
      cT.arrows.push(cT.arrow)
      cT.arrow_path = new paper.Path
        parent: cT.arrow
        name: "ARROWPATH"
        strokeColor: ChoreographyWidget.ARROW_COLOR
        strokeWidth: 5
        shadowColor: "#000000"
        shadowBlur: 5
        segments: [e.point]
      cT.arrow.pathway = cT.arrow_path
      cT.ink_blot = new paper.Path.Circle
        parent: cT.arrow
        fillColor: ChoreographyWidget.ARROW_COLOR
        radius: 5
        strokeColor: "#EEEEEE"
        strokeWidth: 2
        shadowColor: "#000000"
        shadowBlur: 0
        position: e.point
    cT.onMouseDrag = (e)->
      cT.arrow_path.addSegment e.point
    cT.onMouseUp = (e)->
      cT.arrow_path.addSegment e.point
      lastPoint = cT.arrow_path.getPointAt(cT.arrow_path.length)
      prevPoint = cT.arrow_path.getPointAt(cT.arrow_path.length - 5)
      v = lastPoint.subtract(prevPoint)
      arrow_head = new paper.Group
        parent: cT.arrow
      arrow_triangle = new paper.Path.RegularPolygon
        parent: arrow_head
        sides: 3
        radius: 10
        fillColor: ChoreographyWidget.ARROW_COLOR
        shadowColor: "#000000"
        shadowBlur: 0
        strokeWidth: 3
      # arrow_circle = new paper.Path.Circle
      #   parent: arrow_head
      #   fillColor: "red"
      #   radius: 5
      #   strokeColor: "#EEEEEE"
      #   strokeWidth: 2
      #   shadowColor: "#000000"
      #   shadowBlur: 0
      #   position: arrow_triangle.bounds.topCenter.add(new paper.Point(0, -2.5))
      # arrow_circle.sendToBack()
      arrow_head.set
        pivot: arrow_head.bounds.bottomCenter.clone()
        position: lastPoint
      arrow_head.rotation = v.angle + 90
      s = Choreography.selected()
      if s and cT.getSession
        s.form = {ids: cT.getSession()}
        s.view_order()

      
    return cT
  makeSelectionTool: ()->
    scope = this
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

      actuators = ChoreographyWidget.ACTUATORS()
      direct_click = _.filter actuators, (actuator)->
        return actuator.contains(e.point)
      if not _.isEmpty direct_click
        console.log "direct_click"
        sT.selection = _.map direct_click, (path)-> return path.id
      else
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
    return sT