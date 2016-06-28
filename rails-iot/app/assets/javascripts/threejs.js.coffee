# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/
//= require three
//= require Detector
//= require Stats
//= require controls/OrbitControls
//= require TubeGeometry
//= require KeyboardState
//= require THREEx.FullScreen
//= require THREEx.WindowResize
//= require ShaderLib
//= require UniformUtils
//= require metamorphehalf/webenv
//= require dat.gui.min
//= require metamorphehalf/webcache
//= require metamorphehalf/write_binary_stl
//= require metamorphehalf/file_saver.min
//= require metamorphehalf/image_preview.js
//= require metamorphehalf/Filters
//= require csg
//= require ThreeCSG

//= require ui_alert


@clone_vec_array = (arr) ->
  clone = []
  for i of arr
  	clone.push arr[i].clone()
  clone

@calcBilinearInterpolant = (x1, x, x2, y1, y, y2, Q11, Q21, Q12, Q22) ->

  ###*
  # (x1, y1) - coordinates of corner 1 - [Q11]
  # (x2, y1) - coordinates of corner 2 - [Q21]
  # (x1, y2) - coordinates of corner 3 - [Q12]
  # (x2, y2) - coordinates of corner 4 - [Q22]
  # 
  # (x, y)   - coordinates of interpolation
  # 
  # Q11      - corner 1
  # Q21      - corner 2
  # Q12      - corner 3
  # Q22      - corner 4
  ###
  ans1 = (x2 - x) * (y2 - y) / (x2 - x1) * (y2 - y1) * Q11
  ans2 = (x - x1) * (y2 - y) / (x2 - x1) * (y2 - y1) * Q21
  ans3 = (x2 - x) * (y - y1) / (x2 - x1) * (y2 - y1) * Q12
  ans4 = (x - x1) * (y - y1) / (x2 - x1) * (y2 - y1) * Q22
  ans1 + ans2 + ans3 + ans4
