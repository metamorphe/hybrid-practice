/*  Map Port API
 *  Updated 27 March 2017
 *  Author: Molly Nicholas
 */

#define DEBUG 0
 
#include <Adafruit_NeoPixel.h>
#define BAUD 9600

#define NUM_DEVICES 2

// SENSORS AND ACTUATOR PINS
#define NUMPIXELS 12 // Number of LEDs in strip
#define NEOPIXEL_PIN_ZERO 6
#define NEOPIXEL_PIN_ONE 7


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


/* SANDBOX API */
void color_change(){
  devID = Serial.parseInt();
  id = Serial.parseInt();
  r = Serial.parseInt();
  g = Serial.parseInt();
  b = Serial.parseInt();
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

  earrings[devID].setPixelColor(id, r, g, b);
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




