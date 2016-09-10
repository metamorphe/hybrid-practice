function Generator(){
        this.length = 72;
        this.ws = new WebStorage();
        this.diffuser = "Cuboid";
        this.model = "Splitter";
        this.export = "MOLD";
       
        this.c_norm = 0.5;
        this.c_uni = 0.5;
        this.c_energy = 0.50;
        this.cost = 0.5;
        this.random = true;

        this.init();
        // this.fabricate();
        this.sample_size = 300;
      }
      Generator.prototype = {
        init: function(){
          this.box = new paper.Path.Rectangle(paper.view.bounds);
          this.box.set({
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
        generate: function(){
            this.clear(["RT", "RAY", "PL", "LS", "DRAY"]);
            var model = eval(this.model);
            if(this.random || this.model == "noLens"){
                params = model.random(this.length);
            } else{
              params = this.getOptimal();
              // console.log("STORED COST", params.costs.cost);
            }
            paper.view.zoom = 2;
            var scene = model.makeScene(this.box, params, this.diffuser);

            // this.fire();
            paper.view.update();
            return params;
        }, 
        resample: function(){
         var scope = this;
         var samples = _.range(0, this.sample_size, 1);

          samples = _.map(samples, function(s, i){
            var params = scope.generate(random=true);
            costs = scope.fire();

            return {costs: costs, params: JSON.stringify(params)}
          });
         
          var min = _.min(samples, function(s){ return s.costs.cost; });
          var max = _.max(samples, function(s){ return s.costs.cost; });
          // console.log("RESULTS:", min, max);

          max_p = JSON.parse(max.params);
          max_p.costs = max.costs;
          max.params = JSON.stringify(max_p);
          
          var key = scope.generateKey(scope.length);
          if(this.ws.includes(key)){
            params = JSON.parse(this.ws.get(key));
            console.log("PREVIOUSLY STORED", scope.length, params.costs.cost, "v", max.costs.cost);
            if(!_.isUndefined(params.costs) && params.costs.cost > max.costs.cost){
              // this.generate(random=false);
              return params.costs.cost;
            }
          }
          console.log("REWRITING", scope.length, max.params);
          this.ws.set(key, max.params);
          
          // LOAD UP THE BEST ONE
          this.generate(false);
          return max.costs.cost;
        },
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
          // lengths = _.range(25, 200, 5);
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
          var params = this.generate();
          var model = eval(this.model);
          return model.getGradient(this.export, params);
        },
        fabricate: function(){
          var params = this.generate();
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

            var costs = JSON.parse(scope.ws.get(k)).costs;
            for(var key in costs) info[key] = costs[key];
            return info;
          })
          .compact()
          .filter(function(entry){ return entry.diffuser == "Planar"})
          .map(function(entry){
            return _.values(entry).join(',')
          })
          .value().join('\n');

          saveAs(new Blob(["Model,Diffuser,Length,Uniformity,Normality,Cost\n" + entries], {type:"text/csv"}), "simulation_results" + ".csv")

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
                console.log("SAMPLING ERROR", this.length, "HAS NO DATA");  
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

              // console.log("KEYS", a, b, tau);

              a = JSON.parse(this.ws.get([this.model, this.diffuser, a].join("_")));
              b = JSON.parse(this.ws.get([this.model, this.diffuser, b].join("_")));
            
              return model.interpolateParams(a, b, tau);
          }  
        }
      }