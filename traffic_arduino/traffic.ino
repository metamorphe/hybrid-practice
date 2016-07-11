#include <Adafruit_MPR121.h>
// line 59 0x10 changed to 0x3F
#include <Adafruit_DotStar.h>
#include <SPI.h>
#define NUMPIXELS 3 
#define DATAPIN    4
#define CLOCKPIN   5
int B_THRESH;
int F_THRESH;
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);
Adafruit_MPR121 cap = Adafruit_MPR121();

void setup() {
  
  #if defined(__AVR_ATtiny85__) && (F_CPU == 16000000L)
    clock_prescale_set(clock_div_1); // Enable 16 MHz on Trinket
  #endif

  while (!Serial);

  Serial.begin(9600);

  pinMode(13, OUTPUT);
  cap.begin(0x5A);
  check_baseline();
  Serial.println(B_THRESH);
  delay(1000);
  check_filtered();
  Serial.println(F_THRESH);
  delay(1000);
  cap.setThreshholds(F_THRESH - B_THRESH, 6);
  
  Serial.println("m, I am the traffic light");
  strip.begin(); // Initialize pins for output
  strip.show();  // Turn all LEDs off ASAP
  strip.setPixelColor(0, 0, 0, 0);
  strip.setPixelColor(1, 0, 0, 0);
  strip.setPixelColor(2, 0, 0, 0);

  strip.show();
}

// This requires about 200 mA for all the 'on' pixels + 1 mA per 'off' pixel.
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;
char prefix = 0;

void loop() {
  uint8_t currtouched = cap.touched();
  String srl = "s";

  for (uint8_t i=0; i<3; i++) {
    srl = "s, ";
    srl = srl + i + ", ";
    if (i==0) {
      if (strip.getPixelColor(i)!=0) {
        srl = srl + '0';
        r = 0;
        g = 0;
        b = 0;
      } else {
        srl = srl + '1';
        r = 0;
        g = 255;
        b = 0;
      }
    }
    if (i==1) {
      if (strip.getPixelColor(i)!=0) {
        srl = srl + '0';
        r = 0;
        g = 0;
        b = 0;
      } else {
        srl = srl + '1';
        r = 255;
        g = 255;
        b = 0;
      }
    }
    if (i==2) {
      if (strip.getPixelColor(i)!=0) {
        srl = srl + '0';
        r = 0;
        g = 0;
        b = 0;
      } else {
        srl = srl + '1';
        r = 255;
        g = 0;
        b = 0;
      }
    }
    
    if (currtouched & (1 << i)) {
      strip.setPixelColor(i, r, g, b);
      srl = srl + '\n';
      Serial.print(srl);
    }

    strip.show();
    delay(100);
  }
  
  // while (Serial.available() > 0) {
  //   prefix = Serial.read();
  //   if(prefix != 'c') break;
  //     id = Serial.parseInt();
  //     r = Serial.parseInt();
  //     g = Serial.parseInt();
  //     b = Serial.parseInt();
   
  //   if(Serial.read() == '\n'){
  //      Serial.print("Changing");
  //      Serial.print(id);
  //        Serial.print(",");
  //      Serial.print(r);
  //        Serial.print(",");
  //      Serial.print(g);
  //        Serial.print(",");
  //      Serial.println(b);
       
  //      strip.setPixelColor(id, r, g, b);
  //      strip.show();
  //   }
  //   else{
  //     break;
  //   } 
  // }
}

int check_baseline() {
  Serial.println("m, check baseline");
  // LED blinks twice to indicate setting low threshold
  blink(2);
  delay(1000);
  
  int a = 5, b = 5;
  int avg;
  while (a != 0) {
    int sample = cap.baselineData(1);
    avg += sample;
    a --;
    blink(1);
    delay(1000);
  }
  B_THRESH = avg / b;

  Serial.print("m, ");
  Serial.println(B_THRESH);
}

int check_filtered() {
  Serial.println("m, check filtered");
  // LED blinks thrice to indicate setting hi threshold
  blink(3);
  delay(1000);

  int a = 5, b = 5;
  int avg;
  while (a != 0) {
    digitalWrite(13, HIGH);
    avg += cap.filteredData(1);
    digitalWrite(13, LOW);
    a --;
    delay(1000);
  }
  F_THRESH = avg / b;

  Serial.print("m, ");
  Serial.println(F_THRESH);
}

void blink(int x) {
  while (x != 0) {
    digitalWrite(13, HIGH);
    delay(350);
    digitalWrite(13, LOW);
    delay(150);
    x -= 1;
  }
}
