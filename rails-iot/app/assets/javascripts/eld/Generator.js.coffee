window.NEARNESS_CRITERIA = 0.5
window.PROFILE_SAMPLING = 0.01
window.generatorEnergy = 20


class window.Generator
  @normNeighbor = (a) ->
    travelling_range = NEARNESS_CRITERIA
    travel = travelling_range * Math.random()
    split = travelling_range / 2
    upper_overflow = a + split
    lower_overflow = a - split
    if lower_overflow <= 0
      min = 0
      max = upper_overflow - lower_overflow
    else if upper_overflow >= 1
      max = 1
      min = lower_overflow - (upper_overflow - 1)
    else
      min = lower_overflow
      max = upper_overflow
    min + travel

  constructor: ->
    @length = 72
    @diffuser = 'Planar'
    @model = 'Reflector'
    @export = 'REFL'
    @c_norm = 0.5
    @c_uni = 0.5
    @c_energy = 0.50
    @cost = 0.5
    @random = true
    @initial_temperature = 10.0
    # this.initial_stabilizer = 1.0;
    @initial_stabilizer = 5.0
    @stabilizing_factor = 0.8
    # this.cooling_factor = 0.05;
    @cooling_factor = 0.25
    @freezing_temperature = 0.0
    @system_temperature = @initial_temperature
    @system_energy = 1.0
    @init()
    # this.fabricate();
    @sample_size = 300
    @params = null
    return
  init: ->
    @box = new (paper.Path.Rectangle)(paper.view.bounds)
    @box.set
      name: 'NP: not useful'
      position: paper.view.center
      fillColor: '#111'
    paper.view.update()
    return
  clear: (prefixes) ->
    _.each prefixes, (prefix) ->
      _.each CanvasUtil.queryPrefix(prefix), (rt) ->
        rt.remove()
        return
      return
    return
  generateNeighbor: ->
    if _.isNull(@params)
      return
    @clear ['RT','RAY','PL','LS','DRAY'
    ]
    model = eval(@model)
    @params = model.neighbor(JSON.parse(@generatorSolution))
    paper.view.zoom = 2
    scene = model.makeScene(@box, @params, @diffuser)
    paper.view.update()
    @params
  generateRandom: ->
    @clear [
      'RT'
      'RAY'
      'PL'
      'LS'
      'DRAY'
    ]
    model = eval(@model)
    if @random or @model == 'noLens'
      @params = model.random(@length)
    else
      @params = @getOptimal()
      # console.log("STORED COST", params.costs.cost);
    paper.view.zoom = 2
    scene = model.makeScene(@box, @params, @diffuser)
    # this.fire();
    paper.view.update()
    @params
  generate: ->
    @clear [
      'RT'
      'RAY'
      'PL'
      'LS'
      'DRAY'
    ]
    model = eval(@model)
    paper.view.zoom = 2
    scene = model.makeScene(@box, @params, @diffuser)
    # this.fire();
    paper.view.update()
    @params
  generateOptimal: ->
    @clear [
      'RT'
      'RAY'
      'PL'
      'LS'
      'DRAY'
    ]
    model = eval(@model)
    if @random or @model == 'noLens'
      @params = model.random(@length)
    else
      @params = @getOptimal()
      # console.log("STORED COST", params.costs.cost);
    paper.view.zoom = 2
    scene = model.makeScene(@box, @params, @diffuser)
    # this.fire();
    paper.view.update()
    @params
  resample: ->
    scope = this
    samples = _.range(0, @sample_size, 1)
    samples = _.map(samples, (s, i) ->
      params = scope.generateOptimal(random = true)
      costs = scope.fire()
      {
        costs: costs
        params: JSON.stringify(params)
      }
    )
    min = _.min(samples, (s) ->
      s.costs.cost
    )
    max = _.max(samples, (s) ->
      s.costs.cost
    )
    # console.log("RESULTS:", min, max);
    max_p = JSON.parse(max.params)
    max_p.costs = max.costs
    # max.params = JSON.stringify(max_p);
    @storeSolution max_p
    # LOAD UP THE BEST ONE
    @generateOptimal false
    max.costs.cost
  storeSolution: (solution) ->
    key = @generateKey(@length)
    if ws.includes(key)
      params = JSON.parse(ws.get(key))
      if !_.isUndefined(params.costs) and params.costs.cost > solution.costs.cost
        console.log 'PREVIOUSLY STORED WINS', @length, params.costs.cost.toFixed(2), 'v', solution.costs.cost.toFixed(2)
        return params.costs.cost
    console.log 'REWRITING', @length, solution
    ws.set key, JSON.stringify(solution)
    return
  anneal: ->
    scope = this

    if @model == 'noLens'
      scope.params = @generateOptimal()
      scope.params.costs = scope.fire()
      console.log 'COST', scope.params.costs
      return scope.storeSolution(scope.params)
    model = eval(@model)

    @generatorSolution = JSON.stringify(@generateRandom())
    SCALE = 1
    options = 
      initialTemperature: @initial_temperature
      initialStabilizer: @initial_stabilizer
      coolingFactor: @cooling_factor
      stabilizingFactor: @stabilizing_factor
      freezingTemperature: @freezing_temperature

    options.generateNewSolution = ->
      params = scope.generateRandom()
      (1 - (scope.fire().cost)) * SCALE

    options.generateNeighbor = ->
      params = scope.generateNeighbor()
      (1 - (scope.fire().cost)) * SCALE

    options.acceptNeighbor = ->
      @generatorSolution = JSON.stringify(scope.params)
      generatorEnergy = scope.fire().cost
      return


    steps = 0
    update_system = ()->
      console.log 'System – T:', SimulatedAnnealing.GetCurrentTemperature().toFixed(2), 'E:', (1 - SimulatedAnnealing.GetCurrentEnergy()).toFixed(2)
      scope.system_energy = SimulatedAnnealing.GetCurrentEnergy()
      scope.system_temperature = SimulatedAnnealing.GetCurrentTemperature()
      paper.view.update()
      return 
    step = ()->
      done = SimulatedAnnealing.Step()
      steps++
      return done
    commit = ()->
      scope.params = JSON.parse(@generatorSolution)
      scope.generate()
      scope.params.costs = scope.fire()
      update_system()
      console.log 'END ENERGY', scope.params.costs.cost, 'STEPS', steps
      scope.storeSolution scope.params

    SimulatedAnnealing.Initialize options
    
    _anneal = ()->
      update_system()
      done = step()
      if done then commit()
      else _anneal()
      
    _anneal()



   
  batch_anneal: ->
    d = new Date
    t_start = d.getTime()
    scope = this
    # lengths = _.range(3, 20, 1)
    lengths = _.range(5, 200, 5)
    # lengths = this.get_eval_lengths();
    # lengths = _.range(5, 10, 1);
    console.log 'STARTING BATCH ANNEAL PROCESS'
    _.each lengths, (l, i) ->
      scope.length = l
      console.log 'PROCESSING', l, '(', i + 1, 'out of', lengths.length, ')'
      scope.anneal()
      return
    d = new Date
    t_end = d.getTime()
    console.log 'END BATCH PROCESS'
    console.log 'TIME:', ((t_end - t_start) / 1000).toFixed(2), 'seconds'
    return
  fire: ->
    @clear ['RAY','PL','DRAY']

    mediums = CanvasUtil.getMediums()
    light_source = CanvasUtil.queryPrefix('LS')
    light_source = _.chain(light_source)
      .map (ls) ->
        new PointLight
          position: ls.position
          mediums: mediums
      .each (ls) ->
        ls.emmision -60, 0, 0.5
        return
    
    @c_uni = ImagePlane.calculateUniformity()
    @c_norm = ImagePlane.calculateNormality()
    @c_energy = ImagePlane.calculateEnergy()
    paper.view.update()
    @cost = @c_uni * 0.7 + @c_norm * 0.1 + 0.2 * @c_energy
    results = 
      uni: @c_uni
      norm: @c_norm
      energy: @c_energy
      cost: @cost
    return results
  batch_clear: ->
    scope = this
    _.each ws.keys(), (key) ->
      k = scope.decodeKey(key)
      if !_.isNull(k)
        ws.remove key
      return
    return
  get_eval_lengths: ->
    # EVAL GEOM
    if @diffuser == 'Planar'
      lengths = [
        '24'
        '26'
        '27'
        '30'
        '31'
        '32'
        '33'
        '34'
        '37'
        '38'
        '39'
        '40'
        '46'
        '47'
        '54'
        '55'
        '63'
        '71'
        '72'
        '81'
        '90'
        '91'
        '99'
        '100'
        '109'
        '110'
        '119'
        '120'
        '128'
        '129'
        '138'
        '139'
        '145'
        '146'
        '148'
      ]
    if @diffuser == 'Cuboid'
      lengths = [
        '85'
        '86'
        '88'
        '91'
        '92'
        '96'
        '101'
        '106'
        '107'
        '113'
        '119'
        '120'
      ]
    if @diffuser == 'Hemisphere'
      lengths = [
        '84'
        '85'
      ]
    lengths = _.chain(lengths).flatten().unique().map((l) ->
      parseInt l
    ).value()
    lengths
  batch_process: ->
    d = new Date
    t_start = d.getTime()
    scope = this
    lengths = _.range(15, 30, 5)
    lengths = @get_eval_lengths()
    console.log 'STARTING BATCH PROCESS'
    _.each lengths, (l, i) ->
      scope.length = l
      console.log 'PROCESSING', l, '(', i + 1, 'out of', lengths.length, ')'
      scope.resample()
      return
    d = new Date
    t_end = d.getTime()
    console.log 'END BATCH PROCESS'
    console.log 'TIME:', ((t_end - t_start) / 1000).toFixed(2), 'seconds'
    return
  getGradient: ->
    params = @generateOptimal()
    # console.log(this.model);
    model = eval(@model)
    # console.log(params)
    result = reflector: model.getGradient('REFL', params)
    if @model == 'TIR'
      _.extend result,
        dome: model.getGradient('DOME', params)
        domeWidth: params.dome.width
    if @model == 'Splitter'
      _.extend result,
        mold: model.getGradient('MOLD', params)
        cone: model.getGradient('CONE', params)
        prism: params.prism
    result
  fabricate: ->
    params = @generateOptimal()
    model = eval(@model)
    model.fabricate params, @length
    paper.view.update()
    return
  download_data: ->
    scope = this
    entries = window.ws.keys()
    entries = _.chain(entries).map (k) ->
      info = scope.decodeKey(k)
      if _.isNull(info) then return null
      data = JSON.parse(ws.get(k))
      for key of data.costs
        info[key] = data.costs[key]
      if info.model == 'noLens'
        info
      else
        info['rampAA'] = data.ramp.a.alpha
        info['rampAB'] = data.ramp.a.beta
        info['rampBA'] = data.ramp.b.alpha
        info['rampBB'] = data.ramp.b.beta
        info
    .compact().filter (entry) ->
      entry.diffuser == 'Planar'
    .map (entry) ->
      _.values(entry).join ','
    .value()
    .join('\n')
    saveAs new Blob([ 'Model,Diffuser,Length,Coverage,Directionality,Cost,Efficiency,RampAA, RampAB, RampBA, RampBB\n' + entries ], type: 'text/csv'), 'simulation_results' + '.csv'
    console.log entries
    return
  download: ->
    paper.view.zoom = 1
    result = CanvasUtil.queryPrefix(@export)
    if result.length == 0
      return
    result = result[0]
    result.bringToFront()
    result.fitBounds paper.view.bounds.expand(-100)
    result.position = paper.project.view.projectToView(new (paper.Point)(result.strokeBounds.width / 2.0, result.strokeBounds.height / 2.0))
    cut = paper.project.view.projectToView(new (paper.Point)(result.strokeBounds.width, result.strokeBounds.height))
    # result.position.x -= 6;
    paper.view.update()
    bufferCanvas = copyCanvasRegionToBuffer($('#main-canvas')[0], 0, 0, cut.x, cut.y)
    download = document.createElement('a')
    download.href = bufferCanvas.toDataURL('image/png')
    download.download = @export + '.png'
    download.click()
    return
  generateKey: ->
    [
      @model
      @diffuser
      @length
    ].join '_'
  decodeKey: (k) ->
    if k.split('_').length <= 1
      null
    else
      d = k.split('_')
      if _.isNaN(parseFloat(d[2]))
        return null
      {
        model: d[0]
        diffuser: d[1]
        length: parseFloat(d[2])
      }
  getSamples: ->
    scope = this
    _.chain(ws.keys()).map((k) ->
      scope.decodeKey k
    ).filter((k) ->
      if _.isNull(k)
        return null
      scope.model == k.model and scope.diffuser == k.diffuser
    ).compact().value()
  getOptimal: ->
    scope = this
    model = eval(@model)
    key = @generateKey()
    if ws.includes(key)
      JSON.parse ws.get(key)
    else
      keys = _.chain(scope.getSamples()).pluck('length').sortBy().value()
      if keys.length == 0
        console.log 'SAMPLING ERROR', @length, @model, @diffuser, 'HAS NO DATA'
        return model.random(@length)
      keys_above = _.filter keys, (k) ->
        k > scope.length
      keys_below = _.filter keys, (k) ->
        k < scope.length
      if keys_below.length == 0 or keys_above.length == 0
        console.log 'SAMPLING ERROR', @length, 'ABOVE', keys_above, 'BELOW', keys_below
        return model.random(@length)
      a = keys_below[keys_below.length - 1]
      # last element of keys below
      b = keys_above[0]
      tau = (b - (scope.length)) / (b - a)
      console.log 'KEYS', scope.length, a, b, tau
      # console.log("KEYS", a, b, tau);
      a = JSON.parse(ws.get([
        @model
        @diffuser
        a
      ].join('_')))
      b = JSON.parse(ws.get([
        @model
        @diffuser
        b
      ].join('_')))
      model.interpolateParams a, b, tau


  @profileToGradient = (params, profile, invert = false, offset) ->
    profile.scaling = new (paper.Size)(1 / profile.bounds.width, 1 / profile.bounds.height)
    origin = profile.bounds.bottomRight.clone()
    x_max = profile.bounds.bottomLeft.clone()
    y_max = profile.bounds.topRight.clone()
    x_axis = x_max.subtract(origin)
    y_axis = y_max.subtract(origin)
   
    # POINTS TO SAMPLE
    segment_positions = _.map profile.segments, (seg) ->
      profile.getOffsetOf seg.point
    
    supersampled_positions = _.range 0, profile.length, PROFILE_SAMPLING
    samples = _.flatten([
      supersampled_positions
      segment_positions
    ])
    total_ref_height = params.lens.height + Ruler.mm2pts(0.01)
    stops = _.chain(samples)
      .map (sample) ->
        pt = profile.getPointAt(sample)
        vec = pt.subtract(origin)
        x = vec.dot(x_axis)
        y = vec.dot(y_axis)

        if y < 0.02 then y = Ruler.mm2pts(0.10) / total_ref_height
       
        # stop holes 
        if x == 1 then y = 1.0
        
        # make sure it ends on white
        if invert then y = 1.0 - y
        if offset then y = if y + offset < 1 then y + offset else 1.0
        
        [
          new (paper.Color)(y)
          x
        ]
      .sortBy (g) ->
        g[1]
      .unique (g) ->
        g[1]
      .value()

    profile.remove()
    stops
