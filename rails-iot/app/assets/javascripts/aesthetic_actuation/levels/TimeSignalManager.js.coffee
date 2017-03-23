class window.TimeSignalManager
  @log: ()-> return#console.log.bind(console)
  constructor: (@op) ->
    TimeSignalManager.log 'TSM'
    @timesignals = []
  init:()->
    @initTimeSignals()
    @initSelection()
    @activateDragAndDrop()
  initTimeSignals: ->
    console.log("SIGNALS",@op.collection.length )
    _.map @op.collection, (canvas, i) ->
      dom = $(canvas)
      if dom.hasClass('skip') then return
      op = _.extend(_.clone(TimeSignal.DEFAULT_STYLE), {dom: dom})
      ts = new TimeSignal(op)
      tsm.add.apply(tsm, [ts])
  resolve: (dom)->
    @getTimeSignal($(dom).data('time_signal_id'))
  getTimeSignal: (id)->
    @timesignals[id]
  getActiveTimeSignal: ()->
    id = $('datasignal.selected').data('time_signal_id')
    @getTimeSignal(id)
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


    $('datasignal canvas.draggable').draggable
      revert: true
      appendTo: '#ui2'
      helper: ()->
        copy = $('<p></p>').addClass("dragbox").html TimeSignal.pretty_time($(this).attr('period'))
        return copy;

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
      accept: "canvas.draggable", 
      classes: { "droppable-active": "droppable-default"},
      drop: (event, ui) ->  
        widget = $(this).parent('event').attr('id')
        clearParent = not _.contains ["adder", "library", "timemorph", "behaviors"], widget
        # classes = if widget == "timecut" then ['draggable'] else []
        

        @ts = TimeSignal.copy
          clone: ui.draggable
          parent: $(this)
          clearParent: clearParent
          activate: true
          dragInPlace: widget == "timecut"
          draggable: widget != "timecut"


    $('.signal-design').find('.droppable[class^="track-"]').droppable(behavior)
    $('acceptor.datasignal').droppable(behavior)

