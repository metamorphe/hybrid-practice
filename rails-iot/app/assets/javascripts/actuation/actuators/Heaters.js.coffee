class window.ActuatorHeater extends Actuator1D
  onCreate: ->
    @expression = 5;
    return
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