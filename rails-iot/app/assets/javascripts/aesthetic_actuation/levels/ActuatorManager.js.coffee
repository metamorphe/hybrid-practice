class window.ActuatorManager
  @extract: ()->
    LEDS = _.map CanvasUtil.queryPrefix("LED"), (led, i)->
      led.type = "LED"
      led.color = CanvasUtil.getName(led)
      # FIND TEMPLATE
      act = $('actuator.template[name="'+led.type+'"]')
        .clone().removeClass('template')
        .data('color', led.color)
        .data('canvas-id', led.id)
        .data('hardware-id', i)
      # act.find("canvas")
      $('#actuators').append(act);
      return led
    actuators = _.flatten([LEDS])
    _.each actuators, (actuator)->
      actuator.onClick = ()->
        console.log actuator.id

  constructor: (@op) ->
    @actuators = []
    
  init:()->
    ActuatorManager.extract()
    @initActuators()
    @initSelection()
    @initBLRadio($('actuator channel'))
    @activateDragAndDrop()
  initActuators: () ->
    scope = this;
    collection = @op.collection.find('actuator').not('.template')
    console.info 'Initializing actuators', collection.length
    _.each collection, (act, i) ->
      console.log i, 'actuator'
      scope.initActuator.apply(scope, [act])
  
  initActuator: (act)->
    console.log act
    scope = this
    act = $(act)
    dom = act.find('canvas')
    papel = Utility.paperSetup(dom)
    ActuatorType = act.attr('name')
    console.log ActuatorType
    color = act.data('color')
    canvas_id = act.data('canvas-id')
    hardware_id = act.data('hardware-id')
    ActuatorSimulator = eval('Actuator' + ActuatorType)
    props = _.extend(_.clone(eval(ActuatorType)),
      color: color,
      hardware_id: hardware_id
      canvas_id: canvas_id,
      paper: papel
      dom: dom)
    actuator = new ActuatorSimulator(props)
    console.log actuator
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
    query = 'channel[type="' + channel + '"]'
    $(actuator.op.dom).parents('actuator').find(query).find('.dimension').html(val);
  updateActiveChannel: (val)->
    $('actuator.selected channels label.actuator.selected').find('.dimension').html(val);

  sendCommandTo: (actuator, channel, param)->
    if _.isUndefined actuator
      console.warn("FORGOT TO SELECT AN ACTUATOR!")
      return
    window.paper = actuator.op.paper
    query = parameterized: true
    query[channel] = param
    actuator.expression = query  
    update = actuator.channels[channel].value.toFixed(0)
    val = parseInt(actuator.channels[channel].value)
    if cmp and sc
      sc.sendMessage({flag: "C", args: [actuator.hardware_id, val]}, {live: cmp.live}) 
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
  activateDragAndDrop: ()->
    scope = this
    $('actuator.draggable').draggable({
      revert: true
    });


    $('.actuator-droppable').droppable
      accept: "actuator.draggable", 
      classes: { "droppable-active": "droppable-default"},
      # activate: (event, ui) ->
        # if not sm then return
        # sm.setAcceptorsActive(true)
      drop: (event, ui) ->
        o = ui.draggable
        console.log o.attr('name'), o.data('color'), o.data('canvas-id')
        act_type = o.attr('name')
        act = $('actuator.template[name="'+name+'"]')
        .clone().removeClass('template')
        .data('color', o.data('color'))
        .data('hardware-id', o.data('hardware-id'))
        .data('canvas-id', o.data('canvas-id'))

        $(this).html("").append(act).removeClass('actuator-droppable');
        scope.initActuator.apply(scope, [act]);
        scope.initSelection()
        scope.activateDragAndDrop()
        # dom = $('<canvas></canvas>') #.addClass('draggable')
        #     .attr('data', ui.draggable.attr('data'))
        #     .attr('period', ui.draggable.attr('period'));
        # if $(this).attr('id') == "time-morph-track" then dom.addClass('draggable')
        # ts = $('<datasignal></datasignal>').append(dom)
        # $(this).append(ts);
        # op = _.extend(_.clone(TimeSignal.DEFAULT_STYLE), {dom: dom})
        # scope.add(new TimeSignal(op)) 
        
    #   deactivate: (event, ui) ->
    #     if sm
    #       acceptor = sm.getAcceptor(event.pageX, event.pageY)
    #       if not _.isNull acceptor
    #         window.paper = sm.paper
    #         op = {
    #           paper: sm.paper,
    #           data: ui.draggable.attr('data'), 
    #           acceptor: acceptor
    #         }
    #         if not _.isUndefined ui.draggable.attr('period')
    #           op.period = ui.draggable.attr('period')
    #         op = _.extend(_.clone(TimeSignal.DEFAULT_STYLE), op)

    #         ts = CanvasUtil.query(paper.project, {prefix: ["TIMESIGNAL"], acceptor: acceptor.id})
    #         CanvasUtil.call(ts, 'remove')
    #         tsm.add(new TimeSignal(op))
          
    #       sm.setAcceptorsActive(false)
      
  