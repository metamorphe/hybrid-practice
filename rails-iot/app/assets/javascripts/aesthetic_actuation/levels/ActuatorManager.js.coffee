class window.ActuatorManager
  @extract: ()->
    console.info "EXTRACTING ACTUATORS FROM ARTWORK"
    LEDS = _.map CanvasUtil.queryPrefix("LED"), (led, i)->
      led.type = "LED"
      led.color = CanvasUtil.getName(led)
      # FIND TEMPLATE
      act = $('actuator.template[name="'+led.type+'"]')
        .clone().removeClass('template')
        .data('color', led.color)
        .data('canvas-id', led.id)
        .data('hardware-id', i)
     
      $('#actuators .track-full').append(act);
      return led
    console.log "LEDs:", LEDS.length

    # HSB LEDS
    hsbLEDs = CanvasUtil.queryPrefix("NLED")
    # hsbLEDs = hsbLEDs.slice(0, 2)
    hsbLEDs = _.map hsbLEDs, (led, i)->
      led.type = "HSBLED"
      data = JSON.parse(CanvasUtil.getName(led))
      led.color = rgb2hex(new paper.Color(data.colorID).toCSS())
      led.fillColor = led.color
      # FIND TEMPLATE
      act = $('actuator.template[name="'+led.type+'"]')
        .clone().removeClass('template')
        .data('color', led.color)
        .data('canvas-id', led.id)
        .data('hardware-id', led.lid)
      
      $('#actuators .track-full').append(act);
      return led
    console.log "hsbLEDs:", hsbLEDs.length

    # HEATERS
    heaters = CanvasUtil.queryPrefix("HEATER")

    heaters = _.map heaters, (heater, i)->
      heater.type = "Heater"
      data = JSON.parse(CanvasUtil.getName(heater))
      heater.resistance = data.resistance
      
      # FIND TEMPLATE
      act = $('actuator.template[name="'+heater.type+'"]')
        .clone().removeClass('template')
        .data('resistance', heater.resistance)
        .data('canvas-id', heater.id)
        .data('hardware-id', heater.id)
      
      $('#actuators .track-full').append(act)
      return heater
    console.log "heaters:", heaters.length

    motors = CanvasUtil.queryPrefix("MOTOR")

    motors = _.map heaters, (motor, i)->
      motor.type = "Stepper"
      data = JSON.parse(CanvasUtil.getName(motor))
      motor.max = data.max
      
      # FIND TEMPLATE
      act = $('actuator.template[name="'+motor.type+'"]')
        .clone().removeClass('template')
        .data('resistance', motor.max)
        .data('canvas-id', motor.id)
        .data('hardware-id', motor.id)
      
      $('#actuators .track-full').append(act)
      return motor
    console.log "motors:", motors.length

    actuators = _.flatten([LEDS, hsbLEDs, heaters, motors])
    _.each actuators, (actuator)->
      actuator.onClick = ()->
        act = am.getActuator(actuator.expresso_id)
        act = am.clone(act.op.dom.parents("actuator"), {})
        $("#actuator-generator").html("").append(act).removeClass('actuator-droppable');
        am.initActuator.apply(am, [act]);
        am.activate()
        act.click()
    
  constructor: (@op) ->
    @actuators = []
    
  init:()->
    ActuatorManager.extract()
    @initActuators()
    @initBLRadio($('actuator channel'))
    @activate()
  activate: ()->
    @initSelection() 
    $(".remove").click ()->
      $(this).parents('actuator').remove()   
    @activateDragAndDrop()
  initActuators: () ->
    scope = this;
    collection = $('actuator[name]:not(.template)')

    console.info 'Initializing actuators', collection.length
    _.each collection, (act, i) ->
      scope.initActuator.apply(scope, [act])
  
  initActuator: (act, op)->
    scope = this
    act = $(act)
    dom = act.find('canvas')
    papel = Utility.paperSetup(dom)

    ActuatorType = act.attr('name')
    console.log ActuatorType
    ActuatorSimulator = eval('Actuator' + ActuatorType)

    props = _.extend(_.clone(eval(ActuatorType)),
      type: ActuatorType
      color: act.data('color')
      hardware_id: act.data('hardware-id')
      resistance: act.data('resistance')
      canvas_id: act.data('canvas-id')
      paper: papel
      dom: dom)
    actuator = new ActuatorSimulator(props)
    if op and op.group
      actuator.makeGroup(op.group)


    scope.updateChannels(actuator)
    
    @actuators.push(actuator)

  initBLRadio: (dom) ->
    scope = this
    dom.click ->
      actuator_id = $(this).parents('actuator').data('id')
      actuator = am.getActuator(actuator_id)
      channel = $(this).attr('type');
      value = actuator.getChannelParam(channel)
      cmp.op.slider.val value
      return
  resolve: (dom)->
    id = $(dom).data('id')
    @getActuator(id)
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
    val =  if val < 1 and val > 0 then val.toFixed(2) else val.toFixed(0)
    query = 'channel[type="' + channel + '"]'
    $(actuator.op.dom).parents('actuator').find(query).find('.dimension').html(val);
  updateChannels: (actuator)->
    scope = this
    channels = @getChannels(actuator)
    _.each channels, (channel)->
      scope.updateChannel(actuator, channel)
  updateActiveChannel: (val)->
    val =  if val < 1 and val > 0 then val.toFixed(2) else val.toFixed(0)
    $('actuator.selected channels label.actuator.selected').find('.dimension').html(val);
  sendCommandTo: (actuator, channel, param)->
    if _.isUndefined actuator
      console.warn("FORGOT TO SELECT AN ACTUATOR!")
      return
    cl = actuator.perform(channel, param)
    if cmp and sc
      _.each cl.commands, (command)->
        sc.sendMessage(command, {live: cmp.live}) 
    am.updateChannels(actuator)
    return actuator.toCommand()
  sendCommandById: (a_id, channel, ts_id)->
    scope = this
    act = @getActuator(a_id)
    ts = tsm.getTimeSignal(ts_id)
    commands = ts.command_list.apply(ts)
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
  clone: (o, op)->
    act = if op.type then $('actuator.template[name="'+op.type+'"]') else $('actuator.template[name="'+ o.attr('name')+'"]')
    act = act.clone().removeClass('template')

    if op.expression then act.data('color', op.expression) else act.data('color', o.data('color'))
    if op.ids then act.data('hardware-id', op.ids) else act.data('hardware-id', o.data('hardware-id'))
    if op.canvas_id then act.data('canvas-id', op.canvas_id) else act.data('canvas-id', o.data('canvas-id'))

    if op.title then act.find("p.actuator-title:first").html(op.title.toUpperCase())
    else act.find("p.actuator-title:first").html(o.find("p.actuator-title:first").html())
    
    act
   
  activateDragAndDrop: ()->
    scope = this
    $('actuator.draggable').draggable
      revert: true
      appendTo: '#ui2'
      helper: ()->
        copy = $('<p></p>').addClass("dragbox").html($(this).attr('name') + " #" + $(this).data().hardwareId)
        return copy;
    
    $('.actuation-design .droppable, acceptor.actuator').droppable
      accept: "actuator.draggable"
      classes: { "droppable-active": "droppable-default"}
      drop: (event, ui) ->
        act = scope.clone(ui.draggable, {})

        num_to_accept = parseInt($(this).attr('accept'))
        if num_to_accept == 1 then $(this).html('')
        $(this).append(act).addClass('accepted').removeClass('actuator-droppable');
        scope.initActuator.apply(scope, [act]);
        scope.activate()
      
      
  