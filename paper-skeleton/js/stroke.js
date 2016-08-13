/*Dependency: js/clipper.js*/


/* Takes in a paper path and draws an internal, normal, or exterior strokebased upon stroke_alignment = -1, 0, 1 respectively.
Join_type options are "Square", "Round", "Miter"
Example usage: expand(testShape, -1, 2, 'red', 1, "Round"); */

// Paper
// // function expand(path, options)
// expand(path, {
//     strokeAlignment: , 
//     strokeWidth:, 
//     strokeColor: , 
//     joinType: , 
       // offset: 
// })

           
function expand(path, o) {
    // SETUP
    var endType = ClipperLib.EndType.etClosedPolygon;
    var joinType = paper.Path.Join[o.joinType];
    var deltas = [o.strokeAlignment * (o.strokeOffset/2)];
    var paths = toClipperPoints(path, 1);
    ClipperLib.JS.ScaleUpPaths(paths, scale=1000);

    // CLIPPER ENGINE
    var co = new ClipperLib.ClipperOffset(); // constructor
    var offsetted_paths = new ClipperLib.Paths(); // empty solution

    _.each(deltas, function(d){
        co.Clear();
        co.AddPaths(paths, joinType, endType);
        co.MiterLimit = 2;
        co.ArcTolerance = 0.25;
        co.Execute(offsetted_paths, d * scale);
    });
       
    var segs = [];
    for (i = 0; i < offsetted_paths.length; i++) {
        for (j = 0; j < offsetted_paths[i].length; j++){
            var p = new paper.Point(offsetted_paths[i][j].X, offsetted_paths[i][j].Y );
            p = p.divide(scale);
            segs.push(p);
        }
    }
    var clipperStrokePath = new paper.Path({
        segments: segs,
        closed: true,
    });
    clipperStrokePath.set(o);

    return clipperStrokePath;
}

/* Map path's perimeter points into jsclipper format
[[{X:30,Y:30},{X:130,Y:30},{X:130,Y:130},{X:30,Y:130}]]*/

function toClipperPoints(path, offset=1) {
    var points = _.range(0, path.length, offset);
    points = _.map(points, function(i) {
        var p = path.getPointAt(i);
        return {X: p.x, Y: p.y};
    });
    return [points]; // compound paths
}
