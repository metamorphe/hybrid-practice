class window.TimeWidgets 
  constructor: ()->
    @cutter = new Cutter
      track: $('#timecut .track-full')
      trigger: $('#ts-cutter')
      bindKey: 24 #ctrl+x
    @stitcher = new Stitcher
      track: $('event#adder .track-full')
      target: $('event#adder .track-unit')
      trigger: $('#ts-adder')
      bindKey: 23 #ctrl+w
    @timemorph = new TimeMorph
      track: $('#time-morph-track')
      slider: $('input#time-morph')
      bindKey: 20 #ctrl+t

    @reflector = new Reflector
      track: $('event#reflect .track-full')
      target: $('event#reflect .track-full')
      trigger: $('#ts-reflector')
      bindKey: 18 #ctrl+t
    
    @recorder= new HueWidget
      track: $('event#hues .track-full')
      slider: $('event#hues input')
      status: $('event#hues .command')
      target: $('event#adder .track-full')
      
class window.TimeWidget extends Widget
  constructor: (op)->
    scope = this
    _.extend this, op
    if @bindKey
      Widget.bindKeypress @bindKey, (()-> 
        if scope.trigger
          scope.trigger.click()), true
  @resolveTrack: (track, exclude)->
    exclude = exclude or ""
    _.map $(track).find('datasignal').not(exclude), (d)-> return tsm.resolve(d)
  resolveTrack: ()->
    TimeWidget.resolveTrack(@track)

class HueWidget extends TimeWidget
  @NUM_OF_COLORS: 360/50
  @SHADES_OF_GREY: 1/20
  @DEFAULT_PERIOD: 500
  constructor:(op)->
    super op
    scope = this
    @period = HueWidget.DEFAULT_PERIOD
    @populate()
    @update(@period)
    @slider.on 'input', (event)->
      t = $(this).val()
      scope.update(t)
  update:(t)->
    @status.html(TimeSignal.pretty_time(t))
    @period = t
  populate: ()->
    scope = this
    greys  = _.map _.range(0, 1, HueWidget.SHADES_OF_GREY), (g)->
      swatch = $('<div></div>').addClass('swatch')
      c = new paper.Color("white")
      c.brightness = g
      swatch.data('intensity', g)
      swatch.css('background', c.toCSS())
      return swatch
    @track.append(greys)
    hues  = _.map _.range(0, 360, HueWidget.NUM_OF_COLORS), (h)->
      swatch = $('<div></div>').addClass('swatch')
      c = new paper.Color("red")
      c.hue = h
      swatch.data('intensity', h/360)
      swatch.css('background', c.toCSS())
      return swatch
    @track.append(hues)
    
    $('.swatch').click ()->
      i = $(this).data().intensity
      dom = TimeSignal.create
        clear: false
        target: scope.target
      setter = 
        signal: [i, i, i]
        period: scope.period
      signal = new TimeSignal(dom, setter)

class Reflector extends TimeWidget
  constructor: (op)->
    scope = this
    super(op)
    @trigger.click ->
      scope.reflect()
  reflect: ()->
    scope = this
    signals = @resolveTrack()
    if _.isEmpty signals then return
    scope.target.find(".trash").click()
    _.each signals, (base_signal)->
      dom = TimeSignal.create
        target: scope.target

      base_signal = new TimeSignal dom, 
        signal: _.clone(base_signal.form.signal).reverse()
        period: base_signal.form.period
      # signals = signals.slice(1)
      # data = _.map signals, (subsignal)->
        # base_signal.inject(subsignal.command_list(), subsignal.form.period)
    


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
    # console.log cut_p
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

    base_signal = signals[0]
    dom = TimeSignal.create
      clear: true
      target: @target
    base_signal = new TimeSignal dom, 
      signal: base_signal.form.signal
      period: base_signal.form.period
    signals = signals.slice(1)

    data = _.map signals, (subsignal)->
      base_signal.inject(subsignal.command_list(), subsignal.form.period)
  




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