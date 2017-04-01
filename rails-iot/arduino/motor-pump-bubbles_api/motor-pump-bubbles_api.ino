/*  BubbleMachine API
 *  Updated 1 April 2017
 *  Author: Molly Nicholas
 */

#define DEBUG 0

#define NUM_DEVICES 4
#define BAUD 9600

int pump[NUM_DEVICES] = {
  3, 5, 6, 9
};

void update() {
  
}

void registerActuators() {
  for (int i = 0; i < NUM_DEVICES; i++) {
    pinMode(pump[i], OUTPUT);
  }
}

void registerSensors() {
  
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t devID = 0;
uint16_t id = 0;
uint16_t freq = 0;
uint16_t delayTime = 0;

void pwmControl() {
  devID = Serial.parseInt();
  id = Serial.parseInt();
  freq = Serial.parseInt();
  delayTime = Serial.parseInt();
  uint16_t extra = Serial.parseInt();
  if (DEBUG) {
    Serial.print("pump[i]: ");
    Serial.println(pump[id]);
    Serial.print("freq: ");
    Serial.println(freq);
  }
  analogWrite(pump[id], freq);
  delay(delayTime);
  if (DEBUG) {
    Serial.println("turn PWM off");
  }
  analogWrite(pump[id], 0);
    delay(1000);
}

void findCommandEnd(){
  buffer = ' ';
  while(buffer != '\n'){
    if(Serial.available() > 0){
      buffer = Serial.read();
    } 
  }
}

void api_call(char prefix){
  if (DEBUG == 1) {
    Serial.print("prefix: ");
    Serial.println(prefix);
  }
   switch (prefix) {
    case 'u': 
      update();
      findCommandEnd();
      break;
    case 'c':
      pwmControl();
      findCommandEnd(); 
      break;
    default: 
      Serial.print(prefix);
      Serial.println("API command does not exist");
      findCommandEnd(); 
    break;
  }
}

void setup() {
  Serial.begin(BAUD);
  Serial.println("motor pump bubbles..");
  registerActuators();
}

void enable_api(){
  if (Serial.available() > 0) {
       prefix = Serial.read();
       api_call(prefix);
  }
}

void non_block_delay(char s, int delay){
  Serial.print("T:");
  Serial.print(s);
  Serial.print(" ");
  Serial.print(delay);
  Serial.println();
}

void loop() {
  enable_api(); // always on
}

void digitalLoopAll(int delayTime) {
  for (int i = 0; i < NUM_DEVICES; i++) {
    Serial.println("i HIGH");
    digitalWrite(pump[i], HIGH);
    delay(delayTime);
    Serial.println("i LOW");
    digitalWrite(pump[i], LOW);
    delay(1000);
  }
}

