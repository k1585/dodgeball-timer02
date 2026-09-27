/* 이 환경은 HTTPS가 검사 프록시를 거쳐서, 브라우저가 gstatic의 인증서를
   신뢰하지 못한다(제품 코드 문제가 아님). 그래서 테스트할 때만
   파이어베이스 SDK 요청을 미리 받아둔 로컬 사본으로 대신 채워 준다.
   Firestore/Auth 서버와의 실제 통신은 그대로 진짜 서버로 나간다. */
const path = require('path');
const SDK = path.join(__dirname, 'fbsdk');

/* 검사를 막는 두 가지를 치워 준다. 진짜 사용자에게는 맞는 동작이지만
   화면을 덮어 아무것도 못 누르게 하기 때문이다.
     - 처음 쓰는 사람을 위한 안내(손전등)  → 안내를 보는 e2e12 만 { tour:true }
     - 관리자 공지 팝업                  → 공지를 보는 e2e13
   둘을 한 덩어리로 묶었더니, 안내를 보려고 tour 를 켠 검사가 공지 팝업에
   막히는 일이 있었다. 따로 켜고 끈다.
   검사 중간에만 잠깐 놔두고 싶을 때는 페이지에서
   window.__keepTour / window.__keepSys 를 켜면 된다. */
async function useLocalSdk(ctx, opts) {
  const keepTour = !!(opts && opts.tour);
  const keepSys = !!(opts && opts.sys);
  await ctx.addInitScript(([kt, ks]) => {
    /* 안내는 '뜨면 닫는다'만으로는 모자랐다. 비밀번호 정하는 창이 떠 있으면
       안내가 30초까지 기다렸다가 뒤늦게 시작하는데, 그때 검사가 보고 있던
       화면을 안내가 다른 데로 넘겨 버린다(실제로 e2e11 이 그래서 깨졌다).
       그래서 아예 시작하지 못하게 막고, 혹시 떠 있으면 닫기도 한다. */
    setInterval(() => {
      if (!kt && !window.__keepTour) {
        if (typeof window.startTour === 'function' && !window.startTour.__off) {
          window.startTour = function () {};
          window.startTour.__off = true;
        }
        const l = document.getElementById('tourLay');
        if (l && l.classList.contains('show') && typeof endTour === 'function') endTour(true);
      }
      if (!ks && !window.__keepSys) {
        const m = document.getElementById('sysPopupModal');
        if (m && m.classList.contains('show') && typeof closeSysPopup === 'function') closeSysPopup();
      }
    }, 100);
  }, [keepTour, keepSys]);
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
