actuator_counter = 0;

# ABSTRACT INTERFACE
class window.Actuator
  @SIMULATE: false
  @COUNTER: 0
  @DEFAULT_ASYNC: 0
  @RAY_RESOLUTION: 30

  select_behavior: ()->
    # if not @dom.hasClass('selected')
    tag = @dom.prop('tagName')
    $(tag).removeClass 'selected'
    @dom.addClass 'selected'
    selectionTool.selection = @form.canvas_ids
    selectionTool.update()
    # ch.select()
    # @choreo.update()
    # ch.update()

  constructor: (@dom, set, @op) ->
    scope = this
    set = set or {}
    @id = @op.id or guid()
    Actuator.COUNTER++
    @choreo = new Choreography
      actuator: this
    @dom.data('id', @id)
   
    @canvas = @dom.find('canvas')

    # INTERACTION SETUP
    @dom.find('.remove-actuator').click (event)->
      scope.dom.parent().removeClass('accepted')
      scope.dom.remove()
      scope.dom.popover('hide')

    @dom.click ->
      if scope.dom.parents('event').attr('id') == "library" then scope.dom.popover({placement: 'right'})
      scope.select_behavior()
      $('.popover.actuator').not(this).popover('hide')
      
      # scope.dom.popover('hide')

    @dom.find('channel:not(.derived)').click (e)->
      scope.dom.popover('show')
      scope.bind_popover_behavior()
      e.stopPropagation()
      $('actuator.selected:not(.template)').removeClass('selected')
      $(this).parents('actuator').addClass('selected')
      selectionTool.selection = scope.form.canvas_ids
      selectionTool.update()

    @dom.find('channel:not(.derived)').click ->
      $(this).addClass('selected').siblings().removeClass('selected')
    
    @dom.find('channel[type="tempF"]').click (e)->
      sim = scope.getSimulation()
      range_min = 72
      range_max = 98

      signal = _.map sim.signal, (s)->
        return (s - range_min) / (range_max - range_min)
      dom = TimeSignal.create
        clear: true
        target: sim.tempTrack.dom
      setter = 
        signal: signal
        period: sim.period
        view: "simulation"
      signal = new TimeSignal(dom, setter)  
       

    
    @dom.find('.save-status').click (e)->
      window.active_choreo = scope.choreo
      $('#choreo-tool').click()
      console.log 'ACTIVE CHOREO', scope.choreo.form.id
      e.preventDefault()
      e.stopPropagation()

    # DEFAULTS
    @actuator_type = "Actuator"
    @hardware_ids = []
    @canvas_ids = []
    @title = ""
    @saved = false
    @async_period = Actuator.DEFAULT_ASYNC
    @constants = {}
    @paper = Utility.paperSetup @canvas, {}
    @visuals = []
    if Actuator.SIMULATE then @_visuals()
    @channels = _.mapObject @op.channels, (actuator) ->
      new ActuationParam(actuator)
    
    if @op.dimension
      @channel = @channels[@op.dimension]
    
    @form = set
    @onCreate()
    @interaction_setup()
    am.add(this)


  interaction_setup: ()->
    scope = this
    channels = @physical_channels()
    sorted_channels = _.sortBy(_.keys(channels))
    channels = _.map sorted_channels, (channel)-> 
      return '<input name="'+ channel+'"min="0" max="1" step="0.01" value="'+ channels[channel].param+'" type="range"/>'
    channels = channels.join('')
    content = @expression
    if @expression.className == "Color" then content = @expression.toCSS()
    @dom.data
      container: "#ui2"
      content: content
      placement: 'left'
      template: '<div class="actuator popover" role="tooltip"><div class="arrow"></div><a class="dismiss btn pull-left"><span class="glyphicon glyphicon-remove"></span></a><div class="popover-content"></div>'+channels+'</div>'
    @dom.popover('hide')
    @dom.on 'hidden.bs.popover', (e)->
      $(e.target).data("bs.popover").inState = 
        click: false
        hover: false
        focus: false

      

  bind_popover_behavior: ()->
    scope = this
    $('.actuator .dismiss').click ()-> $(this).parents('.popover').fadeOut(100)
    inputs = $('.actuator.popover').find('input')
    _.each inputs, (input)->
      input = $(input)
      channel = $(input).attr('name')
      scope.bind_slider_behavior(input, channel)
   
  @SLIDER_UPDATE: 300
  bind_slider_behavior: (input, channel)->
    scope = this;
    input.on 'input', ->
      diff = Date.now() - scope.now
      if(diff < ActuatorManager.SLIDER_UPDATE)
        return
      else 
        scope.now = Date.now()
      scope.form = {saved: false}
      param = parseFloat($(this).val())  
      command = {t: 0, param: param, channel: channel, duration: 100}
      # debugger;
      commands = scope.perform(command)
      commands =_.flatten(commands)
      Scheduler.schedule(commands)
    return
  
  serialize: ->
    @form
  Object.defineProperties @prototype,
    form: 
      get: ->
        id: @id
        actuator_type: @actuator_type
        hardware_ids: @hardware_ids
        canvas_ids:  @canvas_ids
        title: @title
        async_period:  @async_period
        constants: @constants
        saved: @saved
      set:(obj)->
        scope = this
        if _.isEmpty(obj) then return
        window.paper = @paper
        prev = @form
        if _.has(obj, 'canvas_ids') then delete obj['canvas_ids']
        _.extend(this, obj)
        @dom.data @form
        if @title != prev.title then @setTitle(@title, @saved)
        if @saved != prev.saved then @setTitle(@title, @saved)
        @async_period = @choreo.form.async_period
        @setAsync(@async_period)
        
        # POPULATE CANVAS IDs MANUALLY
        window.paper = ch.paper
        if @hardware_ids != prev.hardware_ids
          @sia = @choreo.form.sia
          @canvas_ids = _.map @hardware_ids, (hid)->
            match = CanvasUtil.query paper.project, {lid: hid}
            if _.isEmpty match then return null
            return _.first(match).id
    
    expression:
      get: -> 
        @_expression
      set: (value) ->
        scope = this;
        if _.isObject value
          if _.has(value, "parameterized")
            @_pobj value
          else
            @_obj value
        else if _.isNumber value
          @_num value
        else if _.isColorString value
          @_color value
        else
          @_warn value
        @_expression = @_param2express()
        if Actuator.SIMULATE then @_updateVisuals @expression
        # if ch
          # window.paper = ch.paper
          # elements = CanvasUtil.queryIDs @canvas_ids
          # CanvasUtil.set elements, "fillColor", @expression
          # window.paper = @paper
  getSimulation: ()->
    actuator = this;
    parent = actuator.dom.parents('acceptor.actuator')
    if parent.length > 0 and parent.data().name == "Stage"
      stage = Stage.library[parent.data().id];
      tracks = _.map stage.data.tracks, (tid)-> return Track.library[tid]
      voltageTrack = _.find tracks, (t)->
        return t.data.channel == "voltage"
      period = voltageTrack.getTime()
      commands = voltageTrack.toCommands()
      signal = TimeSignal.resample(commands, period)

      dtracks = _.map stage.data.dtracks, (tid)-> return Track.library[tid]
      tempTrack = _.find dtracks, (t)->
        return t.data.channel == "tempF"

      Ta = 72
      kH = 90 / 16 #Stable temperature
      
      dt = period / signal.length / 1000
      cooling_factor = 0.02 / 16
        
      _.each signal, (s, i)->
        if i == 0  
          signal[i] = 72
          return
        state = if signal[i] >= 1 then "heat" else "cool"
        console.log signal[i], state
        
        if state == "heat"
          heat = kH * dt 
          signal[i] =  signal[i - 1] + heat

          cool = (signal[i - 1] - Ta) * cooling_factor
          signal[i] -= cool
      
        if state == "cool"
          signal[i] = signal[i-1]
          cool = (signal[i - 1] - Ta) * cooling_factor
          signal[i] -= cool
        if signal[i] < Ta
          signal[i] = Ta
      max = _.max signal
      console.log "MAX", max
      
      return {signal: signal, period: period, tempTrack: tempTrack}

  setAsync: (t)->
    text = TimeSignal.pretty_time(t)
    @dom.find('label.async').html(text)
  setTitle: (title, saved)->
    title = @dom.find("label.title:first span:first").html(title)
    if saved
      @dom.find(".save-status").addClass('saved')
    else
      @dom.find(".save-status").removeClass('saved')
  performMultiple: (commands, generate_command=true)->
    scope = this
    if commands.length == 1 then @perform(commands[0], generate_command)
    metaQuery = 
      parameterized: true
      viz_update: true
    channels = _.map commands, (command)->
      metaQuery[command.channel] = command.param
      return command.channel
    @expression = metaQuery
    command = _.clone(commands[0])
    command.channel = channels.join(" ")
    command.metaCommand = true
    return command
  isEquivalent:(a, b, channel)->
    reference = this.channels[channel]
    query = 
      parameterized: true
    query[channel] = a.param
    @expression = query
    a.value = reference.value
    query[channel] = b.param
    @expression = query
    b.value = reference.value
    return a.value == b.value

  isPossible: (a, b, channel)->
    if not reference.op.max_velocity then return
    vMax = reference.op.max_velocity 

    dI = Math.abs(b.param - a.param)
    sign = b.param - a.param

    if dI > vMax
      return a.param + (vMax * sign)
    else
      return b.param
  perform: (command, generate_command=true)->
    scope = this
    # window.paper = @op.paper
    channel = command.channel
    query = 
      parameterized: true
      viz_update: true
    query[channel] = command.param
    @expression = query
    
    if not generate_command then return
    window.paper = ch.paper
    actuators = CanvasUtil.getIDs(@canvas_ids)
    sia = @choreo.resolve(actuators)
    return _.map @hardware_ids, (hid, i)->
      command = scope.async hid, channel, command, scope.canvas_ids[i], sia
      return command 
  async: (hid, channel, command, cid, sia)->
    @async_period = @choreo.form.async_period
    i = if _.isUndefined sia[hid] then 0 else sia[hid]
    command = _.clone(command)
    return _.extend command, 
      actuator: this
      async_offset:  i * @async_period
      api: @toAPI(hid)
      hid: hid
      cid: cid
      expression: @expression
      channel: channel

  physical_channels: ()->
    _.pick @channels, (val)->
      return not val.op.derived
  derived_channels: ()->
    _.pick @channels, (val)->
      return val.op.derived
  

  
  onCreate: ->
    return
  getChannelValue: (name)->
    if _.has @channels, name
      return @channels[name].value
  getChannelParam: (name)-> 
    if _.has @channels, name
      return @channels[name].param 
  _visuals: ()->
    console.warn "TODO:", "_visual", @op.name
  _color: (str) ->
    @_warn val
  _num: (val) ->
    @_warn val
  _pobj: (obj) ->
    @_warn val
  _obj: (obj) ->
    @_warn val
  _param2express: ()->
    console.warn "TODO:", "_p2e", @op.name
    "NOT SUPPORTED"
  _updateVisuals: (v)->
    console.warn "TODO:", "_updateVisuals", @op.name
    "NOT SUPPORTED"
  _warn: (val)->
    console.warn "Set", typeof val, "not supported for", @constructor.name
  _createRays: (opt) ->
    rays = _.range(-180, 180, Actuator.RAY_RESOLUTION)
    _.map rays, (theta) ->
      point = new (paper.Point)(1, 0)
      point.length = Ruler.mm2pts(opt.max_ray_length)
      point.angle = theta
      line = new (paper.Path.Line)(
        name: 'RAY: Cast'
        from: opt.position.clone()
        to: opt.position.clone().add(point)
        strokeColor: opt.color
        strokeWidth: 1
        opacity: 0.2
        parent: CanvasUtil.queryPrefix('ELD')[0]
        originAngle: theta)
      line.pivot = line.firstSegment.point.clone()
      ixts = CanvasUtil.getIntersections(line, opt.boundaries)
      if ixts.length > 0
        closestIxT = _.min(ixts, (ixt) ->
          ixt.point.getDistance line.position
        )
        line.lastSegment.point = closestIxT.point.clone()
      line
  _setBackground: ->
    @canvas.css 'background', 'black'
    return
  
        
class window.Actuator1D extends Actuator
  _num: (val)->
    @channel.value = val
  _obj:(obj)->
    if _.has obj, @op.dimension
      @channel.value = obj[@op.dimension]
  _pobj:(obj)->
    if _.has obj, @op.dimension
      @channel.param = obj[@op.dimension]
  _param2express: ->
    @channel.value
  toCommand: ->
    v = @expression;
    return "\t" + @op.name + ".set("+ v.toFixed(0) + ");\n";