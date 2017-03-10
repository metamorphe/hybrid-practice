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
    new_dom = TimeSignal.makeDOM
      data: _.zeros(parseInt(Recorder.DEFAULT_PERIOD/Recorder.DEFAULT_RESOLUTION))
      period: Recorder.DEFAULT_PERIOD
      classes: ['draggable']
    @op.recorder_result.html("").append(new_dom)
    op = _.extend(_.clone(TimeSignal.DEFAULT_STYLE),
      signal_fill:
        fillColor: '#d9534f', 
      dom: new_dom.find('canvas')
      )
    @ts = new TimeSignal op
    tsm.add @ts
    @bindButton()
  bindButton: ()->
    scope = this
    @op.recorder_button.click(()->
      scope.record = not scope.record
      if scope.record 
        $(this).css('background', '#d9534f')
        scope.start()  
      else
        $(this).css('background', '#2d6a96')
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