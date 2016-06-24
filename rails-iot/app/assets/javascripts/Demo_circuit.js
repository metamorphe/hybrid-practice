//demo-circuit
            var demo_battery_1 = {voltage: 25}; //this should blow up the LED
            var demo_battery_2 = {voltage: 1}; //this should not turn on the LED
            var demo_battery_3 = {voltage:5}; //this should be juuuust right 

            var demo_trace_pos = {tracelength: 400, tracewidth: 2}; 
            var demo_trace_neg = {tracelength: 500, tracewidth: 2};
            var demo_material = {name: "copper", sheetresistance: 0.5};


           
            var demo_led = {
                current_max: 0.10, //max current in amp
                turnonvoltage: 2, 
                brightness_max: 200 
            }

            var demo_resistance_pos = calculateResistanceFromLength(demo_material, demo_trace_pos); //100 ohm
            var demo_resistance_neg = calculateResistanceFromLength(demo_material, demo_trace_neg); //125 ohm


             function calculateResistanceFromLength(material, trace){ //assuming the trace is uniform for now
                return {resistance: material.sheetresistance*trace.tracelength/trace.tracewidth};
            }


            function calculateLEDState(led, resistorPos, resistorNeg,  battery) {
                var led_brightness = 0; // led_brightness varies from 0 to 1. set to -1 if it's blowing up.
                var circuit_current = battery.voltage/(resistorPos.resistance + resistorNeg.resistance); 
                var circuit_voltage_drop = battery.voltage - (resistorPos.resistance * circuit_current);
                
                if (circuit_voltage_drop < led.turnonvoltage) {
                    led_brightness = 0; 
                } else if (circuit_current > led.current_max) {
                    led_brightness = -1; 
                } else {
                    led_brightness = circuit_current/led.current_max; 
                }
                
                console.log("this is the led brightness", led_brightness);
            return led_brightness;     
            }
           
                var result;
                result = calculateLEDState(demo_led, demo_resistance_pos, demo_resistance_neg, demo_battery_1); console.log("i should blow up", result);
                result = calculateLEDState(demo_led, demo_resistance_pos, demo_resistance_neg, demo_battery_2); console.log("i shouldn't turn on", result);
                result = calculateLEDState(demo_led, demo_resistance_pos, demo_resistance_neg, demo_battery_3); console.log("this sould work", result);
           
        