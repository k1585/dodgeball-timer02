/* 오늘의 숙제 — 로그인 계정을 전부 지운다.
 *
 * 파이어베이스는 비밀번호를 되돌릴 수 없게 보관하므로, 계정 목록을 보거나
 * 남의 계정을 지우려면 '관리자 자격'이 필요하다. 앱에 박혀 있는 공개 키로는
 * 자기 자신만 건드릴 수 있어서, 이 일은 반드시 프로젝트 주인이 해야 한다.
 * 클라우드 셸에서 돌리면 로그인한 사람의 자격을 그대로 빌려 쓴다.
 *
 * 쓰는 법:  node delete-all-users.js --yes
 */
const PROJECT = "today-homework";

/* 안전장치를 맨 앞에 둔다. 아래에서 모듈을 먼저 불러오면, 준비가 덜 됐을 때
   안내 대신 "모듈을 찾을 수 없다"는 오류만 보게 된다. */
if (!process.argv.includes("--yes")) {
  console.log("");
  console.log("  이 도구는 " + PROJECT + " 의 로그인 계정을 '전부' 지웁니다.");
  console.log("  선생님 계정도 함께 사라지고, 되돌릴 수 없습니다.");
  console.log("");
  console.log("  정말 지우려면 뒤에 --yes 를 붙여 다시 실행하세요:");
  console.log("      node delete-all-users.js --yes");
  console.log("");
  process.exit(1);
}

const admin = require("firebase-admin");
admin.initializeApp({ projectId: PROJECT });

(async () => {
  const auth = admin.auth();
  let total = 0;

  /* 한 번에 1000개까지 지울 수 있다. 목록이 빌 때까지 되풀이한다.
     지우고 나면 목록이 줄어들므로 매번 처음부터 다시 받아 온다. */
  for (let round = 1; ; round++) {
    const page = await auth.listUsers(1000);
    if (page.users.length === 0) break;

    const uids = page.users.map((u) => u.uid);
    const result = await auth.deleteUsers(uids);
    total += result.successCount;

    console.log(
      `  ${round}차: ${result.successCount}개 지움` +
      (result.failureCount ? ` (실패 ${result.failureCount}개)` : "")
    );

    if (result.failureCount > 0) {
      result.errors.slice(0, 3).forEach((e) =>
        console.log("    실패 사유:", e.error.message));
    }
    /* 한 번에 하나도 못 지웠으면 더 돌려도 소용없다 */
    if (result.successCount === 0) break;
  }

  console.log("");
  console.log(`  끝났습니다. 모두 ${total}개의 계정을 지웠습니다.`);
  console.log("");
  process.exit(0);
})().catch((e) => {
  console.error("");
  console.error("  문제가 생겼습니다:", e && e.message);
  if (String(e && e.message).indexOf("credential") >= 0 ||
      String(e && e.code).indexOf("credential") >= 0) {
    console.error("");
    console.error("  자격 증명을 찾지 못한 것 같습니다. 이 줄을 먼저 실행해 보세요:");
    console.error("      gcloud auth application-default login");
  }
  console.error("");
  process.exit(1);
});
