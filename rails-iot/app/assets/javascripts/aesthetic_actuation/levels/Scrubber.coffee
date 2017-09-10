class window.Scrubber
    constructor: (op)->
        _.extend this, op
        @scrub_ids = []
        @dom.draggable
            containment: "parent"
            axis: "x"
            grid: [ 5, 200 ]
            scroll: false
    getPosition: (t)-> #convert to pixel location
        tt = @dom.parent()
        timescale = @behavior.data.timescale
        w = tt.width()
        p = t/timescale * w
        return p
    toTime: (x)->
        tt = @dom.parent()
        timescale = @behavior.data.timescale
        w = tt.width()
        t = timescale * x / w
        return t
    getTime: ()->
        tt = @dom.parent()
        timescale = @behavior.data.timescale
        w = tt.width()
        t = timescale * @dom.position().left / w
        return t
    setTime: (t)->
        x = @getPosition(t)
        @setPosition(x)
    reset: ()->
        @setPosition(0)
    play: (start, end)-> # milliseconds
        scope = this
        duration = parseInt (end - start)
        startPos = Math.round @getPosition(start)
        endPos = Math.round @getPosition(end)
        @setPosition startPos
        scrubPlay = ()->
            scope.dom.css
                transition: 'left '+ duration+'ms linear'
                left: Math.round endPos
        _.delay scrubPlay, 10
    setPosition: (x)->
        @dom.css
            transition : 'left 0s linear'
            left: x
    pause: ()->
        @dom.css
            transition : 'left 0s linear'
            left: @dom.position().left
    