class window.Alerter
  @dom: ()-> return $('#main-alert')
  @show: ()->
    Alerter.dom().slideDown()
  @hide: ()->
    Alerter.dom().fadeOut()
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
    @initBLSlider @op.slider
    @bindLiveButton()
    @bindSignalButton()
  bindLiveButton:()->
    Composer.log "BINDING LIVE BUTTON"
    scope = this
    @op.live_button.click((event)->
      scope.live = not scope.live
      if scope.live 
        $(this).css('background', '#d9534f')
      else
        $(this).css('background', '#2d6a96')
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
  
  initBLSlider: (dom)->
    Composer.log "BINDING BL"
    scope = this;
    dom.on 'input', ->
      diff = Date.now() - scope.now
      if(diff < 50)
        return
      else 
        scope.now = Date.now()
      actor = am.getActiveActuator()
      if _.isUndefined actor
        scope.warn()
        return
      channel = am.getActiveChannel()
      param = parseFloat($(this).val())  
      command = {t: 0, param: param}
      commands = actor.perform(channel, command)
      commands =_.flatten(commands)
      Scheduler.schedule(commands)
    return
 
  
  
  
    

 