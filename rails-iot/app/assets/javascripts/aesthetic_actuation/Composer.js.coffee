class window.Alerter
  @dom: ()-> return $('#main-alert')
  @show: ()->
    Alerter.dom().slideDown(100)
  @hide: ()->
    Alerter.dom().fadeOut(1000)
  @warn: (op)->
    if op.strong
      Alerter.dom().find('strong').html(op.strong)
    if op.msg
      Alerter.dom().find('span').html(op.msg)

    Alerter.dom().removeClass (index, className)->
      return (className.match (/(^|\s)alert-\S+/g) || []).join(' ');
    op.color = op.color or "alert-warning"
    Alerter.dom().addClass(op.color)
    

    Alerter.show()
    if op.delay
      _.delay Alerter.hide, op.delay
  



class window.Composer
  @log: ()-> return #console.log.bind(console)
  constructor: (@op) ->
    @init()
    @now = Date.now()
    Alerter.hide()
  warn: ()->
    # console.warn("FORGOT TO SELECT AN ACTUATOR!")
    Alerter.warn
      strong: "HEADS UP"
      msg: "DON'T FORGET TO SELECT AN ACTUATOR"
      delay: 2000
  init:()->
    @live = false
    Composer.log "COMPOSER INITIALIZED"
    # @initBLSlider @op.slider
    @bindLiveButton()
    @bindSignalButton()
    @bindChoreographyButton()
  bindLiveButton:()->
    Composer.log "BINDING LIVE BUTTON"
    scope = this
    @op.live_button.click((event)->
      scope.live = not scope.live
      if scope.live then $(this).css('background', '#d9534f')
      else $(this).css('background', '#2d6a96')
    )
  bindSignalButton:()->
    Composer.log "BINDING SIGNAL SENDER"
    scope = this
    @op.signal_button.click (event)->
      ts = tsm.getActiveTimeSignal()
      actor = am.getActiveActuator()
      channel = am.getActiveChannel()

      if _.isUndefined actor
        scope.warn()
        return
      commands = ts.command_list.apply(ts)
      commands = _.map commands, (command) -> 
        cl = actor.perform(channel, command)
      commands =_.flatten(commands)
      Scheduler.schedule(commands)
  bindChoreographyButton:()->
    dom = $('choreography')
    trigger = dom.find('button')
    content = dom.find('span.async')
    trigger.data
      content: "500ms"
      placement: 'bottom'
      template: '<div class="choreography popover" role="tooltip"><div class="arrow"></div><a class="dismiss btn pull-right"><span class="glyphicon glyphicon-remove"></span></a><div class="popover-content"></div><input min="0" max="1000" step="10" type="range"/></div>'
    
    trigger.click (event)-> 
      $(this).blur()      
      event.stopPropagation()

      $('choreography').not(this).popover('hide')
      tag = this.tagName
      $(tag).removeClass 'selected'
      $(this).addClass 'selected'

      actuator = am.getActiveActuator()
      console.log actuator
      if not actuator
        Alerter.warn
          strong: "HOLD ON"
          msg: "You'll need to select an actuator to design a choreography."
          delay: 2000
          color: 'alert-info'
        return


      $('#add-arrows span.info').html("#" + actuator.id)
      trigger.popover('show')
      $('.choreography .dismiss').click ()-> $(this).parents('.popover').fadeOut(100)
      $('.choreography.popover').find('input').val(actuator.async_period)
      $('.choreography.popover').find('input').on 'click', (event)->
        event.stopPropagation()
      $('.choreography.popover').find('input').on 'input', (event)->
        pop = $(this).parents('.popover')
        t = $(this).val()
        pretty = TimeSignal.pretty_time(t)
        pop.find('.popover-content').html(pretty)
        content.html(pretty)
        actuator.form = {async_period: t}

      # ch.mode = "choreography"
      # ch.update()

    

