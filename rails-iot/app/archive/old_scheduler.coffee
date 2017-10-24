# @p_signal = @perceptual_correction(@signal)
        # @p_signal = @resolution_correction(@p_signal)
        # @p_signal = if @gamma_corrected then @gamma_correction(@p_signal, @gamma) else @p_signal
        # @data = if @perceptual then @p_signal else @signal
gamma_correction: (data, gamma)->
    data = _.map data, (P)->
      return Math.pow(P, 1 / gamma)
  resolution_correction: (data)->
    # console.log JSON.stringify data
    cl = @command_list_data data, {}
    
    cl = _.map cl, (curr, i)->
      if i == 0 then return curr
      prev = cl[i-1] 
      curr.dI = Math.abs(curr.param - prev.param)
      curr.dt = curr.t - prev.t
      return curr

    dI_accum = 0
    last_accepted_param = cl[0].param
    cl = _.map cl, (curr, i)->
      if i == 0 then return curr
      prev = cl[i-1] 
      # SUPERFLUOUS COMMAND
      if curr.param == last_accepted_param
        dI_accum += curr.dI
        return null
      # PERCEPTABLE
      if curr.dI + dI_accum > TimeSignal.RESOLUTION or i == cl.length - 1
        last_accepted_param = curr.param
        dI_accum = 0
        return curr
      # PERCEPTUAL SUPERFLUOUS
      else
        dI_accum += curr.dI
        return null
    cl_u = _.compact(cl)
    # console.log "resolution_correction removed", cl.length - cl_u.length, "out of", cl.length
    signal = TimeSignal.resample(cl_u, @period)
    return signal
  perceptual_correction: (data)->
    # console.log JSON.stringify data
    cl = @command_list_data data, {}
    cl = _.map cl, (curr, i)->
      if i == 0 then return curr
      prev = cl[i-1] 
      curr.dI = Math.abs(curr.param - prev.param)
      curr.dt = curr.t - prev.t
      return curr

    dt_accum = 0
    last_accepted_param = cl[0].param
    cl = _.map cl, (curr, i)->
      if i == 0 then return curr
      prev = cl[i-1] 
      # SUPERFLUOUS COMMAND
      if curr.param == last_accepted_param
        dt_accum += curr.dt 
        return null
      # PERCEPTABLE
      if curr.dt + dt_accum > TimeSignal.PERSISTENCE_OF_VISION or i == cl.length - 1
        last_accepted_param = curr.param
        dt_accum = 0
        return curr
      # PERCEPTUAL SUPERFLUOUS
      else
        dt_accum += curr.dt 
        return null
    cl_u = _.compact(cl)
    # console.log "perceptual_correction removed", cl.length - cl_u.length, "out of", cl.length
    signal = TimeSignal.resample(cl_u, @period)
    return signal