class window.Composer
  constructor: (@op) ->
    console.info "COMPOSER INITIALIZED"
    @actuators = @initActuators()
    @initSelection()
    @initBLSlider @op.slider
    @initBLRadio($('actuator channel'))
    @timesignals = @initTimeSignals()
    @socket = @initSocket()
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
  initActuators: () ->
    scope = this;
    console.info 'Initializing actuators'
    collection = @op.actuators.find('canvas')
    _.map collection, (canvas, i) ->
      dom = $(canvas)
      papel = Utility.paperSetup(dom)
      ActuatorType = dom.attr('type')
      ActuatorSimulator = eval('Actuator' + ActuatorType)
      props = _.extend(eval(ActuatorType),
        paper: papel
        dom: dom)
      actuator = new ActuatorSimulator(props)
      channels = scope.getChannels(actuator)
      _.each( channels, (channel)->
        scope.updateChannel(actuator, channel)
      )
      actuator
 
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
  initSocket: ->
    new SocketControl(
      ports: ports
      trigger: $('#socket-button')
      selector: $('#port-selector')
      noports_func: (dom) ->
        console.log 'NO PORTS'
        dom.removeClass('btn-default btn-success').addClass('btn-danger').find('span').removeClass('glyphicon-send glyphicon-ok').addClass 'glyphicon-remove'
        $('#port-selector').prop 'disabled', 'disabled'
        $('#port-status').html 'RECONNECT DEVICE?'
        return
      connect_func: (dom) ->
        port = $('#port-selector').val()
        dom.removeClass('btn-danger btn-success').addClass('btn-default').find('span').removeClass('glyphicon-send glyphicon-remove').addClass 'glyphicon-remove'
        $('#port-selector').prop 'disabled', 'disabled'
        $('#port-status').html port
        return
      error_func: (dom) ->
        dom.removeClass('btn-default btn-success').addClass('btn-danger').find('span').removeClass('glyphicon-send glyphicon-ok').addClass 'glyphicon-remove'
        $('#port-status').html '-'
        return
      disconnect_func: (dom) ->
        dom.removeClass('btn-danger btn-default').addClass('btn-success').find('span').removeClass('glyphicon-ok glyphicon-remove').addClass 'glyphicon-send'
        $('#port-selector').prop 'disabled', false
        $('#port-status').html '–'
        return
    )

 