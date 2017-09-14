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
      async_period: op.async_period
    if op.override
      data.id = op.id
    dom.data data

    op.target.append(dom)
    op.target.addClass("accepted")
    ActuatorType = op.actuator_type
    ActuatorSimulator = eval('Actuator' + ActuatorType)
    props = _.clone(eval(ActuatorType))
    set = dom.data()
    if op.override
      props.id = op.id
    actuator = new ActuatorSimulator(dom, set, props)
    if op.focus
      dom.click()
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
   
  gatherActuators: ()->
    scope = this
    actuators = _.map $('actuator:not(.template):not(.meta'), (dom)->
      if $(dom).parents('#group-result').length == 0
        scope.resolve(dom)
    return _.compact actuators
  resolve: (dom)->
    id = $(dom).data('id')
    @getActuator(id)
  getActuator: (id)->
    @actuators[id]
  getActiveActuator: ()->
    id = $('actuator.selected').data('id')
    @getActuator(id)

  constructor: (@op) ->
    @actuators = {}
  init:()->
    @initActuators() #PRELOAD
    # ActuatorManager.extract() #DYNAMIC
    @initBLRadio($('actuator channel'))
      
  initActuators: () ->
    scope = this;
    collection = $('.composition-design actuator[name]:not(.template)')
    _.each collection, (act, i) ->
      scope.initActuator.apply(scope, [act])


  add: (actuator)->
    # @actuators.push(actuator)
    @actuators[actuator.id] = actuator
    @updateChannels(actuator)
    $(".remove").click ()->
      $(this).parents('acceptor').removeClass("accepted")   
      $(this).parents('actuator').remove()   
    @activateDragAndDrop()
    @listen()

  listen: ->
    $('.content-editable').dblclick (e)->
      e.stopPropagation();
      e.preventDefault();
      $(this).attr('contenteditable', 'plaintext-only')
      # Widget.bindings_on = false

      $('[contenteditable]').on('focus', ()->
        scope = $(this)
        scope.data 'before', scope.html()
        return scope;
      ).on('blur keyup paste', (e)->
        scope = $(this);
        if scope.data('before') != scope.html()
          scope.data 'before', scope.html()
          scope.trigger('change')
        return scope;
      ).on("keydown", (e)->
        key = e.keyCode || e.charCode
        if key == 13
          $(this).blur()
      )
      
      $(this).on 'focus', (e)->
        Widget.bindings_on = false
      $(this).on 'blur', (e)->
        Widget.bindings_on = true
        actor = am.resolve($(this).parents('actuator'))
        actor.form =
          title: $(this).html()
          saved: false
        $(this).unbind('blur')
        $(this).unbind('focus')
        $(this).prop('contenteditable', false)
      $(this).focus()
      
      
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
  
  getChannels:(actuator)->
    channels = $(actuator.dom).find('channel')
    _.map(channels, (channel)-> $(channel).attr('type'))
  getActiveChannel: ()->
    $('actuator.selected channels channel.selected').attr('type')
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
  
  # sendCommandById: (a_id, channel, ts_id)->
  #   scope = this
  #   act = @getActuator(a_id)
  #   ts = tsm.getTimeSignal(ts_id)
  #   commands = ts.command_list.apply(ts)
  #   _.each commands, (command) ->
  #     _.delay(am.sendCommandTo, command.t, act, channel, command.param) 
  #     return
  
  activateDragAndDrop: ()->
    scope = this
    $('actuator.draggable').draggable
      revert: true
      appendTo: '#ui2'
      cursorAt: { bottom: 5 }
      helper: ()->
        a = scope.resolve($(this))
        title = a.title
        # $(this).attr('name') + " #" + $(this).data().hardware_ids.join(',')
        copy = $('<p></p>').addClass("dragbox").html(a.title)
        return copy;
      start: (event, ui)->
        if $(this).parent().data('ui-droppable')
          $(this).parent().droppable("disable")
      stop: (event, ui)->
        if $(this).parent().data('ui-droppable')
          $(this).parent().droppable("enable")
    

    
      
      
  