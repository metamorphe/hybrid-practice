function RampGenerator() {
}

/**
 * Example call:
 * var rgen = RampGenerator.generateRampPath({
 *   rampHeight: Ruler.mm2pts(10),
 *   rampWidth: Ruler.mm2pts(15),
 *   rampOffset: Ruler.mm2pts(10),
 *   alpha: 0.5,
 *   beta: 0.5
 * }, visual=true);
 */
RampGenerator.generateRampPath = function(params, visual=false) {
  var rightmostDomePoint = new Point(0, 0);
  var bottomRightPoint = new Point(
    rightmostDomePoint.x + params.rampOffset,
    rightmostDomePoint.y
  );
  var topLeftPoint = new Point(0,
          rightmostDomePoint.y - params.rampHeight);
  var topRightPoint = new Point(rightmostDomePoint.x + params.rampWidth,
          rightmostDomePoint.y - params.rampHeight);
  var rampPath = new Path({
    segments: [
      topRightPoint,
      bottomRightPoint
    ],
    strokeColor: 'black',
    strokeWidth: 1,
    closed: false,
    position: paper.view.center
  });

  // Add the top left and top right _segments_ as fields for
  // updating laters
  var topRightSegment = rampPath.segments[0];
  var bottomRightSegment = rampPath.segments[1];

  // Add handles for corner segments
  topRightSegment.handleOut = new Point(0, params.rampHeight * params.alpha);
  bottomRightSegment.handleIn = new Point(params.rampOffset * params.beta, 0);

  // Cleanup if necessary
  if (!visual) {
    rampPath.remove();
  }
  return rampPath;
}
