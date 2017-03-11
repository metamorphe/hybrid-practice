class window.Recorder
  @DEFAULT_PERIOD: 60000
  @DEFAULT_RESOLUTION: 100 # ms/sample
  @log: ()-> return#console.log.bind(console)
 
  constructor: (@op)->
    Recorder.log "RECORDER"
    @sub_start = Date.now()
    @elapsed = 0
    @curr_elapsed = 0
    @record = false
    @ts = TimeSignal.copy
      data: _.zeros(parseInt(Recorder.DEFAULT_PERIOD/Recorder.DEFAULT_RESOLUTION))
      period: Recorder.DEFAULT_PERIOD
      classes: ['draggable']
      parent: @op.recorder_result
      clearParent: true
      activate: true
      style: 
        signal_fill:
          fillColor: '#d9534f'
    @bindButton()
  bindButton: ()->
    scope = this
    @op.recorder_button.click(()->
      scope.record = not scope.record
      if scope.record 
        $(this).addClass('active');
        scope.start()  
      else
        $(this).removeClass('active');
        scope.stop()  
      )
    $(document).keypress (event) ->
      if event.which == 32 # SPACE KEY
        event.preventDefault()
        scope.op.recorder_button.click()
      if event.which == 99 # 'c' KEY
        scope.ts.inject.apply(scope.ts, [0, 0, scope.ts.period])
        scope.sub_start = Date.now()
        scope.elapsed = 0
        scope.curr_elapsed = 0
  start: ()->
    scope = this
    if not sc then return
    Recorder.log "STARTED RECORDING"
    @sub_0 = Date.now()
    @sub_start = @sub_0
    scope.curr_elapsed = 0
    @subscription_key = sc.subscribe "output", (command)->
      now = Date.now()
      dt = now  - scope.sub_start
      if command.flag == "C"
        scope.ts.inject.apply(scope.ts, [command.args[1]/255.0, scope.elapsed + scope.curr_elapsed, scope.elapsed + scope.curr_elapsed + dt]) 
      scope.curr_elapsed += dt
      scope.sub_start = now
      return
    return

  stop: ()->
    if not sc then return
    @elapsed += @curr_elapsed
    Recorder.log "STOPPED RECORDING", @elapsed
    @subscription_key = sc.unsubscribe "output", @subscription_key
    return