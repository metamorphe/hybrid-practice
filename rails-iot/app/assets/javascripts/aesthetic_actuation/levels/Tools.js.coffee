
window.initTools = (paper)->
  window.selectionTool = makeSelectionTool()
  selectionTool.init()
  window.choreographyTool = makeChoreographyTool()
  console.log "MAKING TOOLS", selectionTool, choreographyTool
  

  $('#choreo-tool').click (e)->
    selectionTool.deactivate()
    choreographyTool.activate()
    choreographyTool.initialize()
    $('.tool').not(this).removeClass('selected active')
    $(this).addClass('selected active')
  $('#selection-tool').click (e)->
    choreographyTool.deactivate()
    selectionTool.activate()
    $('.tool').not(this).removeClass('selected active')
    $(this).addClass('selected active')
makeChoreographyTool= ()->
  cT = new paper.Tool
    name: "ChoreographyTool"
    initialize: ()->
      items = paper.project.getItems 
        choreography: true
      _.each items, (item)->
        item.visible = false
      
      if not window.active_choreo
        alertify.notify "<b>WHOOPS!</b> Don't forget to select who you want to direct with a choreography.", 'error', 4 
        return
      items = CanvasUtil.getIDs(window.active_choreo.form.paperPaths)
      _.each items, (item)->
        item.visible = true
      this.createSlider()
    makeArrowRef: (line_base, offset)->
      scope = this
      CanvasUtil.call CanvasUtil.queryPrefix("ARROW_REF"), "remove"
      
      ref = new paper.Group
        name: "ARROW_REF: ref"
        choreography: true
        parent: this.slider

      if offset < 10
        return
      arrow_ref = new paper.Path.Line
        parent: ref
        from: line_base.getPointAt(0)
        to: line_base.getPointAt(offset - 10)

      n = arrow_ref.length
      tempTicks = _.range(0, n , 2)
      _.each tempTicks, (tick)->
        pt = arrow_ref.getPointAt(tick)
        tick = new paper.Path.Circle
          radius: 5/2
          parent: ref
          position: pt.clone()
          fillColor: Choreography.temperatureColor(tick/n)
      if offset < 20
        return
      lastPoint = arrow_ref.getPointAt(n - 14)
      prevPoint = arrow_ref.getPointAt(n - 18)
      v = lastPoint.subtract(prevPoint)
      arrow_triangle = new paper.Path.RegularPolygon
          parent: ref
          sides: 3
          radius: 10
          fillColor: Choreography.temperatureColor(1)
          shadowColor: "#000000"
          shadowBlur: 0
          strokeWidth: 3
      arrow_triangle.set
          pivot: arrow_triangle.bounds.bottomCenter.clone()
          position: lastPoint
      arrow_triangle.rotation = v.angle + 90

    createSlider: ()->
      scope = this

      this.slider = new paper.Group
        choreography: true
      
      c = ChoreographyWidget.ARROW_COLOR.clone()
      c.brightness -= 0.3

      line_base = new paper.Path.Line
        parent: this.slider
        from: paper.view.bounds.bottomLeft.clone().add(20, 0)
        to: paper.view.bounds.bottomRight.clone().subtract(20, 0)
        strokeColor: c
        radius: 5

      offset = active_choreo.form.async_period / Choreography.SCALE * line_base.length

      scope.makeArrowRef(line_base, offset)
      
      textColor = if ch.dark then "white" else "black"
      this.slider.text = new PointText
        parent: this.slider
        content: TimeSignal.pretty_time(active_choreo.form.async_period)
        fillColor: textColor
        fontFamily: "Avenir"
        fontWeight: 'bold'
        fontSize: 12
        justification: "right"
      
      this.slider.text.set
        pivot: this.slider.text.bounds.bottomRight.clone()
        position: line_base.bounds.topRight.clone().add(paper.Point(-10, 0))
        

      behavior_sim = new paper.Path.Circle
        parent: this.slider
        radius: 10
        position: line_base.getPointAt(0).clone()
        fillColor: "#5cb85c"
        onMouseDown: ()->
          scope = this
          n = line_base.length
          _.map CanvasUtil.getIDs(active_choreo.form.paperPaths), (arrow)->
            arrow = arrow.pathway
      
            msg = new paper.Path.Circle
              parent: scope.slider
              radius: 10
              position: arrow.getPointAt(0).clone()
              fillColor: "#5cb85c"

            ch.ps.add
              name: "Message"
              start: 0
              duration: active_choreo.form.async_period
              onRun: (e)->
                offset = arrow.length * e.parameter
                msg.bringToFront()
                msg.position = arrow.getPointAt(offset)
              onDone: (e)->
                msg.remove()
              onKill: (e)->
                msg.remove()


          ch.ps.add
            name: "Choreography Tester"
            start: 0
            duration: active_choreo.form.async_period
            onRun: (e)->
              offsetPt = line_base.getNearestPoint(scope.parent.scrubber.position)
              offset = line_base.getOffsetOf(offsetPt)
              scope.bringToFront()
              scope.position = line_base.getPointAt(offset * e.parameter).clone()
            onDone: (e)->
              scope.position = line_base.getPointAt(0).clone()
            onKill: (e)->
              scope.position = line_base.getPointAt(0).clone()

      

      scrubber = new paper.Path.Circle
        parent: this.slider
        radius: 10
        position: line_base.getPointAt(offset)
        fillColor: ChoreographyWidget.ARROW_COLOR
        scope: scope
        onMouseEnter: (e)->
          c = ChoreographyWidget.ARROW_COLOR.clone()
          c.brightness -= 0.2
          this.fillColor = c
        onMouseLeave: (e)->
          this.fillColor = ChoreographyWidget.ARROW_COLOR
        onMouseDown: (e)->
          this.position = line_base.getNearestPoint(e.point)
        onMouseDrag: (e)->
          this.position = line_base.getNearestPoint(e.point)
          offset = line_base.getOffsetOf(this.position)
          t = offset / line_base.length
          t *= Choreography.SCALE
          this.scope.makeArrowRef(line_base, offset)
          this.parent.text.content = TimeSignal.pretty_time(t)
        onMouseUp: (e)->
          this.position = line_base.getNearestPoint(e.point)
          offset = line_base.getOffsetOf(this.position)
          t = offset / line_base.length
          t *= Choreography.SCALE
          this.scope.makeArrowRef(line_base, offset)
          active_choreo.form.async_period = t
      this.slider.scrubber = scrubber
      this.slider.position.y -= 20
      behavior_sim.bringToFront()
      this.slider.scrubber.bringToFront()
    deactivate: ()->
      items = paper.project.getItems 
        choreography: true
      _.each items, (item)->
        item.visible = false
      if this.slider
        this.slider.remove()
        this.slider = null
      console.log "Deactivating Choreo Tool"
    onMouseDown: (e)->
      scope = this
      if this.slider.scrubber.contains(e.point)
        this.arrow = null
        return

      inkblots = paper.project.getItems
        ink_blot: true
        visible: true

      hitBlot = _.filter inkblots, (blot)->
        blot.contains(e.point)

      if not _.isEmpty hitBlot
        _.each hitBlot, (hit)->
          active_choreo.form.paperPaths = _.without(active_choreo.form.paperPaths, hit.parent.id)
          hit.parent.remove()
        this.arrow = null
        actuators = CanvasUtil.getIDs(active_choreo.actuator.canvas_ids)
        active_choreo.resolve(actuators)
        return

      this.arrow = new paper.Group
        choreography: true
        name: "ARROW: arrow"
        t_0: 0
        t_f: 1
      
      window.active_choreo.form.paperPaths.push(this.arrow.id)
      this.arrow_path = new paper.Path
        parent: this.arrow
        name: "ARROWPATH"
        # strokeColor: "black"
        strokeColor: ChoreographyWidget.ARROW_COLOR
        strokeWidth: 8
        shadowColor: "#000000"
        shadowBlur: 5
        segments: [e.point]
      this.arrow.pathway = this.arrow_path

      this.ink_blot = new paper.Path.Circle
        ink_blot: true
        parent: this.arrow
        fillColor: "#EEEEEE"
        radius: 10
        strokeColor: ChoreographyWidget.ARROW_COLOR
        strokeWidth: 2
        shadowColor: "#000000"
        shadowBlur: 5
        position: e.point


      removeAffordance = ()->
        scope.ink_blot.onMouseEnter = (e)->
          this.fillColor = "#d9534f"
        scope.ink_blot.onMouseLeave = (e)->
          this.fillColor =  ChoreographyWidget.ARROW_COLOR
      _.delay removeAffordance, 1000

    onMouseDrag: (e)->
      if this.arrow
        this.arrow_path.addSegment e.point
    
    onMouseUp: (e)->
      scope = this
      if this.arrow
        this.arrow_path.addSegment e.point  
        lastPoint = this.arrow_path.getPointAt(this.arrow_path.length)
        prevPoint = this.arrow_path.getPointAt(this.arrow_path.length - 5)
        v = lastPoint.subtract(prevPoint)
        arrow_head = new paper.Group
          parent: this.arrow
        arrow_triangle = new paper.Path.RegularPolygon
          parent: arrow_head
          sides: 3
          radius: 10
          fillColor: ChoreographyWidget.ARROW_COLOR#Choreography.temperatureColor(1)
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

        


        if this.arrow_path.length < 5
          this.arrow.remove()
          return 
        #10 radius
        #5 stroke radius

        # add_ticks
        # major_tick = this.arrow_path.length / 5.0
        # major_tick_length = 8
        # major_tick_width = 2
        # major_tick_color = ChoreographyWidget.ARROW_COLOR.clone()
        # major_tick_color.brightness -= 0.2
        # ticks = _.range(major_tick, this.arrow_path.length - 1, major_tick)
        # _.each ticks, (tick)->
        #   pt = scope.arrow_path.getPointAt(tick)
        #   nm = scope.arrow_path.getNormalAt(tick)
        #   nm.length = major_tick_length
        #   tick = new paper.Path.Line
        #     parent: scope.arrow
        #     from: pt.clone().subtract(nm)
        #     to: pt.clone().add(nm)
        #     strokeColor: major_tick_color
        #     strokeWidth: major_tick_width
        #     shadowColor: "#000000"
        #     shadowBlur: 0
        #     strokeWidth: 3
        this.arrow_path.smooth()
        n = this.arrow_path.length
        tempTicks = _.range(0, n , 2)
        _.each tempTicks, (tick)->
          pt = scope.arrow_path.getPointAt(tick)
          tick = new paper.Path.Circle
            radius: 5/2
            parent: scope.arrow
            position: pt.clone()
            fillColor: Choreography.temperatureColor(tick/n)


        this.ink_blot.bringToFront()

        actuators = CanvasUtil.getIDs(active_choreo.actuator.canvas_ids)
        active_choreo.resolve(actuators)
  #     s = Choreography.selected()
  #     if s and cT.getSession
  #       s.form = {ids: cT.getSession()}
  #       s.view_order()
  return cT

makeSelectionTool = ()->
  return new paper.Tool
    name: "selectionTool"
    deactivate: ()->
      console.log "Deactivating Selection Tool"
      this.selection = []
      this.update()
    init: ()->
      items = paper.project.getItems
        className: /^(?!Layer).*$/
      
      _.each items, (item)-> 
        item.saveable = true
        if item.className != "Shape"
          item.selectable = true
          item.activeStyle = item.clone().set
            selectable: false
            fillColor: "blue"
            strokeColor: "yellow"
            strokeWidth: 5
            opacity: 0.3
            visible: false
            active: false
    update: ()->
      this.selection = _.sortBy(_.uniq(_.flatten(this.selection)))
      elements = CanvasUtil.getIDs(this.selection)

      # RESET 
      items = paper.project.getItems
        selectable: true
        className: /^(?!Layer).*$/
        active: true

      _.each items, (item)-> 
        item.active = false
        item.activeStyle.visible = false

      # SET
      _.each elements, (element)->
        if element.selectable
          element.active = true
          element.activeStyle.visible = true
  
      return this
    detectHits: ()->
      scope = this
      actuators = Artwork.ACTUATORS()
      # OPTIMIZATION
      actuators = _.omit actuators, (actuator)->
        return _.contains scope.selection, actuator.id
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

      direct_hits = _.filter actuators, (actuator)->
        return actuator.contains(e.point).id

      this.selection.push(direct_hits)
      this.update()
    
      this.selectionPath = new Path
        strokeColor: "#00A8E1"
        strokeWidth: 4
        segments: [e.point]

      this.detectHits()
    onMouseDrag:  (e)->
      this.selectionPath.addSegment e.point
      # this.selectionPath.smooth
      #   type: "asymmetric"
      #   factor: 0.9
      this.detectHits()
    onMouseUp: (e)->
      this.selectionPath.addSegment e.point
      this.selectionPath.remove()
      this.selectionPath = null
      # actuators = Artwork.ACTUATORS()
      # # CanvasUtil.set(actuators, 'selected', false)
      
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
        when "STEPPER"
          ops =
            clear: true
            target: $("#group-result")
            actuator_type: "STEPPER"
            hardware_ids: hids
            title: hids.join(',')
            constants: {}
        when "SERVO"
          ops =
            clear: true
            target: $("#group-result")
            actuator_type: "SERVO"
            hardware_ids: hids
            title: hids.join(',')
            constants: {}
        when "MOTOR"
          ops =
            clear: true
            target: $("#group-result")
            actuator_type: "SERVO"
            hardware_ids: hids
            title: hids.join(',')
            constants: {}
              
      dom = ActuatorManager.create ops   
      dom.click()

