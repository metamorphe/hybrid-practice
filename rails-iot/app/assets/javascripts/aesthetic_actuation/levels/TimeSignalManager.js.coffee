class window.TimeSignalManager
  constructor: (@op) ->
    console.info 'TSM'
    @init()
  init:()->
    @timesignals = @initTimeSignals()
    @initSelection()
    @activateDragAndDrop()
    @bindAdder()
  
  initTimeSignals: ->
    _.map @op.collection, (canvas, i) ->
      dom = $(canvas)
      op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE), {dom: dom})
      ts = new TimeSignal(op)
  getTimeSignal: (id)->
    @timesignals[id]
  getActiveTimeSignal: ()->
    id = $('datasignal.selected').data('time_signal_id')
    @getTimeSignal(id)
  bindAdder: ()->
    scope = this
    @op.add_button.click((event)->
      ids = _.map(scope.op.add_track.find('datasignal').not('#result'), (dom)->
        return $(dom).data 'time_signal_id'
      )
      console.log ids, tsm
      tsm.addTS(ids)
    )
  addTS: (timesignal_ids)->
    console.log "ADDING"
    ts = _.map(timesignal_ids, (id)->
        return tsm.getTimeSignal(id)
      )
    console.log ts
    data = _.reduce(ts, ((memo, t)->
      memo.push(t.data)
      return memo
      ), [])
    data = _.flatten(data)
    dom = $("datasignal#result canvas").attr("data", JSON.stringify(data))
    dom = $("datasignal#result canvas").attr("period", 3000)
    op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE),
      signal_fill:
        fillColor: '#d9534f', 
      dom: dom
      )
    tsm.add(new TimeSignal(op))
    return 
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
    scope = this
    $('canvas.draggable').draggable({
      revert: true
    });
    $('acceptor.droppable').droppable({
      accept: "canvas.draggable", 
      classes: { "droppable-active": "droppable-default"},
      activate: (event, ui) ->
        if not sm then return
        sm.setAcceptorsActive(true)
      drop: (event, ui) ->
        dom = $('<canvas></canvas>').addClass('draggable')
            .attr('data', ui.draggable.attr('data'));
        $(this).parent().html("").append(dom);
        op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE), {dom: dom})
        scope.add(new TimeSignal(op)) 
      deactivate: (event, ui) ->
        if sm
          acceptor = sm.getAcceptor(event.pageX, event.pageY)
          if not _.isNull acceptor
            window.paper = sm.paper
            op = {
              paper: sm.paper,
              data: ui.draggable.attr('data'), 
              acceptor: acceptor
            }
            op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE), op)

            ts = CanvasUtil.query(paper.project, {prefix: ["TIMESIGNAL"], acceptor: acceptor.id})
            CanvasUtil.call(ts, 'remove')
            tsm.add(new TimeSignal(op))
          
          sm.setAcceptorsActive(false)
      
    })
