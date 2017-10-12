class window.ActuatorHEATER extends Actuator1D
  onCreate: ->
    @expression = 5;
    return
  updateTemp: ()->
    base = 72
    @channels.tempF.value = base
    # console.log "TEMP", @channel.param, @channels.temperatureF.value
    # if not @channels.temperatureF.value or @channels.temperatureF.value < 72
    #   @channels.temperatureF.value = 72

    # if @channel.param == 1 #HEATING
    #   @channels.temperatureF.value += 8
    # else #COOLING
    #   @channels.temperatureF.value -= 8
    # @channels.temperatureC.value = (@channels.temperatureF.value - 32) * (5/9)
  _num: (val)->
    @channel.value = val
    @updateTemp()
  _obj:(obj)->
    if _.has obj, @op.dimension
      @channel.value = obj[@op.dimension]
    @updateTemp()
  _pobj:(obj)->
    if _.has obj, @op.dimension
      @channel.param = obj[@op.dimension]
    @updateTemp()
  toAPI: (hid)->
    d = hid.split(":")
    {flag: "P", args: [d[0], d[1], parseInt(@expression)]}
  _updateVisuals: (p)->
    scope = this
    param = @channel.param
    red = new (paper.Color)('red')
    blue = new (paper.Color)('#00A8E1')
    r_w = param * 2
    b_w = 1 - r_w
    ray_w = (param - 0.5) * 2
    current = red.multiply(r_w).add(blue.multiply b_w)
    _.each( @visuals, (v)->
      prefix = CanvasUtil.getPrefix(v)
      if param < 0.5
        if prefix == 'RAY'
          v.opacity = 0 # turn off rays
        else
          v.fillColor = current 
      else
        if prefix == 'RAY'
          v.opacity = ray_w * 0.2
        else #is emitter
          v.fillColor = red
    )
  _visuals: ->
    heater = new (paper.Path.Rectangle)(
      name: 'EMIT: emit'
      position: paper.view.center
      fillColor: 'red'
      size: [16,16]
    )
    rays = @_createRays(
      emitter: heater
      position: heater.position
      boundaries: [ new (paper.Path.Rectangle)(paper.view.bounds) ]
      color: 'red'
      max_ray_length: 30)
    @visuals.push heater
    @visuals.push rays
    @visuals = _.flatten(@visuals)

class window.ActuatorPUMP extends ActuatorHEATER
  onCreate: ->
    @expression = 0;
    return
  _num: (val)->
    @channel.value = val
    @channels.bubbles.param = @channel.param

  _obj:(obj)->
    if _.has obj, @op.dimension
      @channel.value = obj[@op.dimension]
    @channels.bubbles.param = @channel.param
  _pobj:(obj)->
    if _.has obj, @op.dimension
      @channel.param = obj[@op.dimension]
    @channels.bubbles.param = @channel.param
  toAPI: (hid)->
    d = hid.split(":")
    {flag: "P", args: [d[0], d[1], parseInt(@expression)]}
class window.ActuatorMOTOR extends ActuatorPUMP