class window.TimeSignal
  @OPTIMIZED: false # + 4 for BORDER ==> 88
  @DEFAULT_HEIGHT: 74 # + 4 for BORDER ==> 88
  @DEFAULT_WIDTH: 100 # + 4 for BORDER ==> 88
  @COUNTER: 0
  @DEFAULT_PERIOD: 3000
  @DEFAULT_RESOLUTION: 100 # ms/sample
  @MAX: 10000, 
  @RESOLUTION: 1/256
  @MIN: 100,
  @PERSISTENCE_OF_VISION: 1 / 30 * 1000
  @DEFAULT_STYLE: 
    signal_fill: {fillColor: '#FF9912'}
    signal_stroke: {strokeWidth: 3, strokeColor: '#333'}
    axes: {strokeWidth: 2, strokeColor: 'blue', opacity: 0.5} 

  constructor: (@dom, set)->
    set = set or {}
    _.extend this, TimeSignal.DEFAULT_STYLE
    # @id = 
    TimeSignal.COUNTER++
    @id = set.id or guid()
    @dom.data('id', @id)
    @canvas = @dom.find('canvas')

    # DEFAULTS
    @period = TimeSignal.DEFAULT_PERIOD
    @signal = [0, 0, 0]
    @track = null
    @tracks = 1
    @semantic = true
    @composeable = false
    @timescale = 10000
    @view = "intensity"
    @force_period = 1000
    @force_period_flag = false
    @exportable = true

    # SETUP CONTAINER
    w = @dom.parent().width()
    h = @dom.parent().height()
    @canvas.remove()
    @canvas = $("<canvas></canvas>")
    @dom.append(@canvas)
    new_h = if h * 0.9 < 76 then h * 0.9 else 76

    if not @semantic
      t_op = 
        width: @period/@timescale * w
        height: TimeSignal.DEFAULT_HEIGHT / @tracks
    else
      t_op = 
        width: "100%"
        height: new_h
    @paper = Utility.paperSetup(@canvas, t_op)
    track_data = @processTrack @dom.parent()

    ops = _.extend track_data, @dom.data()
    ops = _.omit ops, "id"
    ops = _.extend ops, set
    @form = ops
    tsm.add.apply(tsm, [this])

  processTrack: (track)->
    if _.isUndefined track then return {}
    t = _.clone(track.data())
    t = _.omit(t, "id", "forcePeriodFlag", "gammaCorrective")

    t.tracks =  t.tracks or @tracks
    t.composeable =  t.composeable == "enabled" 
    t.semantic =  t.semantic == "enabled" 
    t.timescale =  t.timescale or @timescale
    t.view =  t.view or @view
    t.draggable =  t.draggable == "enabled" 
    t.force_period_flag =  t.forcePeriodFlag == "enabled" 
    t.force_period =  parseInt(t.force_period) or @force_period
    t.exportable =  t.exportable == "enabled" 
    return t

  Object.defineProperties @prototype,
    form:
      get: -> 
        id: @id
        view: @view
        signal: @signal
        period: @period
        semantic: @semantic
        perceptual: @perceptual
        draggable: @draggable
        composeable: @composeable
        timescale: @timescale 
        tracks: @tracks 
        track: @track
        force_period_flag: @force_period_flag 
        gamma_corrected: @gamma_corrected 

      set: (obj) ->
        # console.log "OBJ", obj
        scope = this
        if _.isEmpty(obj) then return
        window.paper = @paper
        prev = @form
        _.extend(this, obj)
        if @force_period_flag then @period = parseInt(@force_period)

        if @exportable
          @dom.addClass('exportable')
        if @draggable
          @dom.addClass('draggable')
        if @composeable
          @dom.addClass('composeable')


        # NEEDS CANVAS REFRESH
        canvas_refresh = ["semantic", "timescale", "tracks"]
        canvas_refresh = _.some canvas_refresh, (t)-> return scope[t] != prev[t]
        period_change = (not @semantic) and (@period != prev.period)
        canvas_refresh or= period_change

        if canvas_refresh
          # console.log "REFRESH"
          w = @dom.parent().width()
          h = @dom.parent().height()
          new_h = if h * 0.9 < 76 then h * 0.9 else 76
          @canvas.remove()
          @canvas = $("<canvas></canvas>")
          @canvas.css
            height: "100%"
            width: "100%"
          @dom.append(@canvas)
          if not @semantic
            t_op = 
              width: @period/@timescale * w
              height: TimeSignal.DEFAULT_HEIGHT / @tracks
          else
            t_op = 
              width: TimeSignal.DEFAULT_WIDTH
              height: new_h

          @paper = Utility.paperSetup(@canvas, t_op)
         
        
        # NEEDS VISUAL REFRESH
        @data = @signal
        @p_signal = @signal
        if @track
          track = Track.library[@track]
          if track
            channel = track.data.channel
            actuator = track.parent.getActor()
            @data = @applyActuator(actuator, channel)
            @p_signal = @data
            # console.log "APPLY", @data


        @_visuals()
        @dom.data @form
        @dom.data
          content: TimeSignal.pretty_time(@period)
        return @form

  @popover: (dom)->
    dom.data
      container: "#ui2"
      content: "500ms"
      placement: 'left'
      template: '<div class="timesignal popover" role="tooltip"><div class="arrow"></div><a class="dismiss btn pull-right"><span class="glyphicon glyphicon-remove"></span></a><div class="popover-content"></div><input min="0" max="10000" step="100" type="range"/></div>'
      trigger: 'focus'
    # dom.popover()
    
    dom.click (event)->  
      # event.stopPropagation()
      $('datasignal').not(this).popover('hide')
    
      tag = this.tagName
      $(this).focus()
      $(tag).removeClass 'selected'
      $(this).addClass 'selected'
    return dom

  popover_behavior: (event)->
    scope = this

    $('datasignal').not(@dom).popover('hide')
    @dom.popover('show')
    $('.timesignal .dismiss').click ()-> $(this).parents('.popover').fadeOut(100)
    $('.timesignal.popover').find('input').val(@period)
    $('.timesignal.popover').find('input').on 'input', ()->
      pop = $(this).parents('.popover')
      t = $(this).val()
      pop.find('.popover-content').html(TimeSignal.pretty_time(t))
      scope.form = {period: t}
    
  @create: (op)->
    if op.clear then op.target.find('datasignal').remove()
    dom = $('<datasignal><canvas></canvas></datasignal>')
    dom = TimeSignal.popover(dom)
    op.target.append(dom)
    return dom
  split: (op)->
    if op.p >= 1 or op.p <= 0 then return
    t = op.p * @period

    data = TimeSignal.resample(@command_list(), @period)

    i = parseInt(t / @period * data.length)

    # A
    dom = TimeSignal.create
      clear: true
      target: op.target
    a = data.slice(0, i + 1)
    b = data.slice(i, data.length)
    
    setter = 
      signal: a
      period: t
      exportable: true
      draggable: false
    signal = new TimeSignal(dom, setter)
    
   
    # B
    setter = 
      signal: b
      period: @period - t
      exportable: true
      draggable: false

    dom = TimeSignal.create
      clear: false
      target: op.target
    signal = new TimeSignal(dom, setter)
    
  inject: (command_list, delta_t)->
    delta_t = parseInt(delta_t)
    # AS LONG AS DELTA_T IS REGULAR, NOT AN ISSUE
    prev = @form
    a = TimeSignal.resample(@command_list(), prev.period)
    b = TimeSignal.resample(command_list, delta_t)
    prev.signal = a.concat(b)
    prev.period += delta_t
    prev = _.omit prev, "id"
    # console.log "INJECT", prev
    @form = prev
  
  command_list: (op) ->
    @command_list_data(@data, op)

  command_list_data: (data, op)->
    t_scale = @period / data.length
    t_elapsed = 0
    cl = _.map data, (datum) ->
      duration = 1 * t_scale
      t = t_elapsed
      t_elapsed += duration
      {
        t: if op and op.offset then t + op.offset else t
        param: datum
        duration: duration
      }
    cm = TimeSignal.compile(cl)
    # console.log("COMPILATION SAVING", (cl.length - cm.length) / cl.length * 100, "%")
    cm

  update_view: ()->
    switch @view
      when "intensity"
        @_fill.opacity = 1
        @_signal.opacity = 1
        @_hue.opacity = 0
        @_physical.opacity = 0
      when "hue"
        @_fill.opacity = 0
        @_signal.opacity = 0
        @_hue.opacity = 1
        @_physical.opacity = 0
      when "physical"
        @_fill.opacity = 0
        @_signal.opacity = 1
        @_hue.opacity = 0
        @_physical.opacity = 1
      when "simulation"
        @_fill.opacity = 1
        @_signal.opacity = 1
        @_hue.opacity = 0
        @_physical.opacity = 0
        @_fill.fillColor = "red"

  _visuals:()->
    window.paper = @paper
    sig = CanvasUtil.queryPrefix("TIMESIGNAL")
    sh = CanvasUtil.queryPrefix("SIGNAL_HUE")
    ph = CanvasUtil.queryPrefix("SIGNAL_PHYSICAL")
    te = CanvasUtil.queryPrefix("TIMEENCODE")
    CanvasUtil.call _.flatten([sig, te, ph, sh]), 'remove'

    if @canvas.height() < 30
      @signal_stroke.strokeWidth = 1.5
      @axes.strokeWidth = 1.5
    @_fill = @fill(@signal_fill)
    @_signal = @stroke(@signal_stroke)
    @_hue = @signal_hue()
    @_axes = @draw_axes(@axes)
    @_physical = @fillPhysical(@signal_fill)

    @update_view()   
    @visuals = new paper.Group
      name: "TIMESIGNAL:" + @id,
      time_signal_id: @id,  
      children: _.flatten [@_fill, @_signal, @_axes, @_physical]
    if this.form.view == "simulation"
      @_time = @_time_encoder(@visuals)
      @timeencode = new paper.Group
        name: "TIMEENCODE:" + @id,
        time_signal_id: @id,  
        children: @_time
    else
      @_time = @_time_encoder(@visuals)
      @_play = @_play_button(@visuals)
      @_remove = @_remove_button(@visuals)

      @timeencode = new paper.Group
        name: "TIMEENCODE:" + @id,
        time_signal_id: @id,  
        children: _.flatten [@_play, @_time, @_remove]
  fill: (op) ->
    visual = @to_visual()
    time_signal = _.flatten visual, true 
    time_signal = _.flatten([[[0, 0]], time_signal, [[@data.length, 0]]], true)
    op = _.extend op,
      name: "SIGNAL: Signal Fill"
      segments: time_signal
      closed: true
      fillColor: TimeSignal.temperatureColor(@period)
    p = new paper.Path op
    return @fitPath(p)
  fillPhysical: (op) ->
    visual = @to_visual()
    time_signal = _.flatten visual, true 
    time_signal = _.flatten([[[0, 0]], time_signal, [[@data.length, 0]]], true)
    op = _.extend op,
      name: "SIGNAL_PHYSICAL: Physical Signal Fill"
      segments: time_signal
      closed: true
      fillColor: "red"
    p = new paper.Path op
    return @fitPath(p)
  stroke: (op) ->
    visual = @to_visual()
    time_signal = _.flatten visual, true
    time_signal = _.flatten([[[0, 0]], time_signal, [[this.data.length, 0]]], true)
    op = _.extend op,
     segments: time_signal
    p = new paper.Path op
    return @fitPath(p)
  signal_hue:()->
    scope = this
    cl = @command_list()
    hue_signal = new paper.Group
      name: "SIGNAL_HUE: hue"

    

    stops = _.map cl, (datum, i)->
      h = new paper.Color("red")
      h.saturation = 0.8
      h.hue = parseInt(datum.param * 360)
      first = new paper.GradientStop
        color: h
        offset: datum.t / scope.period
      second = new paper.GradientStop
        color: h
        offset: (datum.t + datum.duration) / scope.period
      return [first, second]
    stops = _.flatten(stops)
    hue_gradient = new paper.Path.Rectangle
      parent: hue_signal
      size: [30, 20]
    left = hue_gradient.bounds.leftCenter
    right = hue_gradient.bounds.rightCenter
    hue_gradient.set
      left: left
      right: right
      fillColor:
        gradient: 
          stops: stops
        origin: left
        destination: right
    return @fitPath(hue_signal)
  draw_axes: (op) ->
    offset = new (paper.Point)(0, -3)
    axes = [
      {
        from: paper.view.bounds.topLeft.subtract(offset)
        to: paper.view.bounds.topRight.subtract(offset)
      }
      {
        from: paper.view.bounds.bottomLeft.add(offset)
        to: paper.view.bounds.bottomRight.add(offset)
      }
    ]
    _.map axes, (axis) ->
      axis = _.extend op, axis
      new (paper.Path.Line)(axis)
  fitPath: (p)->
    w =  if p.bounds.width < 1 then 1 else p.bounds.width
    h =  if p.bounds.height < 1 then 1 else p.bounds.height
    if @dom 
      p.scaling.x = paper.view.bounds.width / w
      p.scaling.y = -(paper.view.bounds.height - 6) / h
      p.pivot = p.bounds.bottomCenter.clone()
      p.position = paper.view.bounds.bottomCenter.clone().add(new paper.Point(0, -3))
    else
      p.scaling.x = @op.acceptor.bounds.width / w
      p.scaling.y = -(@op.acceptor.bounds.height) / h
      p.pivot = p.bounds.bottomCenter.clone()
      p.position = @op.acceptor.bounds.bottomCenter.clone().add(new paper.Point(0, -3))
    return p
  _play_button:(group)->
    scope = this
    playGroup = new paper.Group
      name: "PLAY: _play_button"
      parent: group
      position: group.bounds.center.clone()
    rect = new paper.Path.Rectangle
      parent: playGroup
      rectangle: new paper.Size 15 + 10,10 + 10
      fillColor: "#00A8E1"
      opacity: 0.8
      radius: 4
      position: playGroup.bounds.center.clone()
    rect.onMouseEnter = ()->
      this.fillColor.brightness = 0.8
    rect.onMouseLeave = ()->
      this.fillColor.brightness = 1
    rect.onMouseDown = ()->
      this.fillColor = "#d9534f"
      that = this
      change_back = ()->
        that.fillColor = "#00A8E1"
      _.delay change_back, scope.period

    tri = new paper.Path.RegularPolygon
      parent: playGroup
      sides: 3
      radius: 3 + 2
      rotation: 90
      fillColor: "white"
    tri.position = rect.bounds.center.clone()
    playGroup.pivot = playGroup.bounds.bottomRight.clone()
    playGroup.position = group.bounds.bottomRight.clone().add(new paper.Point(0, 5))
    playGroup.onClick = (event)->
      scope.dom.click()
      cmp.op.signal_button.click()
    return playGroup
  _time_encoder: (group)->
    scope = this
    time = TimeSignal.pretty_time(@period)
    timeGroup = new paper.Group
      name: "TIME: time selector"
      parent: group
      position: group.bounds.center.clone()
    text = new PointText
      parent: timeGroup
      content: time,
      fillColor: '#080808',
      fontFamily: 'Avenir',
      fontWeight: 'bold',
      fontSize: 10
      justification: "center", 
      position: timeGroup.bounds.center.clone()
    rect = new paper.Path.Rectangle
      parent: timeGroup
      rectangle: text.bounds.clone().expand(3, 2), 
      fillColor: "white"
      opacity: 0.5
      radius: 3
      position: timeGroup.bounds.center.clone()
    rect.sendToBack()
    timeGroup.pivot = timeGroup.bounds.topRight.clone()
    timeGroup.position = group.bounds.topRight.clone()
    timeGroup.position = group.bounds.topRight.clone().add(new paper.Point(-5,10))
    timeGroup.onClick = (event)->
      scope.popover_behavior(event)
    return timeGroup
  _remove_button: (group)->
    scope = this
    removeGroup = new paper.Group
      name: "REMOVE: remove selector"
      parent: group
      position: group.bounds.center.clone()
    text = new PointText
      parent: removeGroup
      content: "x",
      fillColor: 'white',
      fontFamily: 'Consolas',
      fontWeight: 'bold',
      fontSize: 8
     
      justification: "center", 
      position: removeGroup.bounds.center.clone()
    rect = new paper.Path.Rectangle
      parent: removeGroup
      rectangle: text.bounds.clone().expand(8, 2), 
      fillColor: "#00A8E1"
      opacity: 0.5
      radius: 4
      position: removeGroup.bounds.center.clone()
    rect.sendToBack()
    text.position = rect.bounds.center.clone()
    removeGroup.pivot = removeGroup.bounds.topLeft.clone()
    removeGroup.position = group.bounds.expand(-18, -13).topLeft.clone()
    removeGroup.position = group.bounds.topLeft.clone()
    removeGroup.onClick = (event)->
      scope.dom.remove()
    return removeGroup
  to_visual: ->
    _.map @data, (datum, i) ->
      [[i, datum],[i + 1, datum]]
  @SAMPLING_RESOLUTION: 5
  @resample: (data, period)->
    period = parseInt(period)
    resolution = parseInt(period/TimeSignal.SAMPLING_RESOLUTION)
    if period == 0 then return [0]
    target = numeric.linspace(0, period, resolution)
    i = 0
    return _.map(target, (t)->
      if i + 1 >= data.length then return data[i].param
      if t <= data[i + 1].t then return data[i].param
      else
        i++
        return data[i].param
    )
  @pretty_time: (time)->
    time = parseFloat time
    time = time / 1000
    unit = 's'
    switch
      when time < 3
        time = (time * 1000).toFixed(0) + " ms"
        break
      when time <= 60
        time = time.toFixed(1) + " s"
        break
      when time < 60 * 60
        time /= 60
        time = time.toFixed(2) + ' min'
        break
      when time < 60 * 60 * 24
        time /= 60 * 60
        time = time.toFixed(2) + ' hr'
        break
      when time < 60 * 60 * 24 * 7
        time /= 60 * 60
        time = time.toFixed(1) + ' days'
        break
    return time

  @compile: (cl, key="param")->
    prev = cl[0]
    compiled = [prev]
    _.map cl, (c, i)->
      if i == 0 then return
      if c[key] == prev[key]
        prev.duration += c.duration
      else
        compiled.push(c)
        prev = c
    return compiled


  applyActuator: (actuator, channel)->
    ## NICECITIES
    actuator = actuator or am.getActiveActuator()
    channel = channel or am.getActiveChannel()
    if not channel
      alertify.notify "<b>WHICH CHANNEL?</b> Select a <em>channel</em> to simulate this signal.", 'error', 3
    if not actuator
      alertify.notify "<b>HOLD ON!</b> Select a actuator to simulate this signal.", 'error', 3
    if not channel or not actuator then return
    
    ## Algorithm: 
    # 0. Gather data
    # 1. If modality, then gamma correct
    # 2. Convert to command format and gather value definition
    # 3. POV correction + Mechanical correction

    ## Gather data
    channelData = _.pick actuator.channels[channel].op, "derived", "resolution", "modality", "budget", "throttle"
    channelData.gamma = if channelData.modality then sens.psycho[channelData.modality] else null
    channelData.budget = if channelData.budget then eval(channelData.budget)

    if channelData.derived
      alertify.notify "<b>HOLD ON!</b> That's a simualted channel. Choose a physical channel", 'error', 3
      return

    ## READY FOR ACTION
    # console.log channelData
    data = @signal
    # console.log "SIGNAL", data.length
    # ## GAMMA CORRECT
    if channelData.gamma
      data = _.map data, (P)-> return Math.pow(P, 1 / channelData.gamma)
      # console.log "GAMMA CORRECTED", data.length

    ## COMMAND_LIST CONVERSION
    commands = @command_list_data(data)
    # console.log "COMMANDS", commands.length
    
    if TimeSignal.OPTIMIZED
      query = 
        parameterized: true
      _.each commands, (command)->
        query[channel] = command.param
        actuator.expression = query
        command.value = actuator.channels[channel].value

      # RESOLUTION CORRECTION
      commands = TimeSignal.compile(commands, "value")
      # console.log "COMMANDS", commands.length

      # POV + MECHANICAL CORRECTION (TIME BASE MEDIA)
      commands = _.map commands, (curr, i)->
        if i == 0 then return curr
        prev = commands[i-1] 
        curr.dt = curr.t - prev.t
        return curr
      # console.log "dCommands", commands.length
      
      #POV
      dt_accum = 0
      last_accepted_value = commands[0].value
      lastIdx = commands.length - 1

      commands = _.map commands, (curr, i)->
        if i == 0 then return curr
        prev = commands[i-1]
        # SUPERFLUOUS COMMAND
        if curr.value == last_accepted_value
          dt_accum += curr.dt 
          return null 
        # PERCEIVABLE
        if curr.dt + dt_accum > channelData.throttle or i == lastIdx
          last_accepted_value = curr.value
          dt_accum = 0
          return curr
        # INPERCEIVABLE 
        else
          dt_accum += curr.dt 
          return null
      commands = _.compact(commands)
      # console.log "povCommands", commands.length
      if channelData.budget
        # console.log "BUDGET", channelData.budget
        ## MECHANICAL UPDATE  
        commands = _.map commands, (curr, i)->
          if i == 0 then return _.pick curr, "param", "duration", "value", "t"
          prev = commands[i-1]
          dV = curr.value - prev.value
          budget = channelData.budget * curr.dt
          mag = Math.abs(dV)
          sign = Math.sign(dV)
          if mag > budget
            curr.value = prev.value + (budget * sign)
            query = {}
            query[channel] = curr.value
            actuator.expression = query
            curr.value = actuator.channels[channel].value
            commands[i].value = curr.value
            curr.param = actuator.channels[channel].param
            return _.pick curr, "param", "duration", "value", "t" 
          else
            return _.pick curr, "param", "duration", "value", "t" 

        console.log "mechCommands", commands.length
      
      commands = TimeSignal.compile(commands, "value")
      console.log "COMMANDS", commands.length
    signal = TimeSignal.resample(commands, @period)
    return signal
      
  @temperatureColor: (v)->
    max = TimeSignal.MAX
    min = TimeSignal.MIN
    p = (v - min) / (max - min);

    # if p < 0 or p > 1 then console.warn "OUT OF RANGE - TEMP TIME", v
    if p > 1 then p = 1
    if p < 0 then p = 0
    # "#000000",
    # thermogram = [ "#380584", "#A23D5C", "#FAA503", "#FFFFFF"];
    # thermogram.reverse();
    
    # thermogram = _.map thermogram, (t) -> return new paper.Color(t)
    # if p == 0 then return thermogram[0]
    # i = p * (thermogram.length - 1)
    
    # a = Math.ceil(i)
    # b = a - 1
    # terp = a - i
    # red = thermogram[a]
    # blue = thermogram[b]    

    # c = red.multiply(1-terp).add(blue.multiply(terp))
    # c.saturation = 0.8
    c = new paper.Color("#00A8E1")
    c.saturation = (p * 0.5) + 0.5
    return c
  
# ---
# generated by js2coffee 2.2.0