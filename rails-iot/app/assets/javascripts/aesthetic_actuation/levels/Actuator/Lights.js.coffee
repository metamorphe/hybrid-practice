class ActuatorLight extends Actuator1D
  _visuals: ->
    switch @op.package
      when 'SMD'
        c = new (paper.Path.Rectangle)(
          name: 'EMITTER: emit'
          position: paper.view.center
          size: [16, 8]
          fillColor: @constants.color)
      else
        c = new (paper.Path.Circle)(
          name: 'EMITTER: emit'
          position: paper.view.center
          radius: 8
          fillColor: @constants.color)
      
    ray_options = 
      emitter: c
      position: c.position
      boundaries: [ new (paper.Path.Rectangle)(paper.view.bounds) ]
      color: @constants.color
      max_ray_length: 30

    rays = @_createRays ray_options
    @visuals.push c
    @visuals.push rays
    @visuals = _.flatten @visuals
    @_setBackground()
  

class window.ActuatorLED extends ActuatorLight
  onCreate: ->
    @expression = 128;
    return
  _param2express: ->
    new paper.Color(@channel.param)
  _updateVisuals: (p)->
    _.each @visuals, (v) ->
      prefix = CanvasUtil.getPrefix(v)
      scale = if prefix == 'RAY' then 0.2 else 1
      v.opacity = p.brightness * scale
    return
  _color:(str)->
    c = new paper.Color str
    @channel.param = c.brightness
  toCommand: ->
    v = parseInt(@expression.brightness * 255)
    return "\t" + @op.name + ".set("+ v + ");\n";
  toAPI: (hid)->
    d = hid.split(":")
    {flag: "C", args: [d[0], d[1], @expression.brightness]}
    
  
    
class window.ActuatorRGBLED extends ActuatorLED
  onCreate: ->
    # @expression = {red: 255, green: 0, blue: 0}
    @expression = @constants.color
    return
  _param2express: ->
    c = @channels
    c = new paper.Color(c.red.param, c.green.param, c.blue.param)
    @_updateVisuals(c)
    c
  _updateVisuals: (c)->
    _.each(@visuals, (v)->
      prefix = CanvasUtil.getPrefix(v);
      if prefix == "RAY"
        v.set {strokeColor: c}
      else
        v.set {fillColor: c}
    );
  _num: (val)->
    @channels.red.value = val
    @channels.green.value = val
    @channels.blue.value = val
  _obj:(obj)->
    scope = this
    accepted = _.keys @channels
    _.each( obj, (value, key)->
      if _.contains accepted, key
        scope.channels[key].value = value)
  _pobj:(obj)->
    scope = this
    accepted = _.keys @channels
    _.each( obj, (value, key)->
      if _.contains accepted, key
        scope.channels[key].param = value)
  _color:(str)->
    c = new paper.Color str
    @channels.red.value = c.red * 255
    @channels.green.value = c.green * 255
    @channels.blue.value = c.blue * 255
  toCommand: ->
    v = [@expression.red, @expression.green, @expression.blue]
    v = _.map(v, (val)->
      parseInt(val * 255)
    )
    return "\t" + @op.name + ".set("+ v.join(', ') + ");\n";
  toAPI: (hid)->
    c = @expression
    r = parseInt(c.red * 255)
    g = parseInt(c.green * 255)
    b = parseInt(c.blue * 255)
    hid = hid.split(":")
    {flag: "C", args: [hid[0], hid[1], r, g, b]}
class window.ActuatorHSBLED extends ActuatorRGBLED
  onCreate: ->
    @expression = @constants.color
    return
  _param2express: ->
    window.paper = @paper
    c = @channels
    c = new paper.Color({
      hue: c.hue.value
      saturation: c.saturation.param
      brightness: c.brightness.param
    })
    @_updateVisuals(c)
    return c
  _num: (val)->
    @_warn val
  _color:(str)->
    c = new paper.Color str
    @channels.hue.value = c.hue
    @channels.saturation.value = c.saturation #* 255
    @channels.brightness.value = c.brightness #* 255