/*Dependencies: <script type="text/javascript" src="js/clipper.js"></script>
* /

/* Takes in a paper path and draws an internal, normal, or exterior strokebased upon stroke_alignment = -1, 0, 1 respectively.
    Join_type options are "Square", "Round", "Miter"
    Example usage: makeStroke(testShape, -1, 2, 'red', 1, "Round");
*/
    function makeStroke(path, stroke_alignment, stroke_width, stroke_color, offset, join_type) {
        var paths = calcClipperSegPoints(path, offset);
        var scale = 1000;
        ClipperLib.JS.ScaleUpPaths(paths, scale);
        var joinTypes = [ClipperLib.JoinType.jtSquare, ClipperLib.JoinType.jtRound, ClipperLib.JoinType.jtMiter];
        var endType = ClipperLib.EndType.etClosedPolygon;
        if (join_type == "Square") joinTypes = joinTypes[0];
        if (join_type == "Round") joinTypes = joinTypes[1];
        if (join_type == "Miter") joinTypes = joinTypes[2];


        var deltas = [stroke_alignment * (stroke_width/2)];
        
        var co = new ClipperLib.ClipperOffset(); // constructor
        var offsetted_paths = new ClipperLib.Paths(); // empty solution

        // for(i = 0; i < joinTypes.length; i++) {
            for(ii = 0; ii < deltas.length; ii++) {
                co.Clear();
                co.AddPaths(paths, joinTypes, endType);
                co.MiterLimit = 2;
                co.ArcTolerance = 0.25;
                co.Execute(offsetted_paths, deltas[ii] * scale);
            }

            for (i = 0; i < paths.length; i++) {
                for (j = 0; j < paths[i].length; j++){
                    var x = paths[i][j].X / scale;
                    var y = paths[i][j].Y / scale;
                    var p = new paper.Point(x, y);
                }
            }  

            var segs = [];
            for (i = 0; i < offsetted_paths.length; i++) {
                for (j = 0; j < offsetted_paths[i].length; j++){
                    var x = offsetted_paths[i][j].X / scale;
                    var y = offsetted_paths[i][j].Y / scale;
                    var p = new paper.Point(x, y);
                    segs.push(p);
                }
            }
            var clipperStrokePath = new paper.Path({
                segments: segs,
                strokeWidth: stroke_width,
                strokeColor: stroke_color,
                closed: true,
                selected: false
            });
    }