class window.TimeSignalManager
  @log: ()-> return#console.log.bind(console)
  constructor: (@op) ->
    TimeSignalManager.log 'TSM'
    @timesignals = []
  init:()->
    scope = this
    $('button.view-toggle').click ->
      ds = $(this).parents('event').find('datasignal').not('.template')
      dom = $(this)
      _.each ds, (s)-> 
        ts = scope.resolve(s)
        if _.isUndefined(ts) then return 
        view = if ts.view == "hue" then "intensity" else "hue"
        dom.parents('event').find('[class^=track]').data('codomain', view)

        ts.toggle_visual(view)
    @populateHues()
    @initTimeSignals()
    @initSelection()
    @activateDragAndDrop()
  populateHues: ()->
    template = $('datasignal.template')
    hues  = _.map _.range(0, 360, 45), (h)->
      h = h / 360
      t = template.clone().removeClass("template")
      t.find('canvas').attr("data", JSON.stringify([h, h, h]))
      t.find('canvas').attr("period", 500)
      return t
    $('#hues').append(hues)
  initTimeSignals: ->
    console.log("SIGNALS",@op.collection().length )
    _.map @op.collection(), (canvas, i) ->
      dom = $(canvas)
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
      scroll: false


    $('datasignal canvas.draggable').draggable
      revert: true
      appendTo: '#ui2'
      scroll: false
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
        num_to_accept = $(this).data().accept
        drag_in_place = $(this).data().draginplace == "enabled"
        exportable = $(this).data().exportable == "enabled"
        composeable = $(this).data().composeable == "enabled"
        widget = $(this).parent('event').attr('id')

        @ts = TimeSignal.copy
          clone: ui.draggable
          parent: $(this)
          clearParent: num_to_accept == 1
          activate: true
          dragInPlace: drag_in_place
          exportable: exportable
          composeable: composeable


    $('.signal-design').find('.droppable[class^="track-"]').droppable(behavior)
    $('acceptor.datasignals').droppable(behavior)

