#include <FastGPIO.h>
#define APA102_USE_FAST_GPIO
#include <APA102.h>

// Initialize ledStrip obkect
const uint8_t dataPin = 11;
const uint8_t clockPin = 12;
APA102<dataPin, clockPin> ledStrip;

// Initialize led array
const uint16_t ledCount = 4;
rgb_color colors[ledCount];

// Utility functions
void write_gradient(void);
void set_ith(int, uint8_t, uint8_t, uint8_t);
void set_all_off(void);

void setup() {
  set_all_off();
  set_ith(ledCount - 1, 255, 255, 255);
}

void loop() {
  // put your main code here, to run repeatedly:
//  write_gradient();
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

