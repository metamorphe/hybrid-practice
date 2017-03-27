class window.TimeWidgets 
  constructor: ()->
    @cutter = new Cutter
      track: $('#timecut .track-full')
      trigger: $('#ts-cutter')
      bindKey: 'x'
    @stitcher = new Stitcher
      track: $('event#adder .track-full')
      target: $('event#adder .track-unit')
      trigger: $('#ts-adder')
      bindKey: "w"
    @timemorph = new TimeMorph
      track: $('#time-morph-track')
      slider: $('input#time-morph')
      bindKey: 't'
    @recorder= new Recorder
      recorder_button: $('button#record')
      recorder_result: $('#record-result')
      bindKey: 'r'

class TimeWidget extends Widget
  constructor: (op)->
    scope = this
    _.extend this, op
    Widget.bindKeypress @bindKey, ()-> scope.trigger.click()
  @resolveTrack: (track)->
    _.map track.find('datasignal'), (d)-> return tsm.resolve(d)
  resolveTrack: ()->
    TimeWidget.resolveTrack(@track)
class Cutter extends TimeWidget
  constructor: (op)->
    scope = this
    super(op)
    @trigger.click ->
      scope.split()
  split: ()->
    signals = @resolveTrack()
    if _.isEmpty signals then return
    signal = _.first signals
    offsetP = signal.dom.parent().offset()
    offset = signal.dom.offset()
    cut_x = offsetP.left + signal.dom.parent().width() / 2
    padding = parseFloat(signal.dom.parent().css('padding-left'))
    cut_location = cut_x + padding - (offset.left)
    cut_p = cut_location / signal.dom.width()

    signal.split
      p: cut_p
      target: @track
    return
class TimeMorph extends TimeWidget
  constructor: (op)->
    scope = this
    super(op)
    @slider.val(0)
    @track.data
      force_period: 100
    @slider.on 'input', (event)->
      v = if this.value < TimeSignal.MIN then TimeSignal.MIN else this.value
      sampler = scope.updateTime(v)
  updateTime: (v)->
    @track.data
      force_period: v
    signals = @resolveTrack()
    if _.isEmpty signals then return
    _.each signals, (signal)-> signal.form = {force_period: v}

class Stitcher extends TimeWidget
  constructor: (op)->
    scope = this
    super(op)
    @trigger.click (event)->
      scope.stitch()
  stitch: ()->
    signals = @resolveTrack()
    if _.isEmpty signals then return
    time_sum = 0
    data = _.map signals, (signal)->
      time_sum += signal.form.period
      return TimeSignal.resample(signal.command_list(), signal.form.period)
    data = _.flatten(data)
    console.log data
    dom = TimeSignal.create
      clear: true
      target: @target
    signal = new TimeSignal(dom)
    signal.form = 
      signal: data
      period: time_sum
    return 


class window.Recorder extends TimeWidget
  @DEFAULT_PERIOD: TimeSignal.MAX
  @DEFAULT_RESOLUTION: 100 # ms/sample
  @log: ()-> return#console.log.bind(console)
 
  constructor: (@op)->
    scope = this
    Recorder.log "RECORDER"
    @sub_start = Date.now()
    @elapsed = 0
    @curr_elapsed = 0
    @record = false
    @ts = tsm.resolve($('#recorder datasignal'))
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
    Widget.bindKeypress "r", ()-> scope.op.recorder_button.click()
    

  start: ()->
    scope = this
    if not sc then return
    Recorder.log "STARTED RECORDING"
    @sub_0 = Date.now()
    @sub_start = @sub_0
    @prev_param = 0
    scope.curr_elapsed = 0
    @subscription_key = sc.subscribe "output", (command)->
      now = Date.now()
      dt = now  - scope.sub_start
      if command.flag == "C"
        signal = TimeSignal.resample([{t: dt, param: scope.prev_param}], dt)
        scope.ts.inject(signal, dt)
        scope.prev_param = command.args[1]/255.0
        # scope.ts.inject.apply(scope.ts, [command.args[1]/255.0, scope.elapsed + scope.curr_elapsed, scope.elapsed + scope.curr_elapsed + dt]) 
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