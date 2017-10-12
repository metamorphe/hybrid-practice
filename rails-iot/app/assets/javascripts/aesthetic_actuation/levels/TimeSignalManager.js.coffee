class window.TimeSignalManager
  
  @log: ()-> return#console.log.bind(console)
  constructor: (@op) ->
    TimeSignalManager.log 'TSM'
    @timesignals = {}
  init:()->
    @activateTrackButtons()
    @initTimeSignals()
    @initEasings()
  activateTrackButtons: ()->
    scope = this
    $(".trash").click ()->
      $(this).siblings().not('button').remove()
    $('.signal-design .view-toggle').click ->
      dom = $(this)
      ds = dom.parents('event').find('datasignal').not('.template')
      view = dom.parents('[class^=track]').data('view')
      n_view = if view == "hue" then "intensity" else "hue"
      
      _.each ds, (s)-> 
        ts = scope.resolve(s)
        if _.isUndefined(ts) then return 
        ts.form =  {view: n_view}
        dom.parents('event').find('[class^=track]').data('view', n_view)
  gatherSignals: ()->
    scope = this
    signals = _.map $("behavior datasignal:not(.template)"), (dom)->
      scope.resolve(dom)
    return _.reject signals, (s)-> s.easing
  initEasings: ->
    # console.log "EASING"
    easings = TimeSignalManager.EasingFunctions
    _.each easings, (easing, v)->
      datasignal = numeric.linspace(0, 1, 40)
      datasignal = _.map datasignal, (s)-> easing(s)
      dom = TimeSignal.create
          clear: false
          target: $('#library.signal-design .track-full')
      signal = new TimeSignal(dom)
      signal.form = {signal: datasignal, period: 1000}
      signal.easing = true
      if v == "off"
        signal.dom.attr('name', 'all_off')
        # console.log datasignal
        # console.log "ON"
        datasignal = numeric.linspace(1, 0, 40)
        datasignal = _.map datasignal, (s)-> return 1
        # console.log datasignal 
        dom = TimeSignal.create
            clear: false
            target: $('#library.signal-design .track-full')
        signal = new TimeSignal(dom)
        signal.form = {signal: datasignal, period: 1000}
        signal.easing = true
        signal.dom.attr('name', 'all_on')

      else
        datasignal = numeric.linspace(1, 0, 40)
        datasignal = _.map datasignal, (s)-> easing(s)
        dom = TimeSignal.create
            clear: false
            target: $('#library.signal-design .track-full')
        signal = new TimeSignal(dom)
        signal.form = {signal: datasignal, period: 1000}
        signal.easing = true
     
        


  initTimeSignals: ->
    collection = $('datasignal')
    _.map collection, (datasignalDOM, i) ->
      dom = $(datasignalDOM)
      dom = TimeSignal.popover(dom)
      ts = new TimeSignal(dom)
  resolve: (dom)->
    @getTimeSignal($(dom).data('id'))
  getTimeSignal: (id)->
    @timesignals[id]
  getActiveTimeSignal: ()->
    @resolve($('datasignal.selected'))
  add: (ts)->
    # @timesignals.push(ts)
    @timesignals[ts.id] = ts
    @activateDragAndDrop()
  activateDragAndDrop: ()->
    @activateDrag()
    @activateDrop()
  activateDrag: ()->
    scope = this
    $('.sortable').sortable
      placeholder: "ui-state-highlight"
      scroll: false

    $('datasignal.exportable').draggable
      cursorAt: { bottom: 5 }
      revert: true
      appendTo: '#ui2'
      scroll: false
      helper: ()->
        copy = $('<p></p>').addClass("dragbox").html TimeSignal.pretty_time($(this).data('period'))
        return copy;
      start: (event, ui)->
        p = $(this).parent()
        if p.hasClass('mini') and p.data('ui-droppable')
          p.droppable("disable")
      stop: (event, ui)->
        p = $(this).parent()
        if p.hasClass('mini') and p.data('ui-droppable')
          p.droppable("enable")
    
    $('datasignal.draggable').draggable
      revert: false
      scroll: false
      containment: 'parent'
      axis: 'x'



    _.each $('datasignal.composeable'), (signal)->
      tracks = $(signal).parent().data().tracks

      $(signal).draggable
        revert: false
        containment: 'parent'
        scroll: false
        # snap: true
        # snapMode: "outer"
        # snapTolerance: 10
        # grid: [1, 87/tracks]
        axis: 'x'
        stack: 'datasignal.composeable'
        drag: (e, ui)->
          track_id = $(this).data().track
          if not _.isNull(track_id)
            Track.library[track_id].update()
         
    $('datasignal.composeable').mousedown (event)->
        if event.shiftKey
          # console.log "SHIFT"
          $(this).draggable( "option", "containment", "document" )
          $(this).draggable( "option", "axis", false)
          $(this).draggable( "option", "revert", true)
          $(this).draggable( "option", "appendTo", '#ui2')
          $(this).draggable( "option", "helper", ()->
            copy = $('<p></p>').addClass("dragbox").html TimeSignal.pretty_time($(this).data('period'))
            return copy
          )
          $(this).addClass("exportable")
        else
          # console.log "UNSHIFT"
          $(this).draggable( "option", "containment", "parent" )
          $(this).draggable( "option", "axis", 'x' )
          $(this).draggable( "option", "revert", false)
          $(this).draggable( "option", "helper", "original")
          $(this).draggable( "option", "appendTo", "parent")
          $(this).removeClass("exportable")
         

  activateDrop: ()->
    scope = this  

    behavior = 
      accept: "datasignal.exportable", 
      classes: { "droppable-active": "droppable-default"},
      drop: (event, ui) ->
        num_to_accept = $(this).data().accept
        ts = scope.resolve(ui.draggable).form
        
        console.log "CREATION"
        dom = TimeSignal.create
          clear: num_to_accept == 1
          target: $(this)
        signal = new TimeSignal(dom)

        newForm = 
          signal: ts.signal
          period: ts.period
          
        data = $(this).data()
        if data.name == "Track"
          newForm.track = data.id
        signal.form = newForm
          
        signal.dom.click()
        $(this).addClass('accepted')



    $('.signal-design').find('.droppable[class^="track-"]').droppable(behavior)
    $('acceptor.datasignals:not(.derived)').droppable(behavior)
  @EasingFunctions =
    off: (t) ->
      return 0
    linear: (t) ->
      t
    easeInQuad: (t) ->
      t * t
    easeOutQuad: (t) ->
      t * (2 - t)
    easeInOutQuad: (t) ->
      if t < .5 then 2 * t * t else -1 + (4 - (2 * t)) * t
    easeInCubic: (t) ->
      t * t * t
    easeOutCubic: (t) ->
      --t * t * t + 1
    easeInOutCubic: (t) ->
      if t < .5 then 4 * t * t * t else (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    easeInQuart: (t) ->
      t * t * t * t
    easeOutQuart: (t) ->
      1 - (--t * t * t * t)
    easeInOutQuart: (t) ->
      if t < .5 then 8 * t * t * t * t else 1 - (8 * --t * t * t * t)
    easeInQuint: (t) ->
      t * t * t * t * t
    easeOutQuint: (t) ->
      1 + --t * t * t * t * t
    easeInOutQuint: (t) ->
      if t < .5 then 16 * t * t * t * t * t else 1 + 16 * --t * t * t * t * t

