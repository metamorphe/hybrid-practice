class window.TimeSignalManager
  
  @log: ()-> return#console.log.bind(console)
  constructor: (@op) ->
    TimeSignalManager.log 'TSM'
    @timesignals = []
  init:()->
    
    @activateTrackButtons()
    @initTimeSignals()
    @initSelection()
  activateTrackButtons: ()->
    scope = this
    $(".trash").click ()->
      $(this).siblings().not('button').remove()
    $('button.view-toggle').click ->
      dom = $(this)
      ds = dom.parents('event').find('datasignal').not('.template')
      view = dom.parents('[class^=track]').data('view')
      n_view = if view == "hue" then "intensity" else "hue"
      
      _.each ds, (s)-> 
        ts = scope.resolve(s)
        if _.isUndefined(ts) then return 
        ts.form =  {view: n_view}
        dom.parents('event').find('[class^=track]').data('view', n_view)
  
  initTimeSignals: ->
    collection = $('datasignal')
    console.log("SIGNALS",collection.length )
    _.map collection, (datasignalDOM, i) ->
      ts = new TimeSignal($(datasignalDOM))
  resolve: (dom)->
    @getTimeSignal($(dom).data('id'))
  getTimeSignal: (id)->
    @timesignals[id]
  getActiveTimeSignal: ()->
    @resolve($('datasignal.selected'))
  initSelection: ()->
    scope = this
    $('datasignal').click ->
      tag = @tagName
      $(tag).removeClass 'selected'
      $(this).addClass 'selected'

  add: (ts)->
    @timesignals.push(ts)
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
      revert: true
      appendTo: '#ui2'
      scroll: false
      helper: ()->
        copy = $('<p></p>').addClass("dragbox").html TimeSignal.pretty_time($(this).data('period'))
        return copy;
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
        grid: [1, 87/tracks]
        stack: 'datasignal.composeable'


  activateDrop: ()->
    scope = this  

    behavior = 
      accept: "datasignal.exportable", 
      classes: { "droppable-active": "droppable-default"},
      drop: (event, ui) ->
        num_to_accept = $(this).data().accept
        ts = scope.resolve(ui.draggable).form
        
        dom = TimeSignal.create
          clear: num_to_accept == 1
          target: $(this)
        signal = new TimeSignal(dom)
        signal.form = {signal: ts.signal, period: ts.period}
        $(this).addClass('accepted')


    $('.signal-design').find('.droppable[class^="track-"]').droppable(behavior)
    $('acceptor.datasignals').droppable(behavior)

