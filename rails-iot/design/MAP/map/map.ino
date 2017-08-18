#include <Adafruit_DotStar.h>
// Because conditional #includes don't work w/Arduino sketches...
#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
//#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET

#define NUMPIXELS 16 // Number of LEDs in strip
#define NUMPIXELS2 3 // Number of LEDs in strip

// Here's how to control the LEDs from any two pins:
#define DATAPIN    3
#define CLOCKPIN   4 
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);

Adafruit_DotStar captouch = Adafruit_DotStar(
  NUMPIXELS2, 5, 7, DOTSTAR_BGR);
//7 is clock
void setup() {
//
//#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000L)
//  clock_prescale_set(clock_div_1); // Enable 16 MHz on Trinket
//#endif
  Serial.begin(9600);
  captouch.begin();
  captouch.show();
  strip.begin(); // Initialize pins for output
  strip.show();  // Turn all LEDs off ASAP
  strip.setPixelColor(11,0x3b19e6);
  strip.setPixelColor(12,0xe61919);
  strip.setPixelColor(3,0x19e5e6);
  strip.setPixelColor(4,0xe6a219);
  strip.setPixelColor(5,0x19e680);
  strip.setPixelColor(6,0xe61919);
  strip.setPixelColor(14,0xe5e619);
  strip.setPixelColor(2,0xe619a1);
  strip.setPixelColor(8,0xffffff);
  strip.setPixelColor(7,0x19e65d);
  strip.setPixelColor(10,0xe6a219);
  strip.setPixelColor(9,0xffffff);
  strip.setPixelColor(15,0x19e6a2);
  strip.setPixelColor(1,0x19e65d);
  strip.setPixelColor(0,0xe5e619);
  strip.setPixelColor(13,0xe63b19);

  captouch.setPixelColor(0, 0x19e65d);
  captouch.setPixelColor(1, 0xe619a1);
  captouch.setPixelColor(2, 0xFFFFFF);
}

void activateCLED(int id, uint32_t c){
  for(int i = 0; i < NUMPIXELS; i++){
    captouch.setPixelColor(i,0x000000);
  }
  captouch.setPixelColor(id, c);
}
void activateLED(int id, uint32_t c){
  for(int i = 0; i < NUMPIXELS; i++){
    strip.setPixelColor(i,0x000000);
  }
  strip.setPixelColor(id, c);
}
void activateLED2(int id,  uint32_t c, int id2, uint32_t c2){
  // for(int i = 0; i < NUMPIXELS; i++){
  //   strip.setPixelColor(i,0x000000);
  // }
  strip.setPixelColor(id, c);
  strip.setPixelColor(id2, c2);
  strip.show();
}
void off(){
  for(int i = 0; i < NUMPIXELS; i++){
    strip.setPixelColor(i,0x000000);
  }
}
void activatePath(){
  // 1st set
  int path_delay = 700;
  
  off();
  activateLED2(8,0xffffff, 14,0xe5e619);
  delay(path_delay);
  
  off();
  activateLED2(14,0xe5e619, 15,0x19e6a2);
  delay(path_delay);
  
  off();
  activateLED2(12,0xe61919, 11,0x3b19e6);
  delay(path_delay);
  
  off();
  activateLED2(12,0xe61919, 1,0x19e65d);  
  delay(path_delay);
  
}

//ACTIVATE GREEN
void button1(){
  activateLED(7,0x19e65d); // green
  strip.show();
  activateLED(7,0x19e65d); // green
  strip.show();
}
void button2(){
   activateLED(2,0xe619a1); // pink
   strip.show();
   activateLED(2,0xe619a1); // pink
   strip.show();
}
void button3(){
  activatePath(); 
  delay(100);
  strip.show();
 
//  activatePath(); 
//  delay(100);
//  strip.show();
}
int incomingByte = 0;
void loop() {
  strip.show();
  Serial.println("I am on");
  if (Serial.available() > 0) {
      // read the incoming byte:
      incomingByte = Serial.read();
      Serial.print("I got" );
      Serial.println(incomingByte);
      if(incomingByte == 0 || incomingByte == 48){
       off();
       strip.show();
       captouch.show();
        
      }
      else if(incomingByte == 1 || incomingByte == 49){
         
        button1();
        activateCLED(0, 0x19e65d);
        captouch.show();
        activateCLED(0, 0x19e65d);
        captouch.show();
          
      }
      else if(incomingByte == 2 || incomingByte == 50){
        button2();
        activateCLED(1, 0xe619a1);
        captouch.show();
        
        activateCLED(1, 0xe619a1);
        captouch.show();

        
      }
      else if(incomingByte == 3 || incomingByte == 51){
        activateCLED(2, 0xFFFFFF);
        captouch.show();
        activateCLED(2, 0xFFFFFF);
        captouch.show();
         button1();
         button3();
         button2();
      }
   }
   delay(5);              // wait for a second
}
