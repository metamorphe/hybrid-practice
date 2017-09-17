class window.Artwork
    @ACTUATORS: ()-> 
        CanvasUtil.query paper.project, 
            saveable: true
            prefix: ["NLED", "HEATER", "PUMP", "STEPPER", "SERVO", "MOTOR"]
    @ACTUATORS_IN: (device)-> CanvasUtil.query device, {prefix: ["NLED", "HEATER", "PUMP", "STEPPER", "SERVO", "MOTOR"]}
    @getElements = ()->
        decor: CanvasUtil.queryPrefix('DECOR'),
        art: CanvasUtil.queryPrefix('ART'),
        diff: CanvasUtil.queryPrefix('DIF'),
        leds: CanvasUtil.queryPrefix('NLED'),
        bo: CanvasUtil.queryPrefix('BO'),
        bi: CanvasUtil.queryPrefix('BI'),
        cp: CanvasUtil.queryPrefix('CP'),
        dds: CanvasUtil.queryPrefix('DDS'),
        mc: CanvasUtil.queryPrefix("MC"),
        base: CanvasUtil.queryPrefix("BASE"),
        wires: CanvasUtil.queryPrefix("WIRE"), 
        rays: CanvasUtil.queryPrefix("RAY"), 
        nuts: CanvasUtil.queryPrefix("NUT"), 
        gray: CanvasUtil.queryPrefix("DDS") 
        devices: CanvasUtil.queryPrefix("DEVICE") 
    constructor: (@file, @loadFN, @cloned) ->
        @svg = null
        if _.isUndefined @cloned then @import @loadFN else @clone()
    import: (loadFN) ->
        console.info 'ARTWORK: SVG IMPORT'
        scope = this
        paper.project.importSVG @file, (item) ->
            scope.svg = item
            scope.svg.position = paper.view.center

            scope.svg.fitBounds(paper.view.bounds)
            scope.svg.position = paper.view.center
            scope.process()
            loadFN scope.svg
            if vm then vm.update()
            return
        return
    clone: ->
        cl = new Artwork(@svgPath, @loadFN, true)
        cl.svg = @svg.clone()
        cl
    process: ->
        # @loadLEDs()
        @AE_style_process()
        @orderActuators()
    loadLEDs: ()->
        if fs
            name = fs.getName()
        else
            name = "NONAME"
        key = [
          'led'
          name
        ].join('_')
        if ws.includes(key)
          led_data = JSON.parse(ws.get(key))
          console.log 'FETCHING', led_data
          _.map led_data, (data) ->
            console.log data
            led = new (paper.Path.Rectangle)(
              name: 'NLED: APA102C'
              size: new (paper.Size)(Ruler.mm2pts(LED_WIDTH), Ruler.mm2pts(LED_WIDTH))
              strokeColor: 'black'
              strokeWidth: 1
              opacity: 1.0
              parent: CanvasUtil.queryPrefix('DEVICE')[0]
              position: paper.view.center)
            led.fillColor = new (paper.Color)(data.colorID)
            led.colorID = new (paper.Color)(data.colorID)
            led.position = new (paper.Point)(data.position)
            led.target = data.target
            if data.forceTarget
              led.forceTarget = data.forceTarget
        paper.view.update()
    AE_style_process: ->
        e = Artwork.getElements()
        show = [e.art, e.diff, e.leds, e.dds, e.base]
        hide = [e.rays, e.cp, e.mc, e.bo, e.bi, e.nuts, e.wires, e.decor]

        _.each e.leds, (led)->
            style =  
                fillColor: if led.colorID then led.colorID else "#FFFFFF", 
                strokeColor: "black",
                strokeWidth: 1, 
                opacity: 1.0
            led.set(style)

        diff_style = 
            fillColor: "#DFDFDF", 
            strokeWidth: 3,
            strokeColor: "black", 
            opacity: 1.0
        dds_style =
            fillColor: "#DFDFDF", 
            strokeWidth: 1,
            strokeColor: "black", 
            dashArray: [2, 1],
            opacity: 0.5

        CanvasUtil.call e.diff, 'set',  diff_style
        CanvasUtil.call e.dds, 'set',  dds_style
        CanvasUtil.set _.flatten(show), "visible", true
        CanvasUtil.set _.flatten(hide), "visible", false

    orderActuators: ->
        devices = CanvasUtil.queryPrefix('DEVICE')
        console.info '✓ Manifest'
        console.info '✓ Devices:', devices.length
        if devices.length == 0 then console.warn "NO DEVICES!"
        _.each devices, (device, i)->
            device_id = CanvasUtil.getName(device)
            device_id = eval(device_id)
            actuators = Artwork.ACTUATORS_IN(device)
            # leds = CanvasUtil.query(device, {prefix: ['NLED']})
            cp = CanvasUtil.query(device, {prefix: ['CP']})
            bi = CanvasUtil.query(device, {prefix: ['BI']})
            # CHECKS
            if _.isEmpty actuators
                console.warn("NO ACTUATORS DETECTED")
                return
            # else
                # console.log("ACTUATORS DISCOVERED", _.map actuators, (act, i)-> act.name.split(':')[0] + " " + i )
            if _.isEmpty cp
                console.warn("NO PATH; CAN'T ENUMERATE LEDS")
                return 
            if _.isEmpty bi
                console.warn("NO BREAKIN; CAN'T ENUMERATE LEDS")
                return

            cp = cp[0]
            bi = bi[0]
            forward = cp.firstSegment.point.getDistance(bi.firstSegment.point)
            backward = cp.lastSegment.point.getDistance(bi.firstSegment.point)
            polarity = if backward < forward then -1 else 1
            _.each actuators, (actuator) ->
                cpPoint = cp.getNearestPoint(actuator.position)
                actuator.offset = polarity * cp.getOffsetOf(cpPoint)
                return
            actuators = _.sortBy actuators, 'offset'
            _.each actuators, (actuator, id) ->
                actuator.lid = device_id+":"+id
                actuator.device = device_id

    
