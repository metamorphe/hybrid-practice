

function addTool(){
    // CIRCUIT CLEANING TOOL
    var hitOptions = {
        segments: true,
        stroke: true,
        fill: true,
        tolerance: 10
    }

    var t = new paper.Tool();
    t.selected = [];

    function addAnchorPoint(pathReceiver, point) {
        var closestPoint = pathReceiver.getNearestPoint(point);
        var location = pathReceiver.getLocationOf(closestPoint);
        var index = location.curve.segment2.index;
        console.log(index);
        return pathReceiver.insert(index, closestPoint);
    }

    t.onMouseDown = function(event) {

        var hitResult = project.hitTest(event.point, hitOptions);


        if (!hitResult) {
            console.log("No hits");
            return;
        } else {

            if (hitResult.type == "stroke") {
                console.log("Adding anchor");
                var anchor = addAnchorPoint(hitResult.item, event.point);
                var anchorBG = addAnchorPoint(bgPath, event.point);

                t.selected.push(anchor);
                t.selected.push(anchorBG);

            } else if (hitResult.type == 'segment') {
                console.log("hit segment")
                anchor = hitResult.segment;
                var anchorBG = addAnchorPoint(bgPath, event.point);
                t.selected.push(anchor);
                t.selected.push(anchorBG);
            }
        }
    };

    t.onMouseDrag = function(event) {
        _.each(t.selected, function(anchor) {
            anchor.selected = true;
            anchor.point = anchor.point.add(event.delta);
        });
    };

    t.onMouseUp = function(event) {
        _.each(t.selected, function(anchor) {
            anchor.selected = false;
        });
        t.selected = [];
    }
}
