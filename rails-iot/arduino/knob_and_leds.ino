/*  Aesthetic Actuation Lab
 *  Updated 31 October 2016
 *  Author: Cesar Torres
 */

#define NUMPIXELS 16 // Number of LEDs in strip
#define LED1_PIN 9
#define LED2_PIN 10 
#define LED3_PIN 11 
#define POT_PIN A0 
int leds[] = {9, 10, 11};
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;
char buffer = ' ';
char state = ' ';
bool off = false;

/* SANDBOX API */
char prefix = 0;
void findCommandEnd(){
  while(Serial.available() > 0){
    buffer = Serial.read();
    if(buffer == '\n') break;
  }
}
void color_change(){
  id = Serial.parseInt();
  b = Serial.parseInt();
  Serial.println(id);
  Serial.println(b);
  analogWrite(leds[id], b);
//  strip.show();
}

void api_call(char prefix){
  switch (prefix) {
    case 'p': 
      findCommandEnd();     
      break;
    case 'c':
      Serial.println("C");
      color_change();
      findCommandEnd(); 
       Serial.print("CHANGING: ");
       Serial.print(id);
         Serial.print(",");
       Serial.println(b);
      break;
    default: 
      Serial.print(prefix);
      Serial.println(" API command does not exist");
    break;
  }
}



// SERIAL CONSOLE INTERFACE
void registerActuators(){
  // add all setup commands for actuators here
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
}

void registerSensors(){
  // add all setup commands for actuators here
  pinMode(POT_PIN, INPUT);
}


void setup() {
  Serial.begin(9600);
  Serial.println("Aesthetic Actuation Controller");
  registerActuators();
  registerSensors();
  good_state();
  delay(3000);
}

void enable_api(){
   // Listening for character input for Serial console
  if (Serial.available() > 0) {
      // read the incoming byte:
       prefix = Serial.read();
       Serial.print("Calling API Command: ");
       Serial.print(prefix);
       Serial.print(" ");
       api_call(prefix);
  }
//  delay(50);              // wait for a 50 milliseconds
}

int val = 0; 
int old_val = 0; 
int delta = 0;
int strikes = 3;



// BEGIN STATES

void good_state(){
  if(state == 'g') return;
  state = 'g';
  Serial.print("S:");
  Serial.print("good");
  Serial.println();
}
void fast_state(){
  if(state == 'f') return;
  state = 'f';
  Serial.print("S:");
  Serial.print("fast");
  Serial.println();
}
void error_state(){
  if(state == 'e') return;
  state = 'e';
  Serial.print("S:");
  Serial.print("error");
  Serial.println();
}
void failure_state(){
  if(state == 'x') return;
  state = 'x';
  Serial.print("S:");
  Serial.print("failure");
  Serial.println();
}
void success_state(){
  if(state == 's') return;
  state = 's';
  Serial.print("S:");
  Serial.print("success");
  Serial.println();
}
void on_state(){
  if(state == 'o') return;
  state = 'o';
  Serial.print("S:");
  Serial.print("on");
  Serial.println();
}
void off_state(){
  if(state == 'd') return;
  state = 'd';
  Serial.print("S:");
  Serial.print("off");
  Serial.println();
  off = true;
}

// END STATES

void state_machine(int val, int delta){
  if(delta <= 2)
    good_state();
  else if(delta > 2 && delta <= 4)
    fast_state();
  else if(delta > 4 && strikes > 0){
    error_state();
    strikes--;
  }
  else if(delta > 6){
    failure_state();
    delay(3000);
    off_state();
  }
  if(strikes <= 0){
    failure_state();
    delay(3000);
    off_state();
  }
  if(val < 5 && strikes > 0){
    success_state();
    delay(3000);
    off_state();
  }  
}

void calm_turn(){
  val = analogRead(POT_PIN);
  val = map(val, 0, 1024, 0, 100);
  delta = old_val - val;
  old_val = val;
  state_machine(val, delta);
 
}

void loop() {
  if(!off){
    calm_turn();
    enable_api();
    delay(200);
  }
}

