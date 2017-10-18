
/*  Buddha API
 *  Updated 15 Sept 2017
 *  Authors: 
 *   - Cesar Torres
 */

#define DEBUG 0
#define NUM_DEVICES 7
#define BAUD 19200



int pumps[NUM_DEVICES] = {
  2, 3, 4, 5, 6, 7, 8
};

void registerActuators() {
  for (int i = 0; i < NUM_DEVICES; i++) {
    pinMode(pumps[i], OUTPUT);
  }
}


void allOff(){
   for (int i = 0; i < NUM_DEVICES; i++) {
    digitalWrite(pumps[i], HIGH); // sainsmart is closed on HIGH
  }
}
void allOn(){
   for (int i = 0; i < NUM_DEVICES; i++) {
    digitalWrite(pumps[i], LOW); // sainsmart is closed on HIGH
  }
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t devID = 0;
uint16_t id = 0;
uint16_t freq = 0;

void pumpControl() {
  devID = Serial.parseInt();
  id = Serial.parseInt();
  if (id > NUM_DEVICES) {
    if (DEBUG){
      Serial.print("ERROR, PUMP DOES NOT EXIST! -- #");
      Serial.println(id);
    }
  }

  freq = Serial.parseInt();
  if(freq < 5) freq = HIGH;
  else freq = LOW;

  if (DEBUG) {
    Serial.print("pump[i]: ");
    Serial.println(pumps[id]);
    Serial.print("freq: ");
    Serial.println(freq);
  }
  
  digitalWrite(pumps[id], freq);
}

void findCommandEnd(){
  buffer = ' ';
  while(buffer != '\n'){
    if(Serial.available() > 0){
      buffer = Serial.read();
    } 
  }
}
void update(){
}

void api_call(char prefix){
   switch (prefix) {
    case 'u': 
      update(); // no update logic here; placeholder
      findCommandEnd();
      break;
    case 'p':
      pumpControl();
      findCommandEnd(); 
      break;
    case 'x': 
      allOff();
      findCommandEnd();
      break;
    case 'o': 
      allOn();
      findCommandEnd();
      break;
    default: 
      Serial.print(prefix);
      Serial.println(": API command does not exist");
      findCommandEnd(); 
    break;
  }
}

void setup(void) {
  Serial.begin(BAUD);
  Serial.println("I am the Buddha!");
  Serial.print("Listening at ");
  Serial.print(BAUD);
  Serial.println(" baud.");
  Serial.print(NUM_DEVICES);
  Serial.println(" heaters enabled.");

  registerActuators();
  allOff();
}

void enable_api(){
  if (Serial.available() > 0) {
       prefix = Serial.read();
       api_call(prefix);
  }
}

void loop() {
  enable_api(); 
}
