class window.TimeSignal
  @DEFAULT_HEIGHT: 84 # + 4 for BORDER ==> 88
  @COUNTER: 0
  @DEFAULT_PERIOD: 3000
  @DEFAULT_RESOLUTION: 100 # ms/sample
  @MAX: 10000, 
  @MIN: 0,
  @DEFAULT_STYLE: 
    signal_fill: {fillColor: '#FF9912'}
    signal: {strokeWidth: 3, strokeColor: '#333'}
    axes: {strokeWidth: 2, strokeColor: 'blue', opacity: 0.5}
  @copy:(op)->
    newDom = $('<datasignal><canvas></canvas></datasignal>')
    canvas = newDom.find("canvas")
  

    if op.clone
      canvas.attr("data", op.clone.attr('data'))
      canvas.attr("period", op.clone.attr('period'))
    if op.data then canvas.attr("data", JSON.stringify(op.data))
    if op.period then canvas.attr("period", op.period)
    if op.exportable then canvas.addClass('draggable')
    if op.composeable then newDom.addClass('composeable')
    if op.clearParent then $(op.parent).children('datasignal').remove()
    if op.parent then op.parent.addClass('accepted').append(newDom)

    props = _.clone(TimeSignal.DEFAULT_STYLE)
    props = _.extend props,{dom: canvas}
    if op.style then _.extend props, op.style

    if op.activate
      ts = new TimeSignal(props)
      tsm.add(ts)
      tsm.activateDragAndDrop()
      if op.dragInPlace
        ts.op.dom.parent().draggable
          scroll: false
          containment: "parent"
          axis: "x"        
      return ts

    return newDom
  @temperatureColor: (v)->
    max = TimeSignal.MAX
    min = TimeSignal.MIN
    p = (v - min) / (max - min);

    if p < 0 or p > 1 then console.warn "OUT OF RANGE - TEMP TIME", v
    if p > 1 then p = 1
    if p < 0 then p = 0
    # "#000000",
    thermogram = [ "#380584", "#A23D5C", "#FAA503", "#FFFFFF"];
    thermogram.reverse();
    
    thermogram = _.map thermogram, (t) -> return new paper.Color(t)
    if p == 0 then return thermogram[0]
    i = p * (thermogram.length - 1)
    
    a = Math.ceil(i)
    b = a - 1
    terp = a - i
    red = thermogram[a]
    blue = thermogram[b]    

    c = red.multiply(1-terp).add(blue.multiply(terp))
    c.saturation = 0.8
    return c
  @resample: (data, period)->
    target = numeric.linspace(0, period, TimeSignal.DEFAULT_RESOLUTION)
    i = 0
    return _.map(target, (t)->
      if i + 1 >= data.length then return data[i].p
      if t <= data[i + 1].t then return data[i].p
      else
        i++
        return data[i].p
    )
  @pretty_time: (time)->
    time = parseFloat time
    time = time / 1000
    unit = 's'
    switch
      when time < 3
        time = (time * 1000).toFixed(0) + "ms"
        break
      when time <= 60
        time = time.toFixed(1) + "s"
        break
      when time < 60 * 60
        time /= 60
        time = time.toFixed(2) + 'min'
        break
      when time < 60 * 60 * 24
        time /= 60 * 60
        time = time.toFixed(2) + 'hr'
        break
      when time < 60 * 60 * 24 * 7
        time /= 60 * 60
        time = time.toFixed(1) + 'days'
        break
    return time

  @compile: (cl)->
    prev = cl[0]
    compiled = [prev]
    _.map cl, (command, i)->
      if i == 0 then return
      if command.param == prev.param
        prev.duration += command.duration
      else
        compiled.push(command)
        prev = command
    return compiled

  constructor: (@op)->
    @id = TimeSignal.COUNTER++
   
    if @op.dom
      @period = if _.isUndefined(@op.dom.attr('period')) then TimeSignal.DEFAULT_PERIOD else parseFloat(@op.dom.attr('period')) 
      @canvasInit()
      if tsm then tsm.initSelection()
    if @op.acceptor
      @period  = if _.isUndefined(@op.period) then TimeSignal.DEFAULT_PERIOD  else @op.period
      @acceptorInit()
    return
  canvasInit: ()->
    @data = eval(@op.dom.attr('data'))
    t_op = {}
    container = @op.dom.parent().parent()
    params = container.data() 
    accept = params.accept or 1
    semantic = params.semantic == "enabled"
    tracks = params.tracks or 3
    timescale = params.timescale 
    codomain = params.codomain or "intensity"

    if not semantic
      w = container.width()
      t_op.width = @period/timescale * w
      t_op.height = TimeSignal.DEFAULT_HEIGHT / tracks
      

    @op.paper = Utility.paperSetup(@op.dom, t_op)
    @op.dom.parents('datasignal').data 'time_signal_id', @id
    @_visuals
      codomain: codomain
   
  time_series: ->
    commands = @command_list()
    return _.map commands, (c, i)->
      return {t: c.t, p: c.param}
  split: (t)->
    t = t * @period
    data = TimeSignal.resample(@time_series(), @period)
    i = parseInt(t / @period * data.length)
    a = data.slice(0, i + 1)
    b = data.slice(i, data.length)

    new_dom = TimeSignal.copy
      data: a
      period: t
      exportable: true
      dragInPlace: false
      parent: $('#timecut .track-full')
      clearParent: true
      activate: true
      style:
        signal_fill:
          fillColor: '#d9534f', 

    new_dom = TimeSignal.copy
      data: b
      period: @period - t
      exportable: true
      dragInPlace: false
      parent: $('#timecut .track-full')
      clearParent: false
      activate: true
      style:
        signal_fill:
          fillColor: '#d9534f', 

  updatePeriod: (op)->
    if op.delta then @period += op.delta
    if op.period then @period = op.period
    if @period < 100 then @period = 100

    @op.dom.attr('period', @period)
    window.paper = @op.paper
    CanvasUtil.call(CanvasUtil.queryPrefix("TIME"), 'remove');
    CanvasUtil.queryPrefix("SIGNAL")[0].fillColor = TimeSignal.temperatureColor(@period)
    time = @_time_encoder(@visuals)
  acceptorInit: ()->
    window.paper = @op.paper
    @data = eval(@op.data)
    @op.acceptor.set({fillColor: "purple"})
    @op.acceptor.time_signal_id = @id
    @_visuals()
  
  command_list: (op) ->
    t_scale = @period / @data.length
    t_elapsed = 0
    cl = _.map @data, (datum) ->
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
  inject:(data, from, to)->
    if from < 0 or from > @period
      console.warn "ATTEMPTING TO RECORD AFTER PERIOD", from, to
      return
    if to > @period then to = @period
    scope = this
    from = parseInt((from / scope.period) * (scope.data.length - 1))
    to = parseInt((to / scope.period) * (scope.data.length - 1))
    data = _.fill(to - from, data)
    # console.log data
    r = _.range(0, data.length, 1)
    _.each r, (i)->
      scope.data[i + from] = data[i]
    scope.op.dom.attr('data', JSON.stringify(@data))
    window.paper = @op.paper
    @visuals.remove();
    @_visuals()

  _visuals:(prop)->


    if @op.dom.height() < 30
      @op.signal.strokeWidth = 1.5
      @op.axes.strokeWidth = 1.5
    switch prop.codomain
      when "intensity"
        fill = @signal_fill(@op.signal_fill)
        @_signal = @signal(@op.signal)
      when "hue"
        @signal_hue()
    
    axes = @draw_axes(@op.axes)


    @visuals = new paper.Group
      name: "TIMESIGNAL:" + @id,
      time_signal_id: @id,  
      children: _.flatten([fill, @_signal, axes])
    time = @_time_encoder(@visuals)
    play = @_play_button(@visuals)
    remove = @_remove_button(@visuals)
    if not _.isUndefined(@op.acceptor)
      @visuals.acceptor = @op.acceptor.id

  _play_button:(group)->
    scope = this
    playGroup = new paper.Group
      name: "PLAY: _play_button"
      parent: group
      position: group.bounds.center.clone()
    rect = new paper.Path.Rectangle
      parent: playGroup
      rectangle: new paper.Size 15,10
      fillColor: "#00A8E1"
      opacity: 0.5
      position: playGroup.bounds.center.clone()
    tri = new paper.Path.RegularPolygon
      parent: playGroup
      sides: 3
      radius: 3
      rotation: 90
      fillColor: "white"
    tri.position = rect.bounds.center.clone()
    playGroup.pivot = playGroup.bounds.bottomRight.clone()
    playGroup.position = group.bounds.bottomRight.clone().add(new paper.Point(0, 5))
    playGroup.onClick = (event)->
      scope.op.dom.click()
      cmp.op.signal_button.click()

  _time_encoder: (group)->
    # if @period != TimeSignal.DEFAULT_PERIOD
    # SMART FORMAT
    
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
    timeGroup.position = group.bounds.expand(-5, -30).topRight.clone()

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
    removeGroup.onClick = (event)->
      scope.op.dom.parents('datasignal').remove()
      
  
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
      axis = _.extend(op, axis) 
      new (paper.Path.Line)(axis)
  to_visual: ->
    _.map @data, (datum, i) ->
      [[i, datum],[i + 1, datum]]
  signal_hue:()->
    scope = this
    cl = @command_list()
   
    hue_signal = new paper.Group
      name: "SIGNAL: hue"

    _.each cl, (datum, i)->
      h = new paper.Color("red")
      h.saturation = 0.8
      h.hue = parseInt(datum.param * 360)
      step = datum.duration / scope.period
      r = new paper.Path.Rectangle
        parent: hue_signal
        size: [step, 1]
        fillColor: h
        position: new paper.Point(i * step, 0)
    @fitPath(hue_signal)

  signal_fill: (op) ->

    visual = @to_visual()
    time_signal = _.flatten(visual, true);
    time_signal = _.flatten([[[0, 0]], time_signal, [[this.data.length, 0]]], true)
   
    op = _.extend(op,
      segments: time_signal
      closed: true)
    op.name = "SIGNAL: fill me"

    op.fillColor = TimeSignal.temperatureColor(@period)

    p = @makePath(op)
  signal: (op) ->
    visual = @to_visual()
    time_signal = _.flatten(visual, true)
    time_signal = _.flatten([[[0, 0]], time_signal, [[this.data.length, 0]]], true)
    op = _.extend(op, segments: time_signal)
    p = @makePath(op)
  makePath: (op) ->
    p = new (paper.Path)(op)
    return @fitPath(p)
  fitPath: (p)->
    w =  if p.bounds.width < 1 then 1 else p.bounds.width
    h =  if p.bounds.height < 1 then 1 else p.bounds.height
    if @op.dom 
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
  express: (actuator, options) ->
    gamm = 1 / actuator.alpha
    gamma_corrected_signal = _.map(@data, (datum) ->
      datum ** actuator.alpha
    )
    time_signal = _.map(gamma_corrected_signal, (datum, i) ->[i, datum])
    p = new (paper.Path)(segments: time_signal)
    total_samples = @temporal_range * @sampling_rate
    signal = _.range(0, total_samples, 1)
    _.map signal, (sample) ->
      p.getPointAt(sample / total_samples).y

# ---
# generated by js2coffee 2.2.0