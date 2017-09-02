
/*  Aquarium API
 *  Updated 22 August 2017
 *  Authors: 
 *   - Molly Nicholas
 *   - Cesar Torres
 */


// Temperature sensor code derived from:
// ---------------------
// OneWire DS18S20, DS18B20, DS1822 Temperature Example
// http://www.pjrc.com/teensy/td_libs_OneWire.html
//
// The DallasTemperature library can do all this work for you!
// http://milesburton.com/Dallas_Temperature_Control_Library

// Circuit setup
// 5V Logic to Relays (sainsmart )
// Temperature Sensor with a 4.7 ohm resistor between PWR and SIGNAL

#include <OneWire.h>
#define DEBUG 0
#define NUM_DEVICES 5
#define BAUD 19200
#define TEMP_SENS_PIN 4
#define PROXIMITY_FAR_SENS_PIN A1
#define PROXIMITY_NEAR_SENS_PIN A0
#define SUNKEN_SHIP 7
#define RELAY_CYCLES_S 2

OneWire  ds(TEMP_SENS_PIN);

int pumps[NUM_DEVICES] = {
  6, 7, 8, 9, 10
};

int nearSenseValue = 0;
int farSenseValue = 0;

float celsius, fahrenheit = -1;
byte i;
byte present = 0;
byte type_s;
byte data[12];
byte addr[8];

int getNear(){
  return analogRead(PROXIMITY_NEAR_SENS_PIN);
}

int getFar(){
  return analogRead(PROXIMITY_FAR_SENS_PIN);
}

void sampleTemperature(){
  if ( !ds.search(addr)) {
//    Serial.println("No more addresses.");
//    Serial.println();
    ds.reset_search();
    delay(250);
    return;
  }


  if (OneWire::crc8(addr, 7) != addr[7]) {
      return;
  }
 
  switch (addr[0]) {
    case 0x10:
      type_s = 1;
      break;
    case 0x28:
      type_s = 0;
      break;
    case 0x22:
      type_s = 0;
      break;
    default:
      return;
  } 

  ds.reset();
  ds.select(addr);
  ds.write(0x44, 1);        // start conversion, with parasite power on at the end
  
//  delay(1000);     // maybe 750ms is enough, maybe not
  
  present = ds.reset();
  ds.select(addr);    
  ds.write(0xBE);         // Read Scratchpad

  for ( i = 0; i < 9; i++) {           // we need 9 bytes
    data[i] = ds.read();
  }

  int16_t raw = (data[1] << 8) | data[0];
  if (type_s) {
    raw = raw << 3; // 9 bit resolution default
    if (data[7] == 0x10) {
      raw = (raw & 0xFFF0) + 12 - data[6];
    }
  } else {
    byte cfg = (data[4] & 0x60);
    if (cfg == 0x00) raw = raw & ~7;  // 9 bit resolution, 93.75 ms
    else if (cfg == 0x20) raw = raw & ~3; // 10 bit res, 187.5 ms
    else if (cfg == 0x40) raw = raw & ~1; // 11 bit res, 375 ms
    //// default is 12 bit resolution, 750 ms conversion time
  }
  celsius = (float)raw / 16.0;
  fahrenheit = celsius * 1.8 + 32.0;
}

float getTemperature() {
  sampleTemperature();
  return fahrenheit;
}



void registerActuators() {
  for (int i = 0; i < NUM_DEVICES; i++) {
    pinMode(pumps[i], OUTPUT);
  }
}

void registerSensors() {
//  pinMode(PROXIMITY_FAR_SENS_PIN, INPUT);
//  pinMode(PROXIMITY_NEAR_SENS_PIN, INPUT);
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
void update(){}

void api_call(char prefix){
   switch (prefix) {
    case 'u': 
      update(); // no update logic here; placeholder
      findCommandEnd();
      break;
    case 'c':
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
    case 'n': 
      Serial.print("M: ");
      Serial.println(getNear());
      findCommandEnd();
      break;
    case 'f':
      Serial.print("G: "); 
      Serial.println(getFar());
      findCommandEnd();
      break;
    case 't':
      Serial.print("V: "); 
      Serial.println(getTemperature());
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
  Serial.println("I am the Aquarium!");
  Serial.print("Listening at ");
  Serial.print(BAUD);
  Serial.println(" baud.");
  Serial.print(NUM_DEVICES);
  Serial.println(" pumps enabled.");

  registerActuators();
  registerSensors();
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
//  Serial.print("NEAR: ");
//  Serial.print(getNear());
//  Serial.print("\tFAR: ");
//  Serial.print(getFar());
//  Serial.print("\tTEMP: ");
//  Serial.println(getTemperature());
}
