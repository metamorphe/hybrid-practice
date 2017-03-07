/*  Aesthetic Actuation Lab
 *  Updated 31 October 2016
 *  Author: Cesar Torres
 */
 
// SENSORS AND ACTUATOR PINS
#define LED1_PIN 9
#define LED2_PIN 10 
#define LED3_PIN 11 
#define POT_PIN A0 
int leds[] = {9, 10, 11};

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

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t id = 0;
uint8_t b = 0;
unsigned long startTime = 0;
unsigned long elapsedTime = 0;


// STATE MACHINE
char state = ' ';
char prevState = ' ';
bool off = false; // ARTIFICIAL TURN OFF (UNBINDS API)

/* SANDBOX API */
void color_change(){
  id = Serial.parseInt();
  b = Serial.parseInt();
  Serial.println(id);
  Serial.println(b);
  analogWrite(leds[id], b);
}

void findCommandEnd(){
  buffer = ' ';
  while(Serial.available() > 0 && buffer != '\n') buffer = Serial.read();
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

void setup() {
  Serial.begin(9600);
  Serial.println("Aesthetic Actuation Controller");
  registerActuators();
  registerSensors();
  delay(3000);
  startTime = millis();
}

void enable_api(){
  if (Serial.available() > 0) {
       prefix = Serial.read();
       api_call(prefix);
  }
}
void update(){
  if(state == 'b') return;
  if(prevState == state) return;
  Serial.print("S:");
  switch(state){
    case 'g':
       Serial.print("good");
       break;
    case 'f':
       Serial.print("fast");
       break;
    case 'e':
       Serial.print("error");
       break;
    case 'x':
       Serial.print("failure");
       break;
    case 's':
       Serial.print("success");
       break;
    case 'o':
       Serial.print("on");
       break;
    case 'd':
       Serial.print("off");
       break;
  }
  Serial.println();
  prevState = state;
}

int val = 0; 
int old_val = 0; 
int delta = 0;
int strikes = 3;

void state_machine(int val, int delta){
  if(delta <= 2)
    state = 'g';
  else if(delta > 2 && delta <= 4)
    state = 'f';
  else if(delta > 5 && strikes > 0){
    state = 'e';
    strikes--;
  }
  else if(delta > 8){
    state = 'x';
    non_block_delay('o', 3000);
    off = true;
  }
  if(strikes <= 0){
    state = 'x';
    non_block_delay('o', 3000);
    off = true;
  }
  if(val < 5 && strikes > 0){
    state = 's';
    non_block_delay('o', 3000);
    off = true;
  }
  update();  
}

void non_block_delay(char state, int delay){
  state = 'b';
  Serial.print("T:");
  Serial.print(state);
  Serial.print(",");
  Serial.print(delay);
  Serial.println();
}

void sense(){
  val = analogRead(POT_PIN);
  val = map(val, 0, 1024, 0, 100);
  
  if(elapsedTime > 200){
    state_machine(val, delta);
    delta = 0;
    startTime = millis();
  }else{
    delta = delta + (old_val - val);
    old_val = val;
  }
}

void loop() {
  elapsedTime = millis() - startTime;
  if(!off){
    sense(); // artificial turn_off
  }
  enable_api(); // always on
}

