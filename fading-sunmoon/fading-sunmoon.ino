#include <Adafruit_DotStar.h>
// Because conditional #includes don't work w/Arduino sketches...
//#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET

#define NUMPIXELS 25 // Number of LEDs in strip

// Here's how to control the LEDs from any two pins:
#define DATAPIN    3
#define CLOCKPIN   4 
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);

//brightness control
float t = 0;
int x = 0;

uint32_t yellow = 0xe5e619;
uint32_t white = 0xffffff;
uint32_t orange = 0xe65e19;
uint32_t dark_blue = 0x195de6;
uint32_t light_blue = 0x19a1e6;

int sunIndices[] = {
  23, 24, //white
  14, 15, 16, 17, 18, 19, // yellow
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 // orange
};

int moonIndices[] = {
  11, 12, 13, // light_blue
  20, 21, 22 // dark_blue
};

void setup() {

  Serial.begin(9600);
  Serial.println("fading sunmoon.");
#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000L)
  clock_prescale_set(clock_div_1); // Enable 16 MHz on Trinket
#endif
  strip.begin(); // Initialize pins for output
  //strip.show();  // Turn all LEDs off ASAP

  setMoon();
  fadeIn();
  delay(5000);
  turnOffMoon();

  setSun();
  fadeIn();
  delay(5000);
  turnOffSun();

  setMoon();
  setSun();
  fadeIn();
  delay(5000);
  //turnOffMoon();
  //turnOffSun();
}

void fadeIn() {
  float t = 0;
  for (int x = 0; x < 100; x += 1) {
    t += 0.01;
    strip.setBrightness(pow(t, 3) * 100);
    strip.show();
    delay(x);
  }
  Serial.println("Faded in...");
}

void fadeOut() {
  float t = 0;
  for (int x = 0; x < 100; x += 1) {
    t += 0.01;
    strip.setBrightness(255 - (pow(t, 3) * 100));
    strip.show();
    delay(x);
  }
  Serial.println("Faded out...");
}

void turnOffMoon() {
  int moonSize = sizeof(moonIndices) / sizeof(int);
  for (int i = 0; i < moonSize; i++) {
    strip.setPixelColor(moonIndices[i], 0);
  }
  strip.show();
  Serial.println("Turned off moon");
}

void turnOffSun() {
  int sunSize = sizeof(sunIndices) / sizeof(int);
  for (int i = 0; i < sunSize; i++) {
    strip.setPixelColor(sunIndices[i], 0);
  }
  strip.show();
  Serial.println("Turned off sun");
}

void setMoon() {
  strip.setPixelColor(20,dark_blue);
  strip.setPixelColor(12,light_blue);
  strip.setPixelColor(13,light_blue);
  strip.setPixelColor(11,light_blue);
  strip.setPixelColor(22,dark_blue);
  strip.setPixelColor(21,dark_blue);
}

void setSun() {
  strip.setPixelColor(16,yellow);
  strip.setPixelColor(17,yellow);
  strip.setPixelColor(18,yellow);
  strip.setPixelColor(19,yellow);
  strip.setPixelColor(15,yellow);
  strip.setPixelColor(14,yellow);
  strip.setPixelColor(23,white);
  
  strip.setPixelColor(0,orange);
  strip.setPixelColor(1,orange);
  strip.setPixelColor(2,orange);
  strip.setPixelColor(4,orange);
  strip.setPixelColor(3,orange);
  strip.setPixelColor(6,orange);
  strip.setPixelColor(5,orange);
  strip.setPixelColor(7,orange);
  strip.setPixelColor(8,orange);
  strip.setPixelColor(9,orange);

  strip.setPixelColor(10,orange);
  strip.setPixelColor(24,white);
}

int delay_time = 100;
void loop() {
  Serial.println("looping");
  strip.show();
}
