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
      activate: (event, ui) ->
        if not sm then return
        sm.setAcceptorsActive(true)
      drop: (event, ui) ->
        dom = $('<canvas></canvas>').addClass('draggable')
            .attr('data', ui.draggable.attr('data'))
            .attr('period', ui.draggable.attr('period'));
        id = $(this).parent('event').attr('id')
        clear = not _.contains ["adder", "library", "timemorph", "behaviors"], id
        
        draggable =  id != "timecut"
        classes = if draggable then ['draggable'] else []
        @ts = TimeSignal.copy
          clone: ui.draggable
          classes: classes
          parent: $(this)
          clearParent: clear
          activate: true
        if not draggable
          @ts.op.dom.draggable({disabled: true})
          @ts.op.dom.parent().draggable
            axis: "x"
            containment: ".track-full"
            scroll: false
      deactivate: (event, ui) ->
        if sm
          acceptor = sm.getAcceptor(event.pageX, event.pageY)
          if not _.isNull acceptor
            window.paper = sm.paper
            op =
              paper: sm.paper,
              data: ui.draggable.attr('data'), 
              acceptor: acceptor

            if not _.isUndefined ui.draggable.attr('period')
              op.period = ui.draggable.attr('period')
            op = _.extend(_.clone(TimeSignal.DEFAULT_STYLE), op)

            ts = CanvasUtil.query(paper.project, {prefix: ["TIMESIGNAL"], acceptor: acceptor.id})
            CanvasUtil.call(ts, 'remove')
            tsm.add(new TimeSignal(op))
          
          sm.setAcceptorsActive(false)

    $('.signal-design').find('.droppable[class^="track-"]').droppable(behavior)
    $('acceptor.datasignal').droppable(behavior)

