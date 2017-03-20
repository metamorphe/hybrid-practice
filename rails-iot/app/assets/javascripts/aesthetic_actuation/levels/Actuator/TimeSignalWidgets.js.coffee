class window.TimeWidgets 
  constructor: ()->
    console.log "TIMEWIDGET"
    @cutter = new Cutter()
    @stitcher = new Stitcher
      track: $('event#adder .track-full')
      result: $('event#adder .track-unit')
      trigger: $('#ts-adder')
    @timemorph = new TimeMorph
      time_track: $('#time-morph-track')
      time_slider: $('input#time-morph')
    @recorder= new Recorder
      recorder_button: $('button#record')
      recorder_result: $('#record-result')

class Cutter extends Widget
  constructor: (@op)->
    Widget.bindKeypress "x", ()-> $('#ts-cutter').click()
    $('#ts-cutter').click ->
      ds = $('#timecut .track-full datasignal')
      id = ds.data().time_signal_id
      ts = tsm.getTimeSignal(id)
      offsetP = ds.parent().offset()
      offset = ds.offset()
      cut_x = offsetP.left + ds.parent().width() / 2
      padding = parseFloat(ds.parent().css('padding-left'))
      cut_location = cut_x + padding - (offset.left)
      cut_p = cut_location / ds.width()
      if cut_p < 0 or cut_p >= 1 then return
      ts.split cut_p
      return
class TimeMorph extends Widget
  constructor: (@op)->
    scope = this
    @op.time_slider.val(0)
    updateTime = ()->
      ids = _.map scope.op.time_track.find('datasignal'), (dom)->
        id = $(dom).data 'time_signal_id'
        ts = tsm.getTimeSignal(id)
        v = scope.op.time_slider.val()
        props = 
          period: parseFloat(v)
        ts.updatePeriod.apply(ts, [props])

    sampler = 0
    @op.time_slider.on 'input', (event)->
      sampler = updateTime()
    # @op.time_slider.on 'mousedown', (event)->
    #   sampler = _.repeat(updateTime, 100)
      
    # @op.time_slider.on 'mouseup', (event)->
    #   clearTimeout(sampler);
    #   console.log $(this).val()
    #   that = $(this)
    #   d = $(this).val()
      
      # animate = _.range(0, 700, 10)
      # _.each animate, (t)->
      #   p = t / 1000
      #   p = 1 - p
      #   p = p * p * p
      #   _.delay((()-> that.val(p * d)), t)
class Stitcher extends Widget
  constructor: (@op)->
    scope = this
    Widget.bindKeypress "w", ()->  scope.op.trigger.click()
    
    @op.trigger.click((event)->
      ids = _.map(scope.op.track.find('datasignal'), (dom)->
        return $(dom).data 'time_signal_id'
      )
      scope.stitch.apply(scope, [ids])
    )
  stitch: (ids)->
    ts = _.map ids, (id)-> return tsm.getTimeSignal(id)
    time_sum = _.reduce ts, ((memo, t)-> return memo + t.period), 0
    series = _.map ts, (t)-> return t.time_series()

    elapsed_time = 0
    data = _.map series, (s, i)->
      if i > 0
        prev_t = ts[i - 1].period
        elapsed_time += prev_t
      return _.map s, (c, i)-> {t: c.t + elapsed_time, p: c.p}

    data = _.flatten(data) 
    data = TimeSignal.resample(data, time_sum)
    new_dom = TimeSignal.copy
      data: data
      period: time_sum
      classes: ['draggable']
      parent: @op.result
      clearParent: true
      activate: true
      style:
        signal_fill:
          fillColor: '#d9534f', 
    return 
class window.Recorder extends Widget
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
    Widget.bindKeypress 32,((event) ->
      event.preventDefault()
      scope.op.recorder_button.click()), true

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