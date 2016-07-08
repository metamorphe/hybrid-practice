function Graph(center_coords, x_range, y_range){


    this.min_x = x_range[0];
    this.max_x = x_range[1];
    this.min_y = y_range[0];
    this.max_y = y_range[1];
    this.mid_x = this.max_x / 2;
    this.mid_y = this.max_y / 2;

    this.selectedItem = null;
    this.selectionTool = new paper.Tool();
    this.selectedHandle = null;
    this.selectedSegment = null;
    this.stops = null;

    this.create_bounding_box(this.init(center_coords), 1, 1, 1, 0); //TODO: fix logic; currently this is the boundingBox of object's bird's eye view


    this.graphCenter = null;
    this.makeRadialGradientProfileGraph(); //updates graphCenter

    this.initializeSectionTool();
    // this.generateGridLines(8);


}

Graph.prototype = {

    //TODO: debug
    generateGridLines: function(num_lines) {

        var midDash = new Path();
        midDash.add(view.center.add(new Point(this.mid_x, this.min_y-Ruler.mm2pts(2)))); //TODO: coords should be based upon a group containing the white background
        midDash.add(view.center.add(new Point(this.mid_x, this.max_y+Ruler.mm2pts(2))));
        midDash.selected = false;

        var group = new paper.Group(midDash);
        group.style = {
            strokeColor: 'blue',
            dashArray: [4, 12],
            strokeWidth: 3,
            strokeCap: 'round'
        };
        var label = new PointText(view.center.add(new Point(this.mid_x, this.min_y-Ruler.mm2pts(5))));
        label.justification = 'center';
        label.fillColor = 'black';
        label.content = 'midpoint';
    },


    initializeSectionTool: function() {
        var scope = this;
        this.selectionTool.onMouseDown = function(event) {
            if (scope.selectedItem) {
                scope.selectedItem.selected = false;
                scope.selectedSegment = null;
            }
            var hitResult = paper.project.hitTest(event.point,
                {handles: true,
                 stroke: true,
                 segments: true,
                 tolerance: 6,
                 fill: true});
            console.log(hitResult);


            if (event.modifiers.shift) {
                if (hitResult.type == 'segment') {
                    hitResult.segment.remove();
                };
                return;
            }

            scope.selectedSegment = null;
            if (hitResult){
                selectedItem = hitResult.item; //path
                selectedItem.selected = true;
                if (hitResult.type == 'segment') {
                    scope.selectedSegment = hitResult.segment;
                    var segIndex = scope.selectedSegment.index;
                    console.log(scope.selectedSegment.index);
                    // scope.
                }
                else if (event.modifiers.shift
                        && hitResult.type == 'stroke') {
                    var hitLoc = hitResult.location;
                    scope.selectedSegment = selectedItem.insert(hitLoc.index + 1, event.point);
                }
            }
          }
          this.selectionTool.onMouseDrag = function(event) {

            //Constrain user to given y-bounds
            var yDisplacement = scope.max_y - scope.min_y;
            var upperBound = scope.graphCenter.y + yDisplacement / 2;
            var lowerBound = scope.graphCenter.y - yDisplacement / 2;
            if (scope.selectedSegment.point.y <= lowerBound) {
                scope.selectedSegment.point.y += 1;
            } else if (scope.selectedSegment.point.y >= upperBound) {
                scope.selectedSegment.point.y -= 1;
            } else {
              scope.selectedSegment.point.y += event.delta.y;
              var segIndex = scope.selectedSegment.index;

              //FIXME: no way we can get the correct stopNumber
              //with arithmetic alone we must preassign
              var stopNumber = -(segIndex % 5) + 4;
              var proportion = (scope.selectedSegment.point.y
                          - lowerBound) / scope.max_y
              scope.stops[stopNumber].color.lightness = -proportion + 1;
            }
          }
    },

    makeRadialGradientProfileGraph: function() {
        // The path is 500 across and 200 tall
        // e.g. white should be y = 0, black is y = 200 (y-axis pointed down)
        // a stop at the center has x = 0 and a stop halfway to the edge has x = 250
        // var pathPoints = [view.center.add(new Point(200, 0)), view.center.add(new Point(700, 200))]
        var scope = this;
        var path = new Path()
        // path.add(view.center.add(new Point(0, 0)));

        // For each stop, we find the x
        var stops = this.stops;
        stops = _.map(stops, function(stop) {
          return {
            x: stop.rampPoint / 2.0,
            y: stop.color.lightness
          };
        });
        // UPDATE THE STOPS
        stopsR = _.map(stops, function(stop){
           return {
             x: (-1 * (stop.x - 0.5)) + 0.5,
             y: stop.y
           }
        });

        // JOIN THE STOPS
        stops = _.flatten([stops, stopsR]);
        stops = _.sortBy(stops, function(stop){
          return stop.x;
        });

        // Draw the stops
        $.each(stops, function(idx, obj) {
            // each obj looks has fields COLOR (with field LIGHTNESS) and RAMP_POINT
            var x = scope.min_x + scope.max_x * (obj.x);
            var y = scope.max_y * obj.y;
            var point = view.center.add(new Point(x, y));
            path.add(point);
            // path.closed = true;
            console.log(obj.x);
        });

        // Add the last point, then bound on the bottom
        // path.add(view.center.add(new Point(scope.min_x + scope.max_x, 0)));
        path.add(view.center.add(new Point(scope.min_x + scope.max_x, scope.max_y)));
        path.add(view.center.add(new Point(scope.min_x, scope.max_y)))
        path.closed = true;
        path.strokeColor = 'white';
        path.fillColor = 'pink';

        //TODO: Pretty Dashes
        var midpointDash = new Path();

        midpointDash.add(view.center.add(new Point(scope.mid_x, scope.min_y-Ruler.mm2pts(2))));
        midpointDash.add(view.center.add(new Point(scope.mid_x, scope.max_y+Ruler.mm2pts(2))));
        midpointDash.selected = false;

        var group = new paper.Group(midpointDash);
        group.style = {
            strokeColor: 'white',
            dashArray: [4, 12],
            strokeWidth: 1,
            strokeCap: 'round'
        };

        var label = new PointText(view.center.add(new Point(this.mid_x, this.min_y-Ruler.mm2pts(5))));
        label.justification = 'center';
        label.fillColor = 'black';
        label.content = '0.5';

        //Create a bounding_box around graph
        this.graphCenter = scope.create_bounding_box(path,1, 1, 1, 0);
    },


    //Create bounding box over a group of objects
    create_bounding_box: function(group, bounds, color_amount, stroke_width, stroke_color){
        var boundingBox = new paper.Path.Rectangle(group.bounds.expand(Ruler.mm2pts(bounds)), 0);
        console.log('boundingBox Center coord', boundingBox.bounds.center);
        boundingBox.style = {
            // fillColor: new Color(color_amount),
            fillColor: 'green',
            strokeWidth: stroke_width,
            strokeColor: stroke_color
        }

        boundingBox.sendToBack()
        return boundingBox.bounds.center
    },


    //Initialize Graph; returns path
    init: function(coords) {
        var path = new Path.Circle({
            center: view.center.add(coords),
            radius: view.bounds.height * 0.1,
            strokeColor: 'red'
        });

        // Fill the path with a radial gradient color with three stops:
        // yellow from 0% to 5%, mix between red from 5% to 20%,
        // mix between red and black from 20% to 100%:
        path.fillColor = {
            gradient: {
                stops: [[ten, 0.1], [thirty, 0.3], [ten, 0.5], [sixtyfive, 0.85], [hundred, 1]],
                radial: true
            },
            origin: path.position,
            destination: path.bounds.rightCenter
        };

        this.stops = path.fillColor.gradient.stops;
        this.create_bounding_box(path, 1, 1, 1, 0);
        paper.settings.handleSize = 10;
        return path;
    }
}

/**
 * Takes a proportion from 0.0 and 1.0 and maps it to the corresponding
 * greyscale hex color.
 */
Graph.proportionToGreyscaleHex = function(proportion) {
  if (proportion < 0.0 || proportion > 1.0) {
    return '000000'
  }
  var value = (Math.round(proportion * 255)).toString(16);
  return value + value + value;
}
