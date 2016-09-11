/**
 * @author Francisco Soto <ebobby@gmail.com>
 */
var SimulatedAnnealing = (function () {
    var coolingFactor            = 0.0,
        stabilizingFactor        = 0.0,
        freezingTemperature      = 0.0,
        currentSystemEnergy      = 0.0,
        currentSystemTemperature = 0.0,
        currentStabilizer        = 0.0,

        generateNewSolution      = null,
        generateNeighbor         = null,
        acceptNeighbor           = null;

    function _init (options) {
        coolingFactor            = options.coolingFactor;
        stabilizingFactor        = options.stabilizingFactor;
        freezingTemperature      = options.freezingTemperature;
        generateNewSolution      = options.generateNewSolution;
        generateNeighbor         = options.generateNeighbor;
        acceptNeighbor           = options.acceptNeighbor;

        currentSystemEnergy      = generateNewSolution();
        initialSystemTemperature = options.initialTemperature;
        currentSystemTemperature = options.initialTemperature;
        currentStabilizer        = options.initialStabilizer;
    }

    function _probabilityFunction (temperature, delta) {
        if (delta < 0) {
            // console.log("BETTER SOLUTION");
            return true;
        }
  
        // var C = Math.exp(-delta / temperature);
        // var R = Math.random();
        // // console.log('SIM ACCEPT', delta.toFixed(2), C.toFixed(2), R < C)
        // if (R < C) {
        //     return true;
        // }

        return false;
    }

    function _doSimulationStep () {
        var step = (currentSystemTemperature) / (initialSystemTemperature - freezingTemperature);
        NEARNESS_CRITERIA = step;
        if (currentSystemTemperature > freezingTemperature) {
            for (var i = 0; i < currentStabilizer; i++) {
                var newEnergy = generateNeighbor(),
                    energyDelta = newEnergy - currentSystemEnergy;
                    // console.log("ENERGY DELTA", energyDelta.toFixed(2));
                if (_probabilityFunction(currentSystemTemperature, energyDelta)) {
                    acceptNeighbor();
                    currentSystemEnergy = newEnergy;
                }
            }
            currentSystemTemperature = currentSystemTemperature - coolingFactor;
            currentStabilizer = currentStabilizer * stabilizingFactor;
            // coolingFactor = coolingFactor * cooling;
            return false;
        }
        currentSystemTemperature = freezingTemperature;
        return true;
    }

    return {
        Initialize: function (options) {
            _init(options);
        },

        Step: function () {
            return _doSimulationStep();
        },

        GetCurrentEnergy: function () {
            return currentSystemEnergy;
        },

        GetCurrentTemperature: function () {
            return currentSystemTemperature;
        }
    };
})();