class window.ActuatorManager
  @extract: ()->
    console.log "HELLO WORLD"
    LEDS = _.map CanvasUtil.queryPrefix("LED"), (led)->
      led.type = "LED"
      led.color = CanvasUtil.getName(led)
      # FIND TEMPLATE
      act = $('actuator.template[name="'+led.type+'"]')
        .clone().removeClass('template')
        .data('canvas-id', led.id)
      act.find("canvas").data('color', led.color);
      $('#actuators').append(act);
      return led
  constructor: (@op) ->
  init:()->
    ActuatorManager.extract()
    @actuators = _.compact(@initActuators())
    @initSelection()
    @initBLRadio($('actuator channel'))
  initActuators: () ->
    scope = this;
    console.info 'Initializing actuators'
    collection = @op.collection.find('canvas')
    _.map collection, (canvas, i) ->
      if $(canvas).parents('actuator').hasClass('template') then return null
      dom = $(canvas)
      papel = Utility.paperSetup(dom)
      ActuatorType = dom.attr('type')
      color = dom.data('color');
      ActuatorSimulator = eval('Actuator' + ActuatorType)
      props = _.extend(_.clone(eval(ActuatorType)),
        color: color,
        paper: papel
        dom: dom)
      actuator = new ActuatorSimulator(props)
      channels = scope.getChannels(actuator)
      _.each( channels, (channel)->
        scope.updateChannel(actuator, channel)
      )
      actuator
  initBLRadio: (dom) ->
    scope = this
    dom.click ->
      actuator_id = $(this).parents('actuator').data('id')
      actuator = am.getActuator(actuator_id)
      channel = $(this).attr('type');
      value = actuator.getChannelParam(channel)
      cmp.op.slider.val value
      return

  getActuator: (id)->
    @actuators[id]
  getActiveActuator: ()->
    id = $('actuator.selected').data('id')
    @getActuator(id)
  getChannels:(actuator)->
    channels = $(actuator.op.dom).parents('actuator').find('channel')
    _.map(channels, (channel)-> $(channel).attr('type'))
  getActiveChannel: ()->
    $('actuator.selected channels label.actuator.selected').parents('channel').attr('type');
  updateChannel: (actuator, channel)->
    val = actuator.channels[channel].value
    query = 'channel[type="' + channel + '"]'
    $(actuator.op.dom).parents('actuator').find(query).find('.dimension').html(val);
  updateActiveChannel: (val)->
    $('actuator.selected channels label.actuator.selected').find('.dimension').html(val);

  sendCommandTo: (actuator, channel, param)->
    window.paper = actuator.op.paper
    query = parameterized: true
    query[channel] = param
    actuator.expression = query  
    update = actuator.channels[channel].value.toFixed(0)
    val = parseInt(actuator.channels[channel].value)
    if cmp and sc and cmp.live then sc.sendMessage("c " + actuator.id + " " + val + "\n")
    am.updateActiveChannel(update);
    return actuator.toCommand()
  sendCommandById: (a_id, channel, ts_id)->
    scope = this
    act = @getActuator(a_id)
    commands = tsm.getTimeSignal(ts_id).command_list(3000)
    _.each commands, (command) ->
      _.delay(am.sendCommandTo, command.t, act, channel, command.param) 
      return
  initSelection: ()->
    scope = this
    $('actuator').click ->
      tag = @tagName
      $(tag).removeClass 'selected'
      $(this).addClass 'selected'
      channel = am.getActiveChannel()
      id = $('actuator.selected').data('id')
      actuator = am.getActuator(id)
      if actuator
        value = actuator.getChannelParam(channel)
        cmp.op.slider.val value
      return
    $('label.actuator').click ->
      siblings = $(this).parents('channels').find('label.actuator').not(this).removeClass('selected');
      $(this).addClass('selected')
      return
  