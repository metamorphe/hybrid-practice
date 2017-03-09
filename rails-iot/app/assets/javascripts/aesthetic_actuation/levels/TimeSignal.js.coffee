window.DEFAULT_SIGNAL_STYLE = 
  signal_fill: {fillColor: '#FF9912'}
  signal: {strokeWidth: 3, strokeColor: '#333'}
  axes: {strokeWidth: 2, strokeColor: 'blue', opacity: 0.5}
time_signal_counter = 0

class window.TimeSignal
  @DEFAULT_PERIOD: 3000
  constructor: (@op)->
    @id = time_signal_counter++
    if @op.dom
      console.log(@op.dom.attr('period'))
      @period = if _.isUndefined(@op.dom.attr('period')) then TimeSignal.DEFAULT_PERIOD else parseFloat(@op.dom.attr('period')) 
      @canvasInit()
      if tsm then tsm.initSelection()
    if @op.acceptor
      @period  = if _.isUndefined(@op.period) then TimeSignal.DEFAULT_PERIOD  else @op.period
      @acceptorInit()
    return

  updatePeriod: (scope, period)->
    scope.period = period
    scope.op.dom.attr('period', scope.period)
    window.paper = scope.op.paper
    CanvasUtil.call(CanvasUtil.queryPrefix("TIME"), 'remove');
    time = scope._time_encoder(scope.visuals)

  acceptorInit: ()->
    window.paper = @op.paper
    @data = eval(@op.data)
    @op.acceptor.set({fillColor: "purple"})
    @op.acceptor.time_signal_id = @id
    @_visuals()
  canvasInit: ()->
    @data = eval(@op.dom.attr('data'))
    @op.paper = Utility.paperSetup(@op.dom)
    @op.dom.parents('datasignal').data 'time_signal_id', @id
    @_visuals()
  _visuals:()->
    fill = @signal_fill(@op.signal_fill)
    signal = @signal(@op.signal)
    axes = @draw_axes(@op.axes)
    @visuals = new paper.Group
      name: "TIMESIGNAL:" + @id,
      time_signal_id: @id,  
      children: _.flatten([fill, signal, axes])
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
    time = (@period / 1000)
    unit = 's'
    switch
      when time < 3
        time = (time * 1000).toFixed(0) + "ms"
      when time <= 60
        time = time.toFixed(1) + "s"
      when time > 60 
        time /= 60
        time.toFixed(2) + 'min'
      when time > 60 * 60
        time /= 60 * 60
        time.toFixed(2) + 'hr'

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
      
  command_list: (scope) ->
    console.log "PERIOD", scope.period
    t_scale = scope.period / scope.data.length
    t_elapsed = 0
    _.map @data, (datum) ->
      duration = 1 * t_scale
      t = t_elapsed
      t_elapsed += duration
      {
        t: t
        param: datum
        duration: duration
      }
  draw_axes: (op) ->
    offset = new (paper.Point)(0, -4)
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
      [
        [
          i
          datum
        ]
        [
          i + 1
          datum
        ]
      ]
  signal_fill: (op) ->
    visual = @to_visual()
    time_signal = _.flatten(visual, true);
    time_signal = _.flatten([[[0, 0]], time_signal, [[this.data.length, 0]]], true)
    
    op = _.extend(op,
      segments: time_signal
      closed: true)
    p = @makePath(op)
  signal: (op) ->
    visual = @to_visual()
    time_signal = _.flatten(visual, true)
    op = _.extend(op, segments: time_signal)
    p = @makePath(op)
  makePath: (op) ->
    p = new (paper.Path)(op)
    if @op.dom 
      p.scaling.x = paper.view.bounds.width / p.bounds.width
      p.scaling.y = -(paper.view.bounds.height - 10) / p.bounds.height
      p.position = paper.view.center
    else
      p.scaling.x = @op.acceptor.bounds.width / p.bounds.width
      p.scaling.y = -(@op.acceptor.bounds.height) / p.bounds.height
      p.position = @op.acceptor.bounds.center
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