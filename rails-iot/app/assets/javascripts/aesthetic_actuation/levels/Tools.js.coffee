window.initTools = (paper)->
  window.paper = paper
  selectionTool = makeSelectionTool()
  # choreographyTool = makeChoreographyTool()
  # console.log "MAKING TOOLS", selectionTool, choreographyTool
  # $('#projectviewer canvas').click ()->
  #   window.paper = paper
  # # $('#choreo-tool').click (e)->
  #   selectionTool.activate()
  #   $('.tool').not(this).removeClass('selected active')
  #   $(this).addClass('selected active')
  $('#selection-tool').click (e)->
    choreographyTool.activate()
    $('.tool').not(this).removeClass('selected active')
    $(this).addClass('selected active')
# makeChoreographyTool= ()->
#   cT = new paper.Tool()
#   cT.initSession = ()->
#     cT.arrows = []
#   cT.clearSession = ()->
#     actuators = ChoreographyWidget.ACTUATORS()
#     style = {color: "white"}
#     CanvasUtil.setStyle actuators, style
#     CanvasUtil.set(cT.arrows, "opacity", 0)
#     session = cT.getSession()
#     cT.arrows = []
#     return session
#   cT.getSession = ()->
#     ids = _.map cT.arrows, (arrow)-> return arrow.id
#     return ids
#   cT.loadSession = (ids)->
#     if ids.length == 0 
#       cT.initSession()
#       return
#     cT.arrows = CanvasUtil.getIDs(ids)
#     CanvasUtil.set(cT.arrows, "opacity", 1)
#   cT.onMouseDown = (e)->
#     cT.arrow = new paper.Group
#       name: "ARROW: arrow"
#       t_0: 0
#       t_f: 1
#     cT.arrows.push(cT.arrow)
#     cT.arrow_path = new paper.Path
#       parent: cT.arrow
#       name: "ARROWPATH"
#       strokeColor: ChoreographyWidget.ARROW_COLOR
#       strokeWidth: 5
#       shadowColor: "#000000"
#       shadowBlur: 5
#       segments: [e.point]
#     cT.arrow.pathway = cT.arrow_path
#     cT.ink_blot = new paper.Path.Circle
#       parent: cT.arrow
#       fillColor: ChoreographyWidget.ARROW_COLOR
#       radius: 5
#       strokeColor: "#EEEEEE"
#       strokeWidth: 2
#       shadowColor: "#000000"
#       shadowBlur: 0
#       position: e.point
#   cT.onMouseDrag = (e)->
#     cT.arrow_path.addSegment e.point
#   cT.onMouseUp = (e)->
#     cT.arrow_path.addSegment e.point
#     lastPoint = cT.arrow_path.getPointAt(cT.arrow_path.length)
#     prevPoint = cT.arrow_path.getPointAt(cT.arrow_path.length - 5)
#     v = lastPoint.subtract(prevPoint)
#     arrow_head = new paper.Group
#       parent: cT.arrow
#     arrow_triangle = new paper.Path.RegularPolygon
#       parent: arrow_head
#       sides: 3
#       radius: 10
#       fillColor: ChoreographyWidget.ARROW_COLOR
#       shadowColor: "#000000"
#       shadowBlur: 0
#       strokeWidth: 3
#     # arrow_circle = new paper.Path.Circle
#     #   parent: arrow_head
#     #   fillColor: "red"
#     #   radius: 5
#     #   strokeColor: "#EEEEEE"
#     #   strokeWidth: 2
#     #   shadowColor: "#000000"
#     #   shadowBlur: 0
#     #   position: arrow_triangle.bounds.topCenter.add(new paper.Point(0, -2.5))
#     # arrow_circle.sendToBack()
#     arrow_head.set
#       pivot: arrow_head.bounds.bottomCenter.clone()
#       position: lastPoint
#     arrow_head.rotation = v.angle + 90

#     if cT.arrow_path.length < 5
#       cT.arrow.remove()
#       return 
#     s = Choreography.selected()
#     if s and cT.getSession
#       s.form = {ids: cT.getSession()}
#       s.view_order()
#   return cT

makeSelectionTool = ()->
  return new paper.Tool
    name: "selectionTool"
    buffer: {}
    STYLE_PARAMS: (path)->
      # styles = ["fillColor", "strokeWidth", "strokeColor", "shadowColor", "shadowOffset", "shadowBlur"]
      # return _.pick path, styles
      style = 
        strokeColor: "black"
        strokeWidth: 1
        shadowColor: "#00A8E1"
        shadowBlur: 0
      return style
    
    NORMAL_SELECT: (path)->
      path.set
        strokeColor: "#f2f20d"
        strokeWidth: 3
        shadowColor: "#00A8E1"
        shadowBlur: 10
 
    update: ()->
      scope = this
      
      
      #DESELECT ALL
      flagged = CanvasUtil.query(paper.project, {flag: true})
      
      _.each flagged, (el)->
        el.set scope.buffer[el.id]
        el.flag = false


      this.selection = _.sortBy(_.uniq(_.flatten(this.selection)))
      elements = CanvasUtil.getIDs(this.selection)

      _.each elements, (el)->
        if not el.flag
          if not el.bufferSet
            style = scope.STYLE_PARAMS(el)
            scope.buffer[el.id] = style
            scope.bufferSet = true
            
          scope.NORMAL_SELECT(el)
          el.flag = true      
      return this
    detectHits: ()->
      scope = this
      actuators = Artwork.ACTUATORS()
      ixts = CanvasUtil.getIntersectionsBounds(this.selectionPath, actuators)
      hits = _.map ixts, (ixt)-> 
        scope.selection.push ixt.path.id
        scope.update()
        return ixt.path.id
      this.selection.push(hits)
      this.update()
    onMouseDown: (e)->
      this.selection = []
      this.update()
      actuators = Artwork.ACTUATORS()

      direct_click = _.filter actuators, (actuator)->
        return actuator.contains(e.point)

      if not _.isEmpty direct_click
        direct_hits = _.map direct_click, (path)-> return path.id
        this.selection.push(direct_hits)
        this.update()
      
      this.selectionPath = new Path
        strokeColor: "#00A8E1"
        strokeWidth: 4
        segments: [e.point]

      this.detectHits()
    onMouseDrag:  (e)->
      this.selectionPath.addSegment e.point
      this.selectionPath.smooth
        type: "asymmetric"
        factor: 0.9
      this.detectHits()
    onMouseUp: (e)->
      this.selectionPath.addSegment e.point
      this.selectionPath.remove()
      actuators = Artwork.ACTUATORS()
      CanvasUtil.set(actuators, 'selected', false)
      
      elements = CanvasUtil.getIDs(this.selection)
      hids = _.map elements, (el)-> return el.lid;
      
      # CREATE ACTUATOR GROUP!
      if _.isEmpty(hids) then return

      # DIFFERENT CREATION MAPPINGS
      template = elements[0]
      prefix = CanvasUtil.getPrefix(template)

      switch prefix
        when "NLED"
          c = template.fillColor
          c.saturation = 1
          c = rgb2hex(c.toCSS())
          ops =
            clear: true
            target: $("#group-result")
            actuator_type: "HSBLED"
            hardware_ids: hids
            title: hids.join(',')
            constants: 
              color: "#FF0000"
        when "PUMP"
          ops =
            clear: true
            target: $("#group-result")
            actuator_type: "PUMP"
            hardware_ids: hids
            title: hids.join(',')
            constants: {}
        when "HEATER"
          ops =
            clear: true
            target: $("#group-result")
            actuator_type: "HEATER"
            hardware_ids: hids
            title: hids.join(',')
            constants: {}
              
      dom = ActuatorManager.create ops   
      dom.click()

