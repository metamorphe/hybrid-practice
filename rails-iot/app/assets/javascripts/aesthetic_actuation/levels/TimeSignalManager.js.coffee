class window.TimeSignalManager
  constructor: (@op) ->
    console.info 'TSM'
    @init()
  init:()->
    @timesignals = @initTimeSignals()
    @initSelection()
    @activateDragAndDrop()
    @bindAdder()
    @bindTimeMorph()
  bindTimeMorph: ()->
    scope = this
    @op.time_slider.val(TimeSignal.DEFAULT_PERIOD)
    @op.time_slider.on('input', (event)->
      ids = _.map(scope.op.time_track.find('datasignal'), (dom)->
        id = $(dom).data 'time_signal_id'
        ts = scope.getTimeSignal(id)
        ts.updatePeriod(ts, scope.op.time_slider.val())
      )
    )
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
      ids = _.map(scope.op.add_track.find('datasignal'), (dom)->
        return $(dom).data 'time_signal_id'
      )
      tsm.addTS(ids)
    )
  addTS: (timesignal_ids)->
    console.log "ADDING"
    ts = _.map(timesignal_ids, (id)->
        return tsm.getTimeSignal(id)
      )
    time_sum = _.reduce ts, ((memo, t)->
        return memo + t.period
      ), 0
    data = _.reduce(ts, ((memo, t)->
      memo.push(t.data)
      return memo
      ), [])
    data = _.flatten(data)
    newDom = $('<datasignal id="result"><canvas></canvas></datasignal>')
    newDom.find("canvas")
      .attr("data", JSON.stringify(data))
      .attr("period", time_sum)
      .addClass('draggable')
    dom = tsm.op.add_result.html("").append(newDom)
            
    tsm.activateDragAndDrop()
    op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE),
      signal_fill:
        fillColor: '#d9534f', 
      dom: newDom.find('canvas')
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
    $('.sortable').sortable({
      placeholder: "ui-state-highlight"
    });
    $('canvas.draggable').draggable({
      revert: true
    });
    $('.track.droppable').droppable({
      accept: "canvas.draggable", 
      classes: { "droppable-active": "droppable-default"},
      activate: (event, ui) ->
        if not sm then return
        sm.setAcceptorsActive(true)
      drop: (event, ui) ->
        dom = $('<canvas></canvas>') #.addClass('draggable')
            .attr('data', ui.draggable.attr('data'))
            .attr('period', ui.draggable.attr('period'));
        if $(this).attr('id') == "time-morph-track" then dom.addClass('draggable')
        ts = $('<datasignal></datasignal>').append(dom)
        $(this).append(ts);
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
            if not _.isUndefined ui.draggable.attr('period')
              op.period = ui.draggable.attr('period')
            op = _.extend(_.clone(DEFAULT_SIGNAL_STYLE), op)

            ts = CanvasUtil.query(paper.project, {prefix: ["TIMESIGNAL"], acceptor: acceptor.id})
            CanvasUtil.call(ts, 'remove')
            tsm.add(new TimeSignal(op))
          
          sm.setAcceptorsActive(false)
      
    })
