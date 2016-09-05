function CircuitRouting(){}

CircuitRouting.generateNodes = function(nodes, callbackFN) {
            var c = new Artwork("/components/APA102C_opt.svg", function(footprint) {
                square = footprint.queryPrefix("SMD");
                square[0].remove();
                nodes = _.map(nodes, function(element) {
                    Artwork.getPrefix(element);
                    is_breakout = ["BO", "BI"].indexOf(Artwork.getPrefix(element)) != -1;

                    if (is_breakout) {
                        rectangle = new Path.Rectangle({
                            rectangle: element.bounds,
                            strokeColor: "black",
                            background: "white"
                        });
                    } else {
                        var fp = footprint.clone();
                        fp.svg.position = element.position;
                        rectangle = fp.svg;
                    }

                    // Establish two circles to help with routing.
                    var offset = new paper.Point(POINT_OFFSET, 0);
                    var entryPoint = new Path.Circle({
                        position: rectangle.bounds.leftCenter.clone().subtract(offset),
                        radius: 3,
                        fillColor: "blue"
                    });
                    var exitPoint = new Path.Circle({
                        position: rectangle.bounds.rightCenter.clone().add(offset),
                        radius: 3,
                        fillColor: "blue"
                    });
                    var in_offset = new paper.Point(POINT_INNER_OFFSET, 0);
                    var contactEntryPoint = new Path.Circle({
                        position: rectangle.bounds.leftCenter.clone().add(in_offset),
                        radius: 2,
                        fillColor: "green"
                    });
                    var contactExitPoint = new Path.Circle({
                        position: rectangle.bounds.rightCenter.clone().subtract(in_offset),
                        radius: 2,
                        fillColor: "green"
                    });

                    var group = new Group([rectangle, entryPoint, exitPoint, contactEntryPoint, contactExitPoint]);

                    // group.text = pointText;
                    group.lid = element.lid;
                    group.rectangle = rectangle;
                    group.inputPoint = entryPoint;
                    group.outputPoint = exitPoint;
                    group.contactInput = contactEntryPoint;
                    group.contactOutput = contactExitPoint;
                    return group;
                });

                callbackFN(nodes);
                footprint.remove();
            });
        }

        // Function to obtain cost (Path length) from node with two neighbors.
        CircuitRouting.cost = function(node, paths) {
            is_breakout = _.isNull(node.left) || _.isNull(node.right);
            // console.log(node.rectangle.name,  is_breakout)
            breakout_bias = is_breakout ? 10000000000000 : 0;
            // if(node.rotation % 45 == 0 ) breakout_bias = 0;
            return breakout_bias + _.reduce(paths, function(memo, path) {
                return memo + path.length;
            }, 0);
        };

        // Helper Function to determine optimal routing.
        CircuitRouting.bestCost = function(node) {
            is_breakout = _.isNull(node.left) || _.isNull(node.right);
            thetas = _.range(-180, 180, THETA_STEP);
            if(is_breakout) thetas = _.range(-180, 180, 180);

            var cost_table = [];
            var original_rotation = node.rotation;

            cost_table = _.map(thetas, function(theta){
                node.rotation = theta;
                var neighbors = [];

                if (!_.isNull(node.left))
                    neighbors.push([node.left.outputPoint.position, node.inputPoint.position]);
                if (!_.isNull(node.right))
                    neighbors.push([node.outputPoint.position, node.right.inputPoint.position]);

                neighbors = _.map(neighbors, function(neighbor) {
                    return new Path(neighbor[0], neighbor[1])
                });

                result = { id: node.lid, theta: theta, cost: CircuitRouting.cost(node, neighbors) };
                _.each(neighbors, function(neighbor) { neighbor.remove() });
                return result;
            });

            node.rotation = original_rotation;

            return _.min(cost_table, function(entry) {return entry.cost });
        }

        // Function to route the rectangles together based on overall cost.
         CircuitRouting.route = function(nodes) {
            difference = Number.MAX_SAFE_INTEGER;
            iters = 0;

            while (difference > EPSILON && iters < OPT_MAX_ITERS) {
                result = _.map(nodes, function(node, i) {
                    return CircuitRouting.bestCost(node);
                });

                difference = _.reduce(nodes, function(memo, node, i) {
                    var prev = node.rotation;
                    node.rotation = result[i].theta;
                    return memo + Math.abs(prev - result[i].theta);
                }, 0);

                paper.view.update();
                iters++;
                console.log("OPT STEP", iters, difference);
            }
            return result;
        };

        CircuitRouting.connect_the_dots = function(nodes) {
            pts = []
            var lines = new paper.Group({ name: "TRACE: Trace Expansion" });
            _.each(nodes, function(node, i, arr) {
                var neighbors = [];

                if (!_.isNull(node.right))
                    neighbors.push([node.contactOutput.position, node.outputPoint.position, node.right.inputPoint.position, node.right.contactInput.position]);

                neighbors = _.map(neighbors, function(neighbor, i, arr) {
                    pts.push(neighbor);

                    return new paper.Path({
                        parent: lines,
                        segments: neighbor,
                        strokeColor: "blue",
                        strokeWidth: 3
                    })
                });
            });
            bgPath = new paper.Path({
                strokeColor: "yellow",
                segments: _.flatten(pts),
                strokeWidth: Ruler.mm2pts(8.5)
            });
            bgPath.sendToBack();
        }

        CircuitRouting.cleanup = function(nodes, e) {
            var ngroup = new paper.Group(nodes);
            _.each(nodes, function(node) {
                node.inputPoint.remove();
                node.outputPoint.remove();
                node.contactInput.remove();
                node.contactOutput.remove();
            });
            var invisible = _.compact(_.flatten([e.art, e.dds, e.leds, e.cp, e.bi, e.bo, e.diff]));
            Pipeline.set_visibility(invisible, false);
        }