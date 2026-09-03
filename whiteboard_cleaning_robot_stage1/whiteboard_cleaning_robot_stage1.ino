/*
  물분필 칠판 청소 로봇 - 1단계
  시리얼 모니터로 모터 / 워터펌프 / 스펀지 롤러 동작 테스트

  보드: ESP32-WROOM-32E DevKitC
  모터드라이버: TB6612FNG (듀얼 H-브리지)
  구동모터: GM25-2530 DC 기어드모터 x2 (좌/우 무한궤도)
  워터펌프: 미니 워터펌프 385 (IRLZ44N MOSFET으로 ON/OFF 제어)
  스펀지 롤러: N20 모터 (PWM 속도 제어)

  시리얼 통신: 115200 baud
*/

// ---------------- 핀 정의 ----------------
// TB6612FNG - 좌측 모터 (A채널)
const int PIN_AIN1 = 26;
const int PIN_AIN2 = 27;
const int PIN_PWMA  = 14;

// TB6612FNG - 우측 모터 (B채널)
const int PIN_BIN1 = 25;
const int PIN_BIN2 = 33;
const int PIN_PWMB  = 32;

// TB6612FNG - 드라이버 활성화
const int PIN_STBY = 13;

// 워터펌프 (MOSFET 게이트)
const int PIN_PUMP = 4;

// 스펀지 롤러 (N20 모터)
const int PIN_ROLLER = 16;

// ---------------- 모터 방향 보정 ----------------
// 조립 후 실제 회전 방향이 반대이면 true 로 변경
const bool INVERT_LEFT  = false;
const bool INVERT_RIGHT = false;

// ---------------- LEDC(PWM) 설정 ----------------
const int PWM_FREQ = 1000;   // 1000Hz
const int PWM_RES  = 8;      // 8bit (0~255)

const int CH_LEFT   = 0; // 좌측 구동모터 채널
const int CH_RIGHT  = 1; // 우측 구동모터 채널
const int CH_ROLLER = 2; // 스펀지 롤러 채널

// ---------------- 상태 변수 ----------------
int driveSpeed = 180; // 기본 전후진 속도 (0~255)
int turnSpeed  = 150; // 기본 회전 속도 (0~255)

bool pumpOn   = false;
bool rollerOn = false;

char currentAction = 'x'; // 현재 주행 상태 표시용 (w/s/a/d/x)

// ---------------- 함수 선언 ----------------
void driveLeft(int speed);   // speed: -255 ~ 255 (부호로 방향 결정)
void driveRight(int speed);
void stopMotors();
void forward();
void backward();
void turnLeft();
void turnRight();
void togglePump();
void toggleRoller();
void motorDirectionTest();
void printStatus();
void printHelp();

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(PIN_AIN1, OUTPUT);
  pinMode(PIN_AIN2, OUTPUT);
  pinMode(PIN_BIN1, OUTPUT);
  pinMode(PIN_BIN2, OUTPUT);
  pinMode(PIN_STBY, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);

  // LEDC PWM 채널 설정 및 핀 연결
  ledcSetup(CH_LEFT, PWM_FREQ, PWM_RES);
  ledcSetup(CH_RIGHT, PWM_FREQ, PWM_RES);
  ledcSetup(CH_ROLLER, PWM_FREQ, PWM_RES);

  ledcAttachPin(PIN_PWMA, CH_LEFT);
  ledcAttachPin(PIN_PWMB, CH_RIGHT);
  ledcAttachPin(PIN_ROLLER, CH_ROLLER);

  digitalWrite(PIN_PUMP, LOW);
  digitalWrite(PIN_STBY, HIGH); // 드라이버 활성화

  stopMotors();

  printHelp();
  printStatus();
}

void loop() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();

    switch (cmd) {
      case 'w': forward();  break;
      case 's': backward(); break;
      case 'a': turnLeft(); break;
      case 'd': turnRight();break;
      case 'x': stopMotors();break;

      case 'p': togglePump();  break;
      case 'r': toggleRoller();break;

      case '+':
        driveSpeed = min(driveSpeed + 20, 255);
        turnSpeed  = min(turnSpeed + 20, 255);
        Serial.printf("[속도] 전후진=%d 회전=%d\n", driveSpeed, turnSpeed);
        // 주행 중이면 속도 변경을 즉시 반영
        if (currentAction != 'x') {
          switch (currentAction) {
            case 'w': forward();  break;
            case 's': backward(); break;
            case 'a': turnLeft(); break;
            case 'd': turnRight();break;
          }
        }
        break;

      case '-':
        driveSpeed = max(driveSpeed - 20, 0);
        turnSpeed  = max(turnSpeed - 20, 0);
        Serial.printf("[속도] 전후진=%d 회전=%d\n", driveSpeed, turnSpeed);
        if (currentAction != 'x') {
          switch (currentAction) {
            case 'w': forward();  break;
            case 's': backward(); break;
            case 'a': turnLeft(); break;
            case 'd': turnRight();break;
          }
        }
        break;

      case 't': motorDirectionTest(); break;
      case 'i': printStatus(); break;
      case 'h': printHelp(); break;

      // 개행 문자 등은 무시
      case '\n':
      case '\r':
        break;

      default:
        Serial.printf("[알수없음] '%c' - h 를 눌러 도움말 확인\n", cmd);
        break;
    }
  }
}

// ---------------- 모터 저수준 제어 ----------------
// speed: -255(최대 후진) ~ 255(최대 전진)
void driveLeft(int speed) {
  if (INVERT_LEFT) speed = -speed;
  speed = constrain(speed, -255, 255);

  if (speed > 0) {
    digitalWrite(PIN_AIN1, HIGH);
    digitalWrite(PIN_AIN2, LOW);
  } else if (speed < 0) {
    digitalWrite(PIN_AIN1, LOW);
    digitalWrite(PIN_AIN2, HIGH);
  } else {
    digitalWrite(PIN_AIN1, LOW);
    digitalWrite(PIN_AIN2, LOW);
  }
  ledcWrite(CH_LEFT, abs(speed));
}

void driveRight(int speed) {
  if (INVERT_RIGHT) speed = -speed;
  speed = constrain(speed, -255, 255);

  if (speed > 0) {
    digitalWrite(PIN_BIN1, HIGH);
    digitalWrite(PIN_BIN2, LOW);
  } else if (speed < 0) {
    digitalWrite(PIN_BIN1, LOW);
    digitalWrite(PIN_BIN2, HIGH);
  } else {
    digitalWrite(PIN_BIN1, LOW);
    digitalWrite(PIN_BIN2, LOW);
  }
  ledcWrite(CH_RIGHT, abs(speed));
}

void stopMotors() {
  driveLeft(0);
  driveRight(0);
  currentAction = 'x';
  Serial.println("[정지]");
}

void forward() {
  driveLeft(driveSpeed);
  driveRight(driveSpeed);
  currentAction = 'w';
  Serial.println("[전진]");
}

void backward() {
  driveLeft(-driveSpeed);
  driveRight(-driveSpeed);
  currentAction = 's';
  Serial.println("[후진]");
}

void turnLeft() {
  driveLeft(-turnSpeed);
  driveRight(turnSpeed);
  currentAction = 'a';
  Serial.println("[좌회전]");
}

void turnRight() {
  driveLeft(turnSpeed);
  driveRight(-turnSpeed);
  currentAction = 'd';
  Serial.println("[우회전]");
}

// ---------------- 청소부 제어 ----------------
void togglePump() {
  pumpOn = !pumpOn;
  digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
  Serial.printf("[워터펌프] %s\n", pumpOn ? "ON" : "OFF");
}

void toggleRoller() {
  rollerOn = !rollerOn;
  ledcWrite(CH_ROLLER, rollerOn ? driveSpeed : 0);
  Serial.printf("[스펀지 롤러] %s\n", rollerOn ? "ON" : "OFF");
}

// ---------------- 테스트 / 상태 출력 ----------------
// 좌/우 모터를 순서대로 짧게 구동해 배선 극성(정방향 여부)을 확인한다.
void motorDirectionTest() {
  Serial.println("[모터 개별 방향 테스트 시작]");

  Serial.println(" - 좌측 모터 정방향");
  driveLeft(driveSpeed);
  delay(800);
  driveLeft(0);
  delay(300);

  Serial.println(" - 좌측 모터 역방향");
  driveLeft(-driveSpeed);
  delay(800);
  driveLeft(0);
  delay(300);

  Serial.println(" - 우측 모터 정방향");
  driveRight(driveSpeed);
  delay(800);
  driveRight(0);
  delay(300);

  Serial.println(" - 우측 모터 역방향");
  driveRight(-driveSpeed);
  delay(800);
  driveRight(0);

  currentAction = 'x';
  Serial.println("[모터 개별 방향 테스트 종료] 실제 회전 방향이 반대라면 INVERT_LEFT / INVERT_RIGHT 값을 수정하세요.");
}

void printStatus() {
  Serial.println("========== 현재 상태 ==========");
  Serial.printf("주행 상태   : %c\n", currentAction);
  Serial.printf("전후진 속도 : %d / 255\n", driveSpeed);
  Serial.printf("회전 속도   : %d / 255\n", turnSpeed);
  Serial.printf("워터펌프    : %s\n", pumpOn ? "ON" : "OFF");
  Serial.printf("스펀지 롤러 : %s\n", rollerOn ? "ON" : "OFF");
  Serial.printf("INVERT_LEFT=%d, INVERT_RIGHT=%d\n", INVERT_LEFT, INVERT_RIGHT);
  Serial.println("================================");
}

void printHelp() {
  Serial.println("========== 시리얼 명령어 (1단계) ==========");
  Serial.println("w : 전진");
  Serial.println("s : 후진");
  Serial.println("a : 좌회전");
  Serial.println("d : 우회전");
  Serial.println("x : 정지");
  Serial.println("p : 워터펌프 ON/OFF");
  Serial.println("r : 스펀지 롤러 ON/OFF");
  Serial.println("+ : 속도 +20");
  Serial.println("- : 속도 -20");
  Serial.println("t : 모터 개별 방향 테스트");
  Serial.println("i : 현재 상태 출력");
  Serial.println("h : 도움말");
  Serial.println("============================================");
}
