class window.Composer
  @log: ()-> return#console.log.bind(console)
  constructor: (@op) ->
    @init()
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
    @op.signal_button.click((event)->
      ts = tsm.getActiveTimeSignal()
      actor = am.getActiveActuator()
      channel = am.getActiveChannel()

      commands = ts.command_list.apply(ts)
      commands = _.map commands, (command) -> 
        cl = actor.perform(channel, command)
      commands =_.flatten(commands)
     
      scope.op.signal_button.css('background', '#d9534f')
      _.each commands, (command) ->
        _.delay(am.sendCommandTo, command.t + command.async_offset, command) 
        return

      turnBack = ()->
        scope.op.signal_button.css('background', '#2d6a96')
      _.delay(turnBack, 3000)
    )
  initBLSlider: (dom)->
    Composer.log "BINDING BL"
    scope = this;
    dom.on 'input', ->
      actor = am.getActiveActuator()
      channel = am.getActiveChannel()
      param = parseFloat($(this).val())  
      command = {t: 0, param: param}
      commands = actor.perform(channel, command)
      commands =_.flatten(commands)
      _.each commands, (command) ->
        _.delay(am.sendCommandTo, command.t + command.async_offset, command)
      return
    return
 
  
  
  
    

 