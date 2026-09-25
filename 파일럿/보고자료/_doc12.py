# -*- coding: utf-8 -*-
"""운영 인수인계 — 운영자가 실제로 하는 일"""
from _문서만들기 import page

BODY = """
<div class="warn">
  이 문서는 <b>운영자(앱을 관리하는 사람)</b>용입니다.
  선생님·학생은 보지 않으셔도 됩니다.
</div>

<h2>1. 기본 정보</h2>
<table>
  <tr><th style="width:170px;">항목</th><th>값</th></tr>
  <tr><td>앱 주소</td><td><code>https://today-homework.web.app</code></td></tr>
  <tr><td>파이어베이스 프로젝트</td><td><code>today-homework</code></td></tr>
  <tr><td>서버 위치</td><td><code>asia-northeast3</code> (서울)</td></tr>
  <tr><td>요금제</td><td>Spark (무료)</td></tr>
  <tr><td>소스</td><td><code>오늘의숙제.html</code> 한 개. <code>index.html</code>,
      <code>deploy/public/index.html</code> 과 항상 같은 내용이어야 합니다</td></tr>
</table>

<h2>2. 새 내용 올리기 (배포)</h2>
<div class="cmd">cd ~/dodgeball-timer02 && git pull
cd deploy && firebase deploy --only hosting --project today-homework</div>
<p class="sub">배포하면 바로 반영됩니다. 캐시를 끄는 설정이 들어 있어
학생들이 새로고침하지 않아도 최신 화면을 봅니다.</p>

<h2>3. 보안 규칙 올리기</h2>
<p>규칙을 고쳤을 때만 합니다. 콘솔 &gt; Firestore Database &gt; 규칙 에
<code>파일럿/firestore.rules</code> 내용을 붙여 넣고 게시합니다.</p>
<div class="warn">
  규칙을 잘못 올리면 <b>모두가 아무것도 못 쓰게 되거나, 반대로 다 보이게</b> 됩니다.
  올린 뒤에는 자동 점검을 한 번 돌려 확인하세요.
</div>

<h2>4. 학생 비밀번호 새로 설정</h2>
<p>가장 자주 하게 되는 일입니다. 선생님이 아이디를 알려 주시면 됩니다.</p>
<div class="cmd">cd ~/dodgeball-timer02/reset && npm install
node set-password.js 아이디 새비밀번호123!</div>
<table>
  <tr><th style="width:230px;">상황</th><th>넣는 값</th></tr>
  <tr><td>학생</td><td>아이디 그대로 (예: <code>657b7q7</code>)</td></tr>
  <tr><td>선생님</td><td>콘솔 Users 에 보이는 주소 전체
      (예: <code>teca095...@todayhw.app</code>)</td></tr>
</table>
<div class="box">
  <b>콘솔의 「비밀번호 재설정」은 쓰지 마세요.</b> 그건 메일을 보내는 기능인데,
  이 앱의 계정 주소(<code>@todayhw.app</code>)는 메일이 갈 수 없는 주소입니다.
  콘솔에는 비밀번호를 직접 바꾸는 기능이 없습니다.
</div>
<p class="sub">「자격 증명을 찾지 못했다」가 나오면
<code>gcloud auth application-default login</code> 을 한 번 실행하고 다시 하세요.</p>

<h2>5. 전체 초기화</h2>
<p>시범 운영이 끝났을 때 합니다. <b>되돌릴 수 없습니다.</b></p>
<div class="cmd">firebase firestore:delete --all-collections -f --project today-homework</div>
<p class="sub">↑ 반·숙제·제출 사진·공지가 지워집니다</p>
<div class="cmd">cd ~/dodgeball-timer02/reset && npm install
node delete-all-users.js --yes</div>
<p class="sub">↑ 선생님·학생 모든 계정이 지워집니다.
<code>끝났습니다</code> 가 뜨면 완료입니다.</p>
<div class="box">
  이 두 줄은 <b>앱 안에도 적어 두었습니다</b> — 마이페이지 &gt; 관리자 &gt; 전체 초기화.
  문서를 찾지 않아도 됩니다.
</div>

<h2>6. 점검 돌리기</h2>
<p>고친 뒤에는 자동 점검 7종을 전부 돌립니다. 실제 서버에 붙어 돌기 때문에
점검용 계정과 자료가 잠시 만들어졌다 지워집니다.</p>
<p class="sub">점검 스크립트는 작업 폴더에 있으며, 화면 사진을 다시 찍는
<code>파일럿/보고자료/_캡처스크립트.js</code> 도 같은 방식으로 돕니다.</p>

<h2>7. 문서 다시 만들기</h2>
<p>화면이 바뀌면 안내서의 사진도 새로 찍어야 합니다.</p>
<div class="cmd">cd 파일럿/보고자료
node _캡처스크립트.js          # 화면 사진 다시 찍기
python3 _문서전체만들기.py      # 문서 다시 만들기</div>

<h2>8. 문제가 생겼을 때 보는 곳</h2>
<table>
  <tr><th style="width:230px;">증상</th><th>볼 곳</th></tr>
  <tr><td>저장이 안 됨</td><td>콘솔 &gt; Firestore &gt; 규칙.
      권한 문제면 앱이 「저장 권한이 없어요」라고 알립니다</td></tr>
  <tr><td>로그인이 안 됨</td><td>콘솔 &gt; Authentication &gt; Users 에 계정이 있는지</td></tr>
  <tr><td>화면이 옛날 것</td><td>배포가 됐는지. <code>curl</code> 로 받아
      본인 파일과 비교하면 확실합니다</td></tr>
  <tr><td>사용량 초과</td><td>콘솔 &gt; 사용량. 사진이 가장 많이 씁니다</td></tr>
</table>
"""

page('12_운영_인수인계.html', '운영 인수인계', '운영',
     BODY, sub='배포·비밀번호·초기화·점검')
