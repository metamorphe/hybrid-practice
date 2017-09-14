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
    @bindOnOff()
  bindOnOff: ()->
    $('button#all-on').click ()-> 
      console.log "ALL ON"   
      actor = $('actuator label.title:contains("ALL")').parents('actuator')
      actor = am.resolve(actor)
      on_b = $('datasignal[name="all_on"]')
      on_b = tsm.resolve(on_b)
      channel = "brightness"

      if actor
        if on_b 
          commands = on_b.command_list.apply(on_b)
          commands = _.map commands, (command) -> 
            command.channel = channel
            cl = actor.perform(command)
          commands =_.flatten(commands)
        Scheduler.schedule(commands)
      else
        Alerter.warn
          strong: "NO ALL BEHAVIOR FOUND"
          msg: "Make an actuator group with title 'ALL'"
    $('button#all-off').click ()->
      console.log "ALL OFF"
      actor = $('actuator label.title:contains("ALL")').parents('actuator')
      actor = am.resolve(actor)
      off_b = $('datasignal[name="all_off"]')
      off_b = tsm.resolve(off_b)
      channel = "brightness"
      
      if actor
        if off_b 
          commands = off_b.command_list.apply(off_b)
          commands = _.map commands, (command) -> 
            command.channel = channel
            cl = actor.perform(command)
          commands =_.flatten(commands)
          Scheduler.schedule(commands)
      else
        Alerter.warn
          strong: "NO ALL BEHAVIOR FOUND"
          msg: "Make an actuator group with title 'ALL'"

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

      if not actor and not channel
        alertify.notify "<b> Whoops! </b> Don't forget to specify an actuator and channel to send it to.", 'error', 3
      else if not channel
        alertify.notify "<b> Whoops! </b> Don't forget to specify a channel to send it to.", 'error', 3
      else
        commands = ts.command_list.apply(ts)
        _.each commands, (command) -> command.channel = channel
        commands = _.map commands, (command) -> 
          cl = actor.perform(command)
        commands =_.flatten(commands)
      # debugger;
      Scheduler.schedule(commands)
  bindChoreographyButton:()->
    dom = $('choreography')
    trigger = dom.find('button.choreo')
    content = dom.find('span.async')
    trigger.data
      content: "500ms"
      placement: 'bottom'
      template: '<div class="choreography popover" role="tooltip"><a class="dismiss btn pull-right"><span class="glyphicon glyphicon-remove"></span></a><div class="arrow"></div><div class="popover-content"></div><div class="title"></div><input min="0" max="1000" step="10" type="range"/></div>'
    
    trigger.click (event)-> 
      console.log "CLICK"
      $(this).blur()      
      event.stopPropagation()

      # $('choreography').not(this).popover('hide')
     
      actuator = am.getActiveActuator()

      if not actuator
        Alerter.warn
          strong: "HOLD ON"
          msg: "You'll need to select an actuator to design a choreography."
          delay: 2000
          color: 'alert-info'
        return

      choreo = actuator.choreo
      trigger.popover('show')
      console.log "ACTIVE ACTUATOR", actuator.form.title
      $('.choreography .dismiss').click ()-> $(this).parents('.popover').fadeOut(100)
      # $('.choreography.popover').find('.title').html(actuator.title)
      # $('.choreography.popover').find('input').val(actuator.async_period)
      console.log "UPDATING", choreo
      choreo.update()
      $('.choreography.popover').find('input').on 'click', (event)->
        event.stopPropagation()
      $('.choreography.popover').find('input').on 'input', (event)->
        actuator = am.getActiveActuator()

        if not actuator
          Alerter.warn
            strong: "HOLD ON"
            msg: "You'll need to select an actuator to design a choreography."
            delay: 2000
            color: 'alert-info'
          return

        choreo = actuator.choreo
        pop = $(this).parents('.popover')
        t = $(this).val()
        choreo.form = {async_period: t}
        choreo.update()
        

      ch.mode = "choreography"
      ch.update()

    

