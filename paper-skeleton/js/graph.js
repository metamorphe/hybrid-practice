function Graph(center_coords, x_range, y_range){
    /*To Debug
    []fix rendering of moving corrresponding segment
    []make sure the first/last segment Objects are not clickable along x-axis
    []don't allow the border to be selected
    []implement an undo if Cesar says neccessary
    */

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
    this.profilePath = null;

    //boundingBox of object's bird's eye view
    this.create_bounding_box(this.init(center_coords), 1, 1, 1, 0);


    this.graphCenter = null;
    this.makeRadialGradientProfileGraph(); //updates graphCenter

    this.initializeSectionTool();
    this.generateGridLines(3);


}

Graph.prototype = {

    generateGridLines: function(numPartitions) {
        
        //Force an even number of partitions
        if (numPartitions % 2) { numPartitions = numPartitions+1; }

        var group = new paper.Group();
        // $.each(numPartitions, function(i) {
        for (i = 0; i < numPartitions; i++) {
            //Skip last iteration
            if (i != numPartitions - 1) {

                var frac = (i + 1) / numPartitions;
                var x_pos = this.min_x + ((this.max_x - this.min_x) * frac);

                var dash = new Path();
                dash.add(view.center.add(new Point(x_pos , this.min_y-Ruler.mm2pts(2))));
                dash.add(view.center.add(new Point(x_pos , this.max_y+Ruler.mm2pts(2))));
                dash.selected = false;
                dash.selectable = false;

                var label = new PointText(view.center.add(new Point(x_pos, this.min_y-Ruler.mm2pts(5))));
                label.justification = 'center';
                label.fillColor = 'black';
                label.clickable = false;
                label.content = (i+1) / numPartitions;
                console.log(i+1, numPartitions);
                group.addChild(dash, label);
            }
        };
        group.style = {
            strokeColor: 'black',
            dashArray: [4, 12],
            strokeWidth: 2,
            strokeCap: 'round'
        };
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

            /*Remove segment if shift-clicked*/
            if (event.modifiers.shift) {
                if (hitResult.type == 'segment') {
                    hitResult.segment.remove();
                };
                return;
            }

            /*Clicking a segment or fill space*/
            scope.selectedSegment = null;
            if (hitResult && (hitResult.type == 'fill'
                  || hitResult.type == 'segment')){
                selectedItem = hitResult.item; //path
                selectedItem.selected = true;
                if (hitResult.type == 'segment') {
                    scope.selectedSegment = hitResult.segment;
                    var segIndex = scope.selectedSegment.index;
                }
                else if (event.modifiers.shift
                        && hitResult.type == 'stroke') {
                    var hitLoc = hitResult.location;
                    scope.selectedSegment = selectedItem.insert(hitLoc.index + 1, event.point);
                }
            }
          }
          this.selectionTool.onMouseDrag = function(event) {

            /*Constrain user to y-bounds
            Note: y grows larger towards upperBound*/
            var yDisplacement = scope.max_y - scope.min_y;
            var upperBound = scope.graphCenter.y + yDisplacement / 2;
            var lowerBound = scope.graphCenter.y - yDisplacement / 2;

            if (scope.selectedSegment){
                if (scope.selectedSegment.point.y <= lowerBound) {
                    scope.selectedSegment.point.y += 3;
                } else if (scope.selectedSegment.point.y >= upperBound) {
                    scope.selectedSegment.point.y -= 3;
                } else {
                  scope.selectedSegment.point.y += event.delta.y;
            }

              /*Update corresponding stop's color*/
              var proportion = (scope.selectedSegment.point.y
                          - lowerBound) / scope.max_y
              var stopNumber = scope.selectedSegment.stopNumber;
              scope.stops[stopNumber].color.lightness = -proportion + 1;
            }
          }
    },

    makeRadialGradientProfileGraph: function() {
        // The path is 500 across and 200 tall
        // white should be y = 0, black is y = 200 (y-axis pointed down)
        // a stop at the center has x = 0 and a stop halfway to the edge has x = 250
        // var pathPoints = [view.center.add(new Point(200, 0)), view.center.add(new Point(700, 200))]
        var scope = this;
        var path = new Path()
        // path.add(view.center.add(new Point(0, 0)));

        // For each stop, we find the x
        var stops = scope.stops;
        stops = _.map(stops, function(stop, idx) {
          var obj = {
            x: stop.rampPoint / 2.0,
            y: stop.color.lightness,
            stopNumber: stops.length - 1 - idx
          };
          obj.linked = obj;
          return obj;
        });
        // UPDATE THE STOPS
        stopsR = _.map(stops, function(stop, idx){
           var obj = {
             x: (-1 * (stop.x - 0.5)) + 0.5,
             y: stop.y,
             stopNumber: stops.length - 1 - idx,
           };
           obj.linked = obj.linked;
           return obj;
        });

        // JOIN THE STOPS
        stops = _.flatten([stops, stopsR]);
        stops = _.sortBy(stops, function(stop){
          return stop.x;
        });

        // //Debugging stops/links
        // $.each(stops, function() {
        //     console.log(stops);
        // });

        path.add(view.center.add(new Point(scope.min_x, scope.max_y)))

        // Draw the stops
        $.each(stops, function(idx, obj) {
            // each obj looks has fields COLOR (with field LIGHTNESS) and RAMP_POINT
            var x = scope.min_x + scope.max_x * (obj.x);
            var y = scope.max_y * obj.y;
            var point = view.center.add(new Point(x, y));
            path.add(point);
            var lastSegment = path.segments[path.segments.length - 1];
            lastSegment.linked = obj.linked;

            console.log(lastSegment.linked);

            lastSegment.stopNumber = obj.stopNumber;
            // obj.mySegment = lastSegment;
            
            // lastSegment.stopNumber = _.isUndefined(scope.stopMapping[idx])
            //       ? null : scope.stopMapping[idx];
            // path.closed = true;
            console.log(obj);
        });

        // Add the last point, then bound on the bottom
        // path.add(view.center.add(new Point(scope.min_x + scope.max_x, 0)));
        path.add(view.center.add(new Point(scope.min_x + scope.max_x, scope.max_y)));
        path.closed = true;
        path.strokeColor = 'black';
        path.fillColor = '#ecf0f1';


        //Create a bounding_box around graph
        scope.graphCenter = scope.create_bounding_box(path,1, 1, 1, 0);
        scope.profilePath = path;
    },


    //Create bounding box over a group of objects
    create_bounding_box: function(group, bounds, color_amount, stroke_width, stroke_color){
        var boundingBox = new paper.Path.Rectangle(group.bounds.expand(Ruler.mm2pts(bounds)), 0);
        console.log('boundingBox Center coord', boundingBox.bounds.center);
        boundingBox.style = {
            // fillColor: new Color(color_amount),
            fillColor: '#95a5c6',
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
