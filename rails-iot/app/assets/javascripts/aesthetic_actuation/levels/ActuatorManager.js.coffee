class window.ActuatorManager
  @DEFAULT_ASYNC: 30
  @create: (op)->
    if op.clear then op.target.find('actuator').remove()
    dom = $('actuator.template[name="'+ op.actuator_type+'"]')
      .clone().removeClass('template')
    data = 
      actuator_type: op.actuator_type
      constants: op.constants
      hardware_ids: op.hardware_ids
      canvas_ids: op.canvas_ids
      title: op.title or op.actuator_type
      saved: op.saved
      async_period: ActuatorManager.DEFAULT_ASYNC
    dom.data data
    op.target.append(dom)
    op.target.addClass("accepted")
    ActuatorType = op.actuator_type
    ActuatorSimulator = eval('Actuator' + ActuatorType)
    props = _.clone(eval(ActuatorType))
    set = dom.data()
    actuator = new ActuatorSimulator(dom, set, props)
    if op.addSignalTrack then bm.addSignalTrack(actor)
    return dom

  @extract: ()->
    console.info "EXTRACTING ACTUATORS FROM ARTWORK"
    hsbLEDs = CanvasUtil.queryPrefix("NLED")
    hsbLEDs = _.map hsbLEDs, (led, i)->
      data = JSON.parse(CanvasUtil.getName(led))   
      ActuatorManager.create
        clear: false
        target: $('#actuators .track-full')
        actuator_type: "HSBLED"
        hardware_ids: [led.lid]
        canvas_ids: [led.id]
        saved: true
        constants: 
          color: rgb2hex(new paper.Color(data.colorID).toCSS())
   
    
  constructor: (@op) ->
    @actuators = []
  init:()->
    # @initActuators() #PRELOAD
    ActuatorManager.extract() #DYNAMIC
    @initBLRadio($('actuator channel'))
      
  initActuators: () ->
    scope = this;
    collection = $('actuator[name]:not(.template)')
    console.info 'Initializing actuators', collection.length
    _.each collection, (act, i) ->
      scope.initActuator.apply(scope, [act])


  add: (actuator)->
    @actuators.push(actuator)
    @updateChannels(actuator)
    @initSelection() 
    $(".remove").click ()->
      $(this).parents('acceptor').removeClass("accepted")   
      $(this).parents('actuator').remove()   
    @activateDragAndDrop()
    @listen()

  listen: ->
    $('[contenteditable]').on('focus', ()->
      scope = $(this)
      scope.data 'before', scope.html()
      return scope;
    ).on('blur keyup paste', ()->
      scope = $(this);
      if scope.data('before') != scope.html()
        scope.data 'before', scope.html()
        scope.trigger('change')
      return scope;
    )
    $('label.title[contenteditable').on 'change', ()->
      actor = am.resolve($(this).parents('actuator'))
      actor.form =
        title: $(this).html()
  initActuator: (act, op)->
    scope = this
    dom = $(act)
    ActuatorType = dom.attr('name')
    ActuatorSimulator = eval('Actuator' + ActuatorType)
    props = _.clone(eval(ActuatorType))
    set = dom.data()
    actuator = new ActuatorSimulator(dom, set, props)
    
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
    channels = $(actuator.dom).find('channel')
    _.map(channels, (channel)-> $(channel).attr('type'))
  getActiveChannel: ()->
    $('actuator.selected channels label.actuator.selected').parents('channel').attr('type');
  updateChannel: (actuator, channel)->
    val = actuator.channels[channel].value
    val =  if val < 1 and val > 0 then val.toFixed(2) else val.toFixed(0)
    query = 'channel[type="' + channel + '"]'
    $(actuator.dom).find(query).find('.dimension').html(val);
  updateChannels: (actuator)->
    scope = this
    channels = @getChannels(actuator)
    _.each channels, (channel)->
      scope.updateChannel(actuator, channel)
      
  updateActiveChannel: (val)->
    val =  if val < 1 and val > 0 then val.toFixed(2) else val.toFixed(0)
    $('actuator.selected channels label.actuator.selected').find('.dimension').html(val);
  sendCommandTo: (command)->
    if _.isUndefined command.actuator
      console.warn("FORGOT TO SELECT AN ACTUATOR!")
      return 
    actuator = command.actuator
    cl = actuator.perform(command.channel, command)
    if cmp and sc 
      # console.log command.api.args.join(','), "@", command.t, command.async_offset
      sc.sendMessage(command.api, {live: cmp.live}) 
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

      actor = am.resolve($(this))
      if actor
        channel = am.getActiveChannel()
        value = actor.getChannelParam(channel)
        cmp.op.slider.val value
        ch.select(actor.form.canvas_ids)

      return
    $('label.actuator').click ->
      siblings = $(this).parents('channels').find('label.actuator').not(this).removeClass('selected');
      $(this).addClass('selected')
      return
  
   
  activateDragAndDrop: ()->
    scope = this
    $('actuator.draggable').draggable
      handle: 'canvas'
      revert: true
      appendTo: '#ui2'
      helper: ()->
        copy = $('<p></p>').addClass("dragbox").html($(this).attr('name') + " #" + $(this).data().hardware_ids.join(','))
        return copy;
    
    $('.actuation-design .droppable, acceptor.actuator').droppable
      accept: "actuator.draggable"
      classes: { "droppable-active": "droppable-default"}
      drop: (event, ui) ->
        empty = $(this).html() == ""
        num_to_accept = $(this).data().accept

        actor = scope.resolve(ui.draggable)
        ops = _.extend actor.form,
          clear: num_to_accept == 1
          target: $(this)
          addSignalTrack: $(this).parents(".composition-design").length != 0 and empty
        
        ActuatorManager.create ops
        
      
      
  