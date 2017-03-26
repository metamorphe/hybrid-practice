actuator_counter = 0;

# ABSTRACT INTERFACE
class Actuator
  constructor: (@op) ->
    @paper = @op.paper
    @async_period = 30
    hid = eval(@op.hardware_id)
    if _.isObject hid
      @hardware_id = hid
    else if _.isNumber hid
      @hardware_id = [hid]
    if @op.title then @setTitle(title)

    @op.dom.parents('actuator').data('hardware-id', JSON.stringify(@hardware_id))

    @setTitle()
    @init()
    @onCreate()
  init: ->
    @visuals = []
    @id = actuator_counter++;
    window.paper = fs.op.paper
    @op.dom.parents('actuator').data('id', @id)
    @canvas_id = @op.canvas_id
    cE = CanvasUtil.queryID(@op.canvas_id)
    if _.isUndefined cE.expresso_id then cE.expresso_id = @id
    window.paper = @paper
    @visuals = []
    @channels = _.mapObject(@op.channels, (actuator) ->
      new ActuationParam(actuator)
    )
    @_visuals()
  perform: (channel, command)->
    window.paper = @op.paper
    query = 
      parameterized: true
      viz_update: true
    query[channel] = command.param
    @expression = query
    scope = this
    return _.map @hardware_id, (hid)->
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
      expression: @expression
      channel: channel
  physical_channels: ()->
    _.pick @channels, (val)->
      return val.op.modality != "derived"
  toData: ->
    console.warn "NOT IMPLEMENTED"
  getTitle:->
    title = @op.dom.parents('actuator').find("label.title:first").html()
  setTitle: (title)->
    @op.dom.parents('actuator').find("label.title:first").html(title)
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
    rays = _.range(-180, 180, RAY_RESOLUTION)
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
    @op.dom.css 'background', 'black'
    return
  Object.defineProperties @prototype,
    expression:
      get: -> @_expression
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