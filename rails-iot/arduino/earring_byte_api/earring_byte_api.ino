/*  Earring API
 *  Updated 27 March 2017
 *  Author: Molly Nicholas
 */

#define DEBUG 1
 
#include <Adafruit_NeoPixel.h>
#define BAUD 19200

#define NUM_DEVICES 2

// SENSORS AND ACTUATOR PINS
#define NUMPIXELS 12 // Number of LEDs in strip
#define NEOPIXEL_PIN_ZERO 9
#define NEOPIXEL_PIN_ONE 8


Adafruit_NeoPixel earrings[NUM_DEVICES] = {
  Adafruit_NeoPixel(NUMPIXELS, NEOPIXEL_PIN_ZERO, NEO_GRB + NEO_KHZ800),
  Adafruit_NeoPixel(NUMPIXELS, NEOPIXEL_PIN_ONE, NEO_GRB + NEO_KHZ800)
};

void update() {
  for(int i = 0; i < NUM_DEVICES; i++) {
    earrings[i].show();
  }
}

void registerActuators() {
  for(int i = 0; i < NUM_DEVICES; i++) {
    earrings[i].begin();
    earrings[i].show(); // Initialize all pixels to 'off'
  }
}

void registerSensors() {
  
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t devID = 0;
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;
bool captured = captured;
int incomingByte = 0;

uint8_t test = 0;


/* SANDBOX API */
void color_change(){
//  devID = Serial.parseInt();
//  Serial.print(" ");
//  Serial.print(devID, HEX);
//  Serial.println();
  
  
  while(!captured){
    buffer = Serial.read();
    Serial.print(buffer, DEC);
    Serial.print(" ");
    Serial.print(buffer, HEX);
    Serial.print(" ");
    Serial.println(buffer, BIN);
    if(buffer != -1 ) captured = true;
  }
  Serial.print(buffer, DEC);
  Serial.print(" ");
  Serial.print(buffer, HEX);
  Serial.print(" ");
  Serial.println(buffer, BIN);
  test = 0;
  devID = test;
  id = test;
  r = test;
  g = test;
  b = test;
//  id = Serial.read()- '0';
//  r = Serial.read()- '0';
//  g = Serial.read()- '0';
//  b = Serial.read()- '0';
  if (DEBUG == 1) {
    Serial.print("devID: ");
    Serial.println(devID);
    Serial.print("id: ");
    Serial.println(id);
    Serial.print("r: ");
    Serial.println(r);
    Serial.print("g: ");
    Serial.println(g);
    Serial.print("b: ");
    Serial.println(b);
  }
//
//  earrings[devID].setPixelColor(id, r, g, b);
}

void findCommandEnd(){
  Serial.println("END OF COMMAND");
  buffer = ' ';
  Serial.print("Trash");
  while(buffer != 0x10 ){
    if(Serial.available() > 0){
      buffer = Serial.read();
      Serial.print(buffer);
    } 
  }
  Serial.println();
}

void api_call(char prefix){
  if (DEBUG == 1) {
    Serial.print("prefix: ");
    Serial.println(prefix);
    Serial.println((int) prefix);
  }
   switch (prefix) {
    case 'u': 
      update();
      findCommandEnd();
      break;
    case 'c':
      color_change();
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
  if (DEBUG == 1) {
    Serial.println("Aesthetic Actuation Controller - Earring");
  }
  registerActuators();
}

void loop() {
  enable_api(); // always on
}

void enable_api(){
  while (Serial.available() > 0) {
       prefix = Serial.read();
       Serial.print(prefix, DEC);
       Serial.print(" ");
       Serial.print(prefix, HEX);
       Serial.print(" ");
       Serial.println(prefix, BIN);
//       api_call(prefix);
  }
}







