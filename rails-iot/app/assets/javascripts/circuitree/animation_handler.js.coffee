class window.PerceptualScheduler 
  constructor: (@paper) ->
    scope = this
    @animations = []
    @global_time = 0

    @paper.view.onFrame = (event) ->
      scope.global_time = event.time
      _.each scope.animations, (animation) ->
        animation.run event

  add: (props) ->
    a = new Animation _.extend props,
      scheduler: this
    a.startTime = @global_time + (a.delay/1000)
    a.duration /= 1000
    @animations.push a
    a.id
  remove: (id) ->
    @animations = _.reject @animations, (animation) ->
      if animation.id == id
        animation.onKill()
      animation.id == id
    

# scheduler.add({
# 	onRun: function(){},
# 	onKill: function(){},
# 	startTime: 0, // seconds from current time
# 	duration: 1000
#   delay: 0
# })

class window.Animation
  @COUNTER: 0
  constructor: (props) ->
    scope = this
    _.extend this, props
    @id = Animation.COUNTER++

    runonce = _.isUndefined(@duration) or _.isNull(@duration) or @duration == 0
    
    # DEFAULTS
    @onRun = if _.isUndefined(@onRun) then (event)->return else @onRun
    @onKill = if _.isUndefined(@onKill) then (event)->return else @onKill
    @onDone = if _.isUndefined(@onDone) then (event)->return else @onDone
    @startTime = @startTime or 0
    @duration = @duration or 1000
    @runonce = @runonce or false
    @delay = @delay or 0

    if @runonce
      @run = (event) ->
        if event.time < scope.startTime then return
        e = _.extend event, {}
        scope.onRun e
        ch.ps.remove scope.id
    else
      @run = (event) ->
        if event.time < @startTime then return
        elapsed_time = event.time - @startTime
        e = _.extend event, 
          parameter: elapsed_time / @duration
        is_active = elapsed_time < @duration
        if is_active
         @onRun(e)
        else
          @onDone(e)
          ch.ps.remove @id
        return
    

