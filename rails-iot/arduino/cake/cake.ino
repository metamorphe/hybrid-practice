#include <HSBColor.h>
#include <Adafruit_NeoPixel.h>
#include <SPI.h>  
#define DEBUG 0
#define BAUD 19200

//******************** DEVICE DEFINITIONS *************************//
//ENCODER
#define ENCODER_PIN_A 2 // MUST BE 2
#define ENCODER_PIN_B 3 // MUST BE 3
#define ENCODER_BUTTON_PIN 4


// LUMINAIRES
#define CAKE_PIXELS 36 // Number of LEDs in strip
#define CAKE_PIN 9

//********************* Luminaires *************************//

Adafruit_NeoPixel cake = Adafruit_NeoPixel(CAKE_PIXELS, CAKE_PIN, NEO_GRB + NEO_KHZ800);
  

//********************* Rotary Encoder *************************//
// From bildr article: http://bildr.org/2012/08/rotary-encoder-arduino/
// datasheet: http://cdn.sparkfun.com/datasheets/Components/Switches/EC12PLRGBSDVBF-D-25K-24-24C-6108-6HSPEC.pdf
// Sparkfun product info: https://www.sparkfun.com/products/10982

//these pins can not be changed 2/3 are special pins
int encoderPin1 = ENCODER_PIN_A;
int encoderPin2 = ENCODER_PIN_B;
const int button = ENCODER_BUTTON_PIN;

volatile int lastEncoded = 0;
volatile long encoderValue = 0;
long lastencoderValue = 0;

int lastMSB = 0;
int lastLSB = 0;




//***************** SETUP AND INITIALIZATION *********************//



void setup() {
  Serial.begin (BAUD);
  Serial.println("Cake API");
  initDevices();
}


void initDevices(){
  // EARRINGS
    cake.begin();
    cake.show();
    
  // BUTTON
    pinMode(button, INPUT);
    digitalWrite(button, LOW);

 
  // ENCODER
    pinMode(encoderPin1, INPUT); 
    pinMode(encoderPin2, INPUT);

    digitalWrite(encoderPin1, HIGH); //turn pullup resistor on
    digitalWrite(encoderPin2, HIGH); //turn pullup resistor on

    //call updateEncoder() when any high/low changed seen
    //on interrupt 0 (pin 2), or interrupt 1 (pin 3) 
    attachInterrupt(0, updateEncoder, CHANGE); 
    attachInterrupt(1, updateEncoder, CHANGE);
}


//********************* SENSING ROUTINES *************************//

// SENSING VARIABLES
int buttonVal = 0; 
int prevVal = 0; 
bool buttonPressed = false;


void sense(){
  buttonVal = digitalRead(button);
  updateEncoder();
  if (buttonVal != prevVal){
    buttonPressed = true;
    prevVal = buttonVal;
  }
  else{
    buttonPressed = false;
  }
  if(DEBUG){
    Serial.print("Encoder:");
    Serial.println(encoderValue);
    Serial.print("Button Pressed: ");
    Serial.println(buttonPressed);
  }
}

void updateEncoder(){
  int MSB = digitalRead(encoderPin1); //MSB = most significant bit
  int LSB = digitalRead(encoderPin2); //LSB = least significant bit

  int encoded = (MSB << 1) | LSB; //converting the 2 pin value to single number
  int sum  = (lastEncoded << 2) | encoded; //adding it to the previous encoded value


  if(sum == 0b1101 || sum == 0b0100 || sum == 0b0010 || sum == 0b1011) encoderValue ++;
  if(sum == 0b1110 || sum == 0b0111 || sum == 0b0001 || sum == 0b1000) encoderValue --;

  lastEncoded = encoded; //store this value for next time
}


//********************* LOGIC ROUTINES *************************//



//********************* API *************************//

// API PROCESSING
char prefix = 0;
char buffer = ' ';

void findCommandEnd(){
  buffer = ' ';
  while(buffer != '\n'){
    if(Serial.available() > 0){
      buffer = Serial.read();
    } 
  }
}




void update() {
  cake.show();
}
int devID = 0;
int id = 0;
int r = 0;
int g = 0;
int b = 0;
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
  cake.setPixelColor(id, r, g, b);
}
void api_call(char prefix){
   switch (prefix) {
    case 'u': 
      if(DEBUG){
        Serial.println("Update");
      }
      update();
      findCommandEnd();
      break;
    case 'c': 
      color_change();
      findCommandEnd();
      break;
    case 's':
      sense();
      findCommandEnd();
      Serial.print("R: ");
      Serial.println(encoderValue);
      break;
    case 'b':
      sense();
      findCommandEnd();
      Serial.print("A: ");
      Serial.println(1 - buttonVal);
      break;
    default: 
      Serial.print(prefix);
      Serial.println("API command does not exist");
      findCommandEnd(); 
    break;
  }
}



void enable_api(){
  if (Serial.available() > 0) {
      prefix = Serial.read();
      api_call(prefix);
  }
}

void loop() {
  enable_api(); // always on
}

