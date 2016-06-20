#include <FastGPIO.h>
#define APA102_USE_FAST_GPIO
#include <APA102.h>
#include <SoftwareSerial.h>

// Initialize ledStrip obkect
const uint8_t dataPin = 11;
const uint8_t clockPin = 12;
APA102<dataPin, clockPin> ledStrip;

// Initialize led array
const uint16_t ledCount = 4;
rgb_color colors[ledCount];

// Communication functions
void read_command(void);

// Utility functions
void write_gradient(void);
void set_ith(int, uint8_t, uint8_t, uint8_t);
void set_all_off(void);
void set_lights_initialize(void);

// Add software serial for debugging
// SoftwareSerial mySerial(5, 6); // RX, TX

void setup() {
  // Serial overhead

  // Spin lock to wait for Serial
  while (!Serial);
  
  Serial.begin(9600);
  Serial.println("I am the hardware serial");
  Serial.print(">>> ");
  
  set_all_off();
  set_lights_initialize();
}

void loop() {
  // put your main code here, to run repeatedly:
//  write_gradient();
//  if (Serial.available() > 0) {
//    read_command();
//    Serial.print("\n>>> ");
//  }
  char prefix = 0;
  uint16_t id = 0;
  uint8_t r, g, b = 0;
  while (Serial.available() > 0) {
    prefix = Serial.read();
    Serial.println(prefix);
    if(prefix != 'c') break;
    Serial.println("parsing...");
    id = Serial.parseInt();
    r = Serial.parseInt();
    g = Serial.parseInt();
    b = Serial.parseInt();

    if(Serial.read() == '\n'){
//       strip.setPixelColor(id, r, g, b);
//       strip.show();
      set_ith(id, r, g, b);
    }
    else {
      set_ith(0, 255, 0, 0);
      break;
    }
  }  
}

void read_command() {
  int curr_led = 0;
  int inc_byte;
  while (Serial.available() > 0) {
    delay(10);
    inc_byte = Serial.read();
     Serial.print("I received: ");
     Serial.println(inc_byte, DEC);
     switch (inc_byte) {
       case 114:
         // 'r' == red
         set_ith(curr_led++, 255, 0, 0);
         break;
       case 103:
         // 'g' == green
         set_ith(curr_led++, 0, 255, 0);
         break;
       case 98:
         // 'b' == blue
         set_ith(curr_led++, 0, 0, 255);
         break;
       case 119:
         // 'w' == white
         set_ith(curr_led++, 255, 255, 255);
         break;
       case 107:
         // 'k' == black
         set_ith(curr_led++, 0, 0, 0);
         break;
       default:
         break;
     }
  }
}

void write_gradient() {
  uint8_t time = millis() >> 2;
  for(uint16_t i = 0; i < ledCount; i++)
  {
    uint8_t x = time - i * 8;
    colors[i].red = x;
    colors[i].green = 255 - x;
    colors[i].blue = x;
  }
  ledStrip.write(colors, ledCount, 31);
}

void set_ith(int i, uint8_t r, uint8_t g, uint8_t b) {
  colors[i].red = r;
  colors[i].green = g;
  colors[i].blue = b;
  ledStrip.write(colors, ledCount, 31);
}

void set_all_off() {
  for(uint16_t i = 0; i < ledCount; i++) {
    colors[i].red = 0;
    colors[i].green = 0;
    colors[i].blue = 0;
  }
  ledStrip.write(colors, ledCount, 31);
}

void set_lights_initialize() {
  for (uint16_t i = 0; i < ledCount; i++) {
    set_ith(i, 255, 255, 255);
    delay(200);
    set_ith(i, 0, 0, 0);
  }
}

