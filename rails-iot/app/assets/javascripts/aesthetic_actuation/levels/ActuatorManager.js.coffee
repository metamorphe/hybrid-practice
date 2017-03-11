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
    hsbLEDs = _.map CanvasUtil.queryPrefix("NLED"), (led, i)->
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

    actuators = _.flatten([LEDS, hsbLEDs])
    _.each actuators, (actuator)->
      actuator.onClick = ()->
        console.log actuator.expresso_id
        act = am.getActuator(actuator.expresso_id)
        act = am.clone(act.op.dom.parents("actuator"))
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
    collection = @op.collection.find('actuator').not('.template')
    console.info 'Initializing actuators', collection.length
    _.each collection, (act, i) ->
      scope.initActuator.apply(scope, [act])
  
  initActuator: (act, op)->
    scope = this
    act = $(act)
    dom = act.find('canvas')
    papel = Utility.paperSetup(dom)

    ActuatorType = act.attr('name')
    ActuatorSimulator = eval('Actuator' + ActuatorType)
    props = _.extend(_.clone(eval(ActuatorType)),
      type: ActuatorType
      color: act.data('color')
      hardware_id: act.data('hardware-id')
      canvas_id: act.data('canvas-id')
      paper: papel
      dom: dom)
    actuator = new ActuatorSimulator(props)
    if op and op.group
      actuator.makeGroup(op.group)

    channels = @getChannels(actuator)
    _.each( channels, (channel)->
      scope.updateChannel(actuator, channel)
    )
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
  updateActiveChannel: (val)->
    val =  if val < 1 and val > 0 then val.toFixed(2) else val.toFixed(0)
    $('actuator.selected channels label.actuator.selected').find('.dimension').html(val);
  sendCommandTo: (actuator, channel, param)->
    if _.isUndefined actuator
      console.warn("FORGOT TO SELECT AN ACTUATOR!")
      return
    window.paper = actuator.op.paper
    query = parameterized: true
    query[channel] = param
    actuator.expression = query  
    update = actuator.channels[channel].value
    val = parseInt(actuator.channels[channel].value)
    if cmp and sc
      commands = actuator.toAPI()
      _.each commands, (command)->
        sc.sendMessage(command, {live: cmp.live}) 
    am.updateActiveChannel(update);
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
  clone: (o, title)->
    name = o.attr('name')
    act = $('actuator.template[name="'+name+'"]')
    .clone()
    .removeClass('template')
    .data('color', o.data('color'))
    .data('hardware-id', o.data('hardware-id'))
    .data('canvas-id', o.data('canvas-id'))
    if title then act.find("p.actuator-title:first").html(title.toUpperCase())
    else act.find("p.actuator-title:first").html(o.find("p.actuator-title:first").html())
    act
   
  activateDragAndDrop: ()->
    scope = this
    $('.actuation-design .draggable').draggable
      revert: true
      appendTo: '#ui2'
      scroll: false
      helper: ()->
        copy = $('<p></p>').addClass("dragbox").html($(this).attr('name') + " #" + $(this).data().hardwareId)
        return copy;
    
    $('.actuation-design .droppable').droppable
      accept: "actuator.draggable"
      classes: { "droppable-active": "droppable-default"}
      drop: (event, ui) ->
        act = scope.clone(ui.draggable)
        $(this).append(act).removeClass('actuator-droppable');
        scope.initActuator.apply(scope, [act]);
        scope.activate()
      
      
  