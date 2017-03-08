class window.Composer
  constructor: (@op) ->
    @init()
  init:()->
    @live = false
    console.info "COMPOSER INITIALIZED"
    @initBLSlider @op.slider
    @bindLiveButton()
    @bindSignalButton()
  bindLiveButton:()->
    scope = this
    @op.live_button.click((event)->
      scope.live = not scope.live
      if scope.live 
        $(this).css('background', '#d9534f')
      else
        $(this).css('background', '#2d6a96')
    )
  bindSignalButton:()->
    scope = this;
    @op.signal_button.click((event)->
      commands = tsm.getActiveTimeSignal().command_list(3000)
      act = am.getActiveActuator()
      channel = am.getActiveChannel()
      # console.log commands, act, channel
      scope.op.signal_button.css('background', '#d9534f')
      _.each commands, (command) ->
        _.delay(am.sendCommandTo, command.t, act, channel, command.param) 
        return

      turnBack = ()->
        scope.op.signal_button.css('background', '#2d6a96')
      _.delay(turnBack, 3000)
    )
  initBLSlider: (dom)->
    scope = this;
    console.log "BINDING BL"
    dom.on 'input', ->
      act = am.getActiveActuator()
      channel = am.getActiveChannel()
      param = parseFloat($(this).val())  
      _.delay(am.sendCommandTo, 0, act, channel, param)
      return
    return
 
  
  
  
    

 