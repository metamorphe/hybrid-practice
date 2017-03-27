actuator_counter = 0;

# ABSTRACT INTERFACE
class Actuator
  @COUNTER: 0
  @DEFAULT_ASYNC: 0
  @RAY_RESOLUTION: 30
  constructor: (@dom, set, @op) ->
    set = set or {}
    @id = Actuator.COUNTER++
    @dom.data('id', @id)
    @canvas = @dom.find('canvas')

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
    @_visuals()
    @channels = _.mapObject(@op.channels, (actuator) ->
      new ActuationParam(actuator)
    )
    @form = set
    @onCreate()
    am.add(this)
  serialize: ->
    @form
  Object.defineProperties @prototype,
    form: 
      get: ->
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
        
        @setAsync(@async_period)
        
        # POPULATE CANVAS IDs MANUALLY
        window.paper = ch.paper
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
        @_updateVisuals(@expression)
  setAsync: (t)->
    text = TimeSignal.pretty_time(t)
    @dom.find('label.async').html(text)
  setTitle: (title, saved)->
    title = @dom.find("label.title:first").html(title)
    if saved
      @dom.find(".save-status").addClass('saved')
    else
      @dom.find(".save-status").removeClass('saved')
  
  perform: (channel, command)->
    window.paper = @op.paper
    query = 
      parameterized: true
      viz_update: true
    query[channel] = command.param
    @expression = query
    scope = this
    return _.map @hardware_ids, (hid)->
      command = scope.async(hid, channel, command)
      return command
  async: (hid, channel, command)->
    sia = ch.extractDistanceMetric()
    i = if _.isUndefined sia[hid] then 0 else sia[hid]
    command = _.clone(command)
    return _.extend command, 
      actuator: this
      async_offset:  i * @async_period
      api: @toAPI(hid)
      hid: hid
      expression: @expression
      channel: channel
  physical_channels: ()->
    _.pick @channels, (val)->
      return val.op.modality != "derived"
  
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
  init:->
    super
    @channel = @channels[@op.dimension]
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