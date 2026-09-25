/* 오늘의 숙제 — 계정 하나의 비밀번호를 새로 정한다.
 *
 * 파이어베이스 콘솔에는 '비밀번호 재설정 메일 보내기'만 있고, 비밀번호를
 * 직접 넣는 자리가 없다. 그런데 이 앱의 계정 주소(@todayhw.app)는 메일이
 * 갈 수 없는 가짜 주소라 그 메일은 아무 데도 도착하지 않는다.
 *
 * 관리자 자격으로는 로그인 없이 비밀번호를 바로 바꿀 수 있다.
 * 클라우드 셸에서 돌리면 로그인한 사람의 자격을 그대로 빌려 쓴다.
 *
 * 쓰는 법:
 *   node set-password.js 657b7q7 새비밀번호123!
 *   node set-password.js 657b7q7@todayhw.app 새비밀번호123!
 */
const PROJECT = "today-homework";
const DOMAIN = "todayhw.app";

const [, , rawId, newPw] = process.argv;

if (!rawId || !newPw) {
  console.log("");
  console.log("  쓰는 법:  node set-password.js <아이디> <새 비밀번호>");
  console.log("");
  console.log("  예)  node set-password.js 657b7q7 Junho2026!");
  console.log("");
  console.log("  아이디는 앱의 반 관리 > 학생 명단에서 볼 수 있습니다.");
  console.log("  선생님 계정은 콘솔 > Authentication > Users 의 주소를 그대로 넣으세요.");
  console.log("");
  process.exit(1);
}

if (newPw.length < 6) {
  console.log("\n  비밀번호는 6자 이상이어야 합니다.\n");
  process.exit(1);
}

const email = rawId.indexOf("@") >= 0 ? rawId : rawId + "@" + DOMAIN;
const admin = require("firebase-admin");
admin.initializeApp({ projectId: PROJECT });

(async () => {
  const auth = admin.auth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    console.error("\n  그런 계정이 없습니다: " + email + "\n");
    process.exit(1);
  }
  await auth.updateUser(user.uid, { password: newPw });
  console.log("");
  console.log("  바꿨습니다.");
  console.log("    계정   : " + email);
  console.log("    비밀번호: " + newPw);
  console.log("");
  console.log("  이 비밀번호를 본인에게 알려주세요.");
  console.log("");
  process.exit(0);
})().catch((e) => {
  console.error("\n  문제가 생겼습니다:", e && e.message);
  if (String((e && e.message) || "").indexOf("credential") >= 0) {
    console.error("\n  먼저 이 줄을 실행해 보세요:");
    console.error("      gcloud auth application-default login");
  }
  console.error("");
  process.exit(1);
});
