class window.Composer
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
    @live = false
    console.info "COMPOSER INITIALIZED"
    Composer.extract()
    @actuators = _.compact(@initActuators())
    @initSelection()
    @initBLSlider @op.slider
    @initBLRadio($('actuator channel'))
    @timesignals = @initTimeSignals()
    @bindLiveButton()
  bindLiveButton:()->
    scope = this
    @op.live_button.click((event)->
      scope.live = not scope.live
      if scope.live 
        $(this).css('background', '#d9534f')
      else
        $(this).css('background', '#2d6a96')
    )
  initActuators: () ->
    scope = this;
    console.info 'Initializing actuators'
    collection = @op.actuators.find('canvas')
    _.map collection, (canvas, i) ->
      if $(canvas).parents('actuator').hasClass('template') then return null
      dom = $(canvas)
      papel = Utility.paperSetup(dom)
      ActuatorType = dom.attr('type')
      color = dom.data('color');
      console.log(eval(ActuatorType))
      ActuatorSimulator = eval('Actuator' + ActuatorType)
      props = _.extend(_.clone(eval(ActuatorType)),
        color: color,
        paper: papel
        dom: dom)
      console.log props
      actuator = new ActuatorSimulator(props)
      channels = scope.getChannels(actuator)
      _.each( channels, (channel)->
        scope.updateChannel(actuator, channel)
      )
      actuator

  getActuator: (id)->
    @actuators[id]
  getTimeSignal: (id)->
    @timesignals[id]
  getActiveActuator: ()->
    id = $('actuator.selected').data('id')
    actuator = @getActuator(id)
    window.paper = actuator.op.paper
    actuator
  getActiveTimeSignal: ()->
    id = $('datasignal.selected').data('time_signal_id')
    @getTimeSignal(id)
  getChannels:(actuator)->
    channels = $(actuator.op.dom).parents('actuator').find('channel')
    _.map(channels, (channel)-> $(channel).attr('type'))
  updateChannel: (actuator, channel)->
    val = actuator.channels[channel].value
    query = 'channel[type="' + channel + '"]'
    $(actuator.op.dom).parents('actuator').find(query).find('.dimension').html(val);
  getActiveChannel: ()->
    $('actuator.selected channels label.actuator.selected').parents('channel').attr('type');
  updateActiveChannel: (val)->
    $('actuator.selected channels label.actuator.selected').find('.dimension').html(val);
  sendCommand: (scope, param) ->
    actuator = scope.getActiveActuator()
    channel = scope.getActiveChannel()
    paper = actuator.paper
    scope.sendCommandTo(scope, actuator, channel, param)


  sendCommandTo: (scope, actuator, channel, param)->
    paper = actuator.paper
    query = parameterized: true
    query[channel] = param
    actuator.expression = query  
    update = actuator.channels[channel].value.toFixed(0)

    val = parseInt(actuator.channels[channel].value)
    if scope.live and sc then sc.sendMessage("c " + actuator.id + " " + val + "\n")
    scope.updateActiveChannel(update);
    return actuator.toCommand()

  sendCommandByID: (actuator_id, channel, time_signal_id)->
    scope = this
    actuator = @getActuator(actuator_id)
    ts = @getTimeSignal(time_signal_id)
    commands = ts.command_list(3000)
    _.each commands, (command) ->
      _.delay(scope.sendCommandTo, command.t, scope, actuator, channel, command.param) 
    return
  
 
  initBLSlider: (dom)->
    scope = this;
    dom.on 'input', ->
      param = parseFloat($(this).val())  
      scope.sendCommand(scope, param)
      return
    return
  initBLRadio: (dom) ->
    scope = this
    dom.click ->
      actuator_id = $(this).parents('actuator').data('id')
      actuator = scope.getActuator(actuator_id)
      channel = $(this).attr('type');
      value = actuator.getChannelParam(channel)
      scope.op.slider.val value
      return
  initSelection: ()->
    scope = this
    $('datasignal, actuator').click ->
      tag = @tagName
      $(tag).removeClass 'selected'
      $(this).addClass 'selected'
      channel = $('actuator.selected channels input[type="radio"]:checked').val()
      id = $('actuator.selected').data('id')
      actuator = scope.getActuator(id)
      if actuator
        value = actuator.getChannelParam(channel)
      $('event#actuators input.master').val value
      return
    $('label.actuator').click ->
      siblings = $(this).parents('channels').find('label.actuator').not(this).removeClass('selected');
      $(this).addClass('selected')
      return
  initTimeSignals: ->
    console.info 'Initializing time signals'
    collection = @op.timesignals
    _.map collection, (canvas, i) ->
      dom = $(canvas)
      op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE), {dom: dom})
      ts = new TimeSignal(op)
    

 