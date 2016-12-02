var NEARNESS_CRITERIA = 0.5;

function normNeighbor(a){
  var travelling_range = NEARNESS_CRITERIA;
  var travel = travelling_range * Math.random();

  var split = travelling_range / 2;
  var upper_overflow = a + split;
  var lower_overflow = a - split;
  if(lower_overflow <= 0){ min = 0; max = upper_overflow - lower_overflow;}
  else if(upper_overflow >= 1){ max = 1; min = lower_overflow - (upper_overflow - 1);}
  else{ min = lower_overflow; max = upper_overflow;}
  
  return min + travel;
}
var generatorSolution = null;
var generatorEnergy = 20;
function Generator(){
        this.length = 72;
        this.ws = new WebStorage();
        this.diffuser = "Planar";
        this.model = "Reflector";
        this.export = "REFL";
       
        this.c_norm = 0.5;
        this.c_uni = 0.5;
        this.c_energy = 0.50;
        this.cost = 0.5;
        this.random = true;

        
        this.initial_temperature = 10.0;
        // this.initial_stabilizer = 1.0;
        this.initial_stabilizer = 5.0;
        this.stabilizing_factor = 0.8;
        // this.cooling_factor = 0.05;
        this.cooling_factor = 0.25;
        this.freezing_temperature = 0.0;

        this.system_temperature = this.initial_temperature;
        this.system_energy = 1.0;


        this.init();
        // this.fabricate();
        this.sample_size = 300;
        this.params = null;
      }
      Generator.prototype = {
        init: function(){
          this.box = new paper.Path.Rectangle(paper.view.bounds);
          this.box.set({
              name: "NP: not useful",
              position: paper.view.center,
              fillColor: '#111'
          }); 
          
          paper.view.update();
        }, 
        clear: function(prefixes){
          _.each(prefixes, function(prefix){
            _.each(CanvasUtil.queryPrefix(prefix), function(rt){
              rt.remove();
            });
          }) 
        },
        generateNeighbor: function(){   
          if(_.isNull(this.params)) return;

          this.clear(["RT", "RAY", "PL", "LS", "DRAY"]);

          var model = eval(this.model);   
          this.params = model.neighbor(JSON.parse(generatorSolution));
          paper.view.zoom = 2;
          var scene = model.makeScene(this.box, this.params, this.diffuser);

          paper.view.update();
          return this.params;
        },
        generateRandom: function(){
            this.clear(["RT", "RAY", "PL", "LS", "DRAY"]);
            var model = eval(this.model);
            if(this.random || this.model == "noLens"){
                this.params = model.random(this.length);
            } else{
              this.params = this.getOptimal();
              // console.log("STORED COST", params.costs.cost);
            }
            paper.view.zoom = 2;
            var scene = model.makeScene(this.box, this.params, this.diffuser);

            // this.fire();
            paper.view.update();
            return this.params;
        }, 
        generate: function(){
            this.clear(["RT", "RAY", "PL", "LS", "DRAY"]);
            var model = eval(this.model);
            
            paper.view.zoom = 2;
            var scene = model.makeScene(this.box, this.params, this.diffuser);

            // this.fire();
            paper.view.update();
            return this.params;
        },
        generateOptimal: function(){
            this.clear(["RT", "RAY", "PL", "LS", "DRAY"]);
            var model = eval(this.model);
            if(this.random || this.model == "noLens"){
                this.params = model.random(this.length);
            } else{
              this.params = this.getOptimal();
              // console.log("STORED COST", params.costs.cost);
            }
            paper.view.zoom = 2;
            var scene = model.makeScene(this.box, this.params, this.diffuser);

            // this.fire();
            paper.view.update();
            return this.params;
        }, 
        resample: function(){
         var scope = this;
         var samples = _.range(0, this.sample_size, 1);

          samples = _.map(samples, function(s, i){
            var params = scope.generateOptimal(random=true);
            costs = scope.fire();

            return {costs: costs, params: JSON.stringify(params)}
          });
         
          var min = _.min(samples, function(s){ return s.costs.cost; });
          var max = _.max(samples, function(s){ return s.costs.cost; });
          // console.log("RESULTS:", min, max);

          max_p = JSON.parse(max.params);
          max_p.costs = max.costs;
          // max.params = JSON.stringify(max_p);
          
          this.storeSolution(max_p);
          // LOAD UP THE BEST ONE
          this.generateOptimal(false);
          return max.costs.cost;
        },
        storeSolution: function(solution){
          var key = this.generateKey(this.length);

          if(this.ws.includes(key)){
            params = JSON.parse(this.ws.get(key));
            if(!_.isUndefined(params.costs) && params.costs.cost > solution.costs.cost){
              console.log("PREVIOUSLY STORED WINS", this.length, params.costs.cost.toFixed(2), "v", solution.costs.cost.toFixed(2));
              return params.costs.cost;
            }
          }
          console.log("REWRITING", this.length, solution);
          this.ws.set(key, JSON.stringify(solution));
        },
        anneal: function(){
          var scope = this;
          if(this.model == "noLens"){
            scope.params = this.generateOptimal();
            scope.params.costs = scope.fire();
            console.log("COST", scope.params.costs);
            return scope.storeSolution(scope.params);
          }
         

          var model = eval(this.model);
          generatorSolution = JSON.stringify(this.generateRandom());
          var SCALE = 1;

          var options = {
            initialTemperature:  this.initial_temperature,
            initialStabilizer:   this.initial_stabilizer,
            coolingFactor:       this.cooling_factor,
            stabilizingFactor:   this.stabilizing_factor,
            freezingTemperature: this.freezing_temperature, 
          };
          options.generateNewSolution = function(){
            params = scope.generateRandom();
            return (1 - scope.fire().cost) * SCALE;
          }
          options.generateNeighbor = function(){
            params = scope.generateNeighbor();
            return (1 - scope.fire().cost) * SCALE;
          }
          options.acceptNeighbor = function(){
            generatorSolution = JSON.stringify(scope.params);
            generatorEnergy = scope.fire().cost;
          }
          SimulatedAnnealing.Initialize(options);
          console.log("System – T:", SimulatedAnnealing.GetCurrentTemperature().toFixed(2), "E:", (1 - SimulatedAnnealing.GetCurrentEnergy()).toFixed(2));
            
          scope.system_energy = SimulatedAnnealing.GetCurrentEnergy();
          scope.system_temperature = SimulatedAnnealing.GetCurrentTemperature();
       
          steps = 0;
          // intervalId = setInterval(function(){
            done = false;
              while(! done){
                var done = SimulatedAnnealing.Step();
                steps ++; 
                console.log("System – T:", SimulatedAnnealing.GetCurrentTemperature().toFixed(2), "E:", (1 - SimulatedAnnealing.GetCurrentEnergy()).toFixed(2));
                scope.system_energy = SimulatedAnnealing.GetCurrentEnergy();
                scope.system_temperature = SimulatedAnnealing.GetCurrentTemperature();
              }
              if(done == true){
                scope.params = JSON.parse(generatorSolution);
                scope.generate();
                scope.params.costs = scope.fire();
                console.log("END ENERGY",  scope.params.costs.cost, "STEPS", steps);
                scope.storeSolution(scope.params);
              // clearInterval(intervalId);
            }
          // }, 20);

        },
        batch_anneal: function(){
          var d = new Date();
          var t_start = d.getTime();
          var scope = this;
          lengths = _.range(5, 200, 5);
          // lengths = this.get_eval_lengths();
          // lengths = _.range(5, 10, 1);
          console.log("STARTING BATCH ANNEAL PROCESS");
          _.each(lengths, function(l, i){
            scope.length = l;
            console.log("PROCESSING", l, "(", i + 1, "out of", lengths.length, ")");
            scope.anneal();
          });
          var d = new Date();
          var t_end = d.getTime();
          console.log("END BATCH PROCESS");
          console.log("TIME:", ((t_end - t_start) / 1000).toFixed(2), "seconds");
        }, 
        // ***** END SIMULATED ANNEALING FUNCTIONS  ****** // 
        fire: function(){
           this.clear(["RAY", "PL", "DRAY"]);
           var mediums = CanvasUtil.getMediums();
           
           var light_source = CanvasUtil.queryPrefix("LS");
           
            light_source = _.chain(light_source).map(function(ls){
                  return new PointLight({
                      position: ls.position, 
                      mediums: mediums
                  });
            }).each(function(ls){
              ls.emmision(-60, 0, 0.5);
            });

         
           this.c_uni =  ImagePlane.calculateUniformity();
           this.c_norm = ImagePlane.calculateNormality();
           this.c_energy = ImagePlane.calculateEnergy();
           // console.log("RESULTS:", uniformity.toFixed(2), normality.toFixed(2), (uniformity * 0.8 + normality * 0.2).toFixed(2));

           paper.view.update();
           this.cost = this.c_uni * 0.7 + this.c_norm * 0.1 + 0.2 * this.c_energy;

           // console.log("COST", this.cost.toFixed(2));

           return {uni: this.c_uni, norm: this.c_norm, energy: this.c_energy, cost: this.cost};
           // return  normality * 0.2 ;
        }, 
        batch_clear: function(){
          var scope = this;
          _.each(scope.ws.keys(), function(key){
            var k = scope.decodeKey(key);

            if(!_.isNull(k))
              scope.ws.remove(key);
            
          });
        }, 
        get_eval_lengths: function(){
          // EVAL GEOM
          if(this.diffuser == "Planar") lengths = ["24", "26", "27", "30", "31", "32", "33", "34", "37", "38", "39", "40", "46", "47", "54", "55", "63", "71", "72", "81", "90", "91", "99", "100", "109", "110", "119", "120", "128", "129", "138", "139", "145", "146", "148"];
          if(this.diffuser == "Cuboid") lengths = ["85", "86", "88", "91", "92", "96", "101", "106", "107", "113", "119", "120"];
          if(this.diffuser == "Hemisphere") lengths = ["84", "85"];
      
          lengths = _.chain(lengths)
                    .flatten()
                    .unique()
                    .map(function(l){ return parseInt(l); })
                    .value();        
          return lengths;
        },
        batch_process: function(){
          var d = new Date();
          var t_start = d.getTime();
          var scope = this;
          lengths = _.range(15, 30, 5);
          lengths = this.get_eval_lengths();
          console.log("STARTING BATCH PROCESS");
          _.each(lengths, function(l, i){
            scope.length = l;
            console.log("PROCESSING", l, "(", i + 1, "out of", lengths.length, ")");
            scope.resample();
          });
          var d = new Date();
          var t_end = d.getTime();
          console.log("END BATCH PROCESS");
          console.log("TIME:", ((t_end - t_start) / 1000).toFixed(2), "seconds");
        }, 
        getGradient: function(){
          var params = this.generateOptimal();
          // console.log(this.model);
          var model = eval(this.model);
          // console.log(params)
          result = {reflector: model.getGradient("REFL", params)}

          if(this.model == "TIR") _.extend(result, {dome: model.getGradient("DOME", params), domeWidth: params.dome.width})
          if(this.model == "Splitter") _.extend(result, 
            {
              mold: model.getGradient("MOLD", params), 
              cone: model.getGradient("CONE", params),
              prism: params.prism
          })
          return result;
        },
        fabricate: function(){
          var params = this.generateOptimal();
          var model = eval(this.model);
          model.fabricate(params, this.length);
          paper.view.update();
        }, 
        download_data: function(){
          var scope = this;
          var entries = this.ws.keys();
          var entries = _.chain(entries).map(function(k){
            var info = scope.decodeKey(k);
            if(_.isNull(info)) return null;

            var data = JSON.parse(scope.ws.get(k));
            for(var key in data.costs) info[key] = data.costs[key];
            if(info.model == "noLens"){
              // console.log(data);
              // info["rampAA"] = 1;
              // info["rampAB"] = 1;
              // info["rampBA"] = 0;
              // info["rampBB"] = 0;
              // console.log("INFO", info)
              return info;
            } else{
              info["rampAA"] = data.ramp.a.alpha;
              info["rampAB"] = data.ramp.a.beta;
              info["rampBA"] = data.ramp.b.alpha;
              info["rampBB"] = data.ramp.b.beta;
              return info;
            }
          })
          .compact()
          .filter(function(entry){ return entry.diffuser == "Planar"})
          .map(function(entry){
            return _.values(entry).join(',')
          })
          .value().join('\n');

          saveAs(new Blob(["Model,Diffuser,Length,Coverage,Directionality,Cost,Efficiency,RampAA, RampAB, RampBA, RampBB\n" + entries], {type:"text/csv"}), "simulation_results" + ".csv")

          // .groupBy(function(e){
          //   return e.model
          // }).mapObject(function(values, model){
          //   return _.groupBy(values, function(v){return v.diffuser});
          // })
          // .value();




          console.log(entries);
        },
        download: function(){
          paper.view.zoom = 1;
          var result = CanvasUtil.queryPrefix(this.export);
          if(result.length == 0) return;
          result = result[0];
          result.bringToFront();
          result.fitBounds(paper.view.bounds.expand(-100));

          result.position =  paper.project.view.projectToView(new paper.Point(result.strokeBounds.width/2.0, result.strokeBounds.height/2.0));
          cut =  paper.project.view.projectToView(new paper.Point(result.strokeBounds.width, result.strokeBounds.height));
          // result.position.x -= 6;
          paper.view.update();
          bufferCanvas = copyCanvasRegionToBuffer($('#myCanvas')[0], 0, 0, cut.x, cut.y );
          
          var download = document.createElement('a');
          download.href = bufferCanvas.toDataURL("image/png");
          download.download = this.export + '.png';
          download.click();

            //     dom.attr('href', bufferCanvas.toDataURL("image/png"))
            //             .attr('download', filename + '.png');
            //     // dom.attr('href', $('#myCanvas')[0].toDataURL("image/png"))
            //            // .attr('download', filename + '.png');
            // }
        }, 
        generateKey: function(){
          return [this.model, this.diffuser, this.length].join("_"); 
        },
        decodeKey: function(k){

          if(k.split("_").length <= 1) return null;
          else{
            d = k.split("_");
            if(_.isNaN(parseFloat(d[2]))) return null;
            return {model: d[0], diffuser: d[1], length: parseFloat(d[2])}
          }
        }, 
        getSamples: function(){
          var scope = this;
          return  _.chain(this.ws.keys())
            .map(function(k){
              return scope.decodeKey(k);
            })
            .filter(function(k){
              if(_.isNull(k)) return null;
              return scope.model == k.model && scope.diffuser == k.diffuser;
            })
            .compact()
            .value();
        },
        getOptimal: function(){
          var scope = this;
          var model = eval(this.model);
          var key = this.generateKey(); 
          // console.log(key);   
          if(this.ws.includes(key)){
              // console.log("Stored", key)
              return JSON.parse(this.ws.get(key));
          }
          else{
            // console.log(JSON.stringify(scope.getSamples()), scope.diffuser, scope.model);
              keys = _.chain(scope.getSamples())
                      .pluck("length")
                      .sortBy()
                      .value();
            // console.log(keys);
              if(keys.length == 0){
                console.log("SAMPLING ERROR", this.length, this.model, this.diffuser, "HAS NO DATA");  
                return model.random(this.length);
              }

              keys_above = _.filter(keys, function(k){ return k > scope.length});
              keys_below = _.filter(keys, function(k){ return k < scope.length});

              if(keys_below.length == 0 || keys_above.length == 0){
                console.log("SAMPLING ERROR", this.length, "ABOVE", keys_above, "BELOW", keys_below);
                return model.random(this.length);
              }

              a = keys_below[keys_below.length - 1]; // last element of keys below
              b = keys_above[0];
              tau = (b-scope.length)/(b-a);
              console.log("KEYS", scope.length, a, b, tau);

              // console.log("KEYS", a, b, tau);

              a = JSON.parse(this.ws.get([this.model, this.diffuser, a].join("_")));
              b = JSON.parse(this.ws.get([this.model, this.diffuser, b].join("_")));
            
              return model.interpolateParams(a, b, tau);
          }  
        }
      }


const PROFILE_SAMPLING = 0.01;

Generator.profileToGradient = function(params, profile, invert = false, offset){
  // console.log(profile);
    profile.scaling = new paper.Size(1/profile.bounds.width, 1/profile.bounds.height);
    var origin = profile.bounds.bottomRight.clone();
    var x_max = profile.bounds.bottomLeft.clone();
    var y_max = profile.bounds.topRight.clone();
    var x_axis = x_max.subtract(origin);
    var y_axis = y_max.subtract(origin);

    // POINTS TO SAMPLE
    var segment_positions = _.map(profile.segments, function(seg){return profile.getOffsetOf(seg.point); });
    var supersampled_positions = _.range(0, profile.length, PROFILE_SAMPLING);
    var samples = _.flatten([supersampled_positions, segment_positions]);
    


    var total_ref_height = params.lens.height + Ruler.mm2pts(0.01); 
    var stops = _.chain(samples).map(function(sample){
      var pt = profile.getPointAt(sample);
      var vec = pt.subtract(origin);
      x = vec.dot(x_axis);
      y = vec.dot(y_axis);
      if(y < 0.02) y = Ruler.mm2pts(0.10) / total_ref_height; // stop holes 
      if(x == 1) y = 1.0; // make sure it ends on white
      if(invert) y = 1.0 - y;
      if(offset) y = y + offset < 1 ? y + offset : 1.0;
      return [new paper.Color(y), x]
    }).sortBy(function(g){ return g[1]; })
    .unique(function(g){ return g[1]; })
    .value();

    profile.remove();
    // return ['yellow', 'red', 'blue'];a
    // console.log(_.map(stops, function(s){ return s[1].toFixed(3) + "\t" + s[0].gray.toFixed(2)  }).join('\n'));
    return stops;
}