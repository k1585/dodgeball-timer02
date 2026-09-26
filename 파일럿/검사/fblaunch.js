/* 이 환경은 HTTPS가 검사 프록시를 거쳐서, 브라우저가 gstatic의 인증서를
   신뢰하지 못한다(제품 코드 문제가 아님). 그래서 테스트할 때만
   파이어베이스 SDK 요청을 미리 받아둔 로컬 사본으로 대신 채워 준다.
   Firestore/Auth 서버와의 실제 통신은 그대로 진짜 서버로 나간다. */
const path = require('path');
const SDK = path.join(__dirname, 'fbsdk');

async function useLocalSdk(ctx) {
  await ctx.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const name = route.request().url().split('/').pop();
    route.fulfill({
      status: 200,
      contentType: 'text/javascript; charset=utf-8',
      path: path.join(SDK, name),
    });
  });
}

module.exports = {
  exe: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
  base: 'http://localhost:8777/%EC%98%A4%EB%8A%98%EC%9D%98%EC%88%99%EC%A0%9C.html',
  useLocalSdk,
};
