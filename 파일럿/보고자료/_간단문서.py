# -*- coding: utf-8 -*-
"""한 장짜리 동의서와 견적서. 실제로 나눠 주고 주고받는 종이라 짧아야 한다.
   긴 문서(06, 도입 견적서)는 그대로 두고 이것만 따로 만든다.
   쓰기: python3 _간단문서.py <틀로 쓸 hwpx>
"""
import os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _hwpx만들기 as K
from _hwpx만들기 import H, P, B, table, Images, build
from _문서만들기 import CSS
import _한글문서만들기 as D

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '한글문서')
K.TEMPLATE = sys.argv[1] if len(sys.argv) > 1 else None
os.makedirs(OUT, exist_ok=True)

L = '＿' * 8
S = '＿' * 4

PAGE = """<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>오늘의 숙제 — %s</title><style>%s
  .fill{ display:inline-block; min-width:90px; border-bottom:1px solid #999; }
  .sign{ margin-top:14px; border:1px solid #DDE1EC; border-radius:10px; padding:18px 20px; }
  .sign p{ margin:12px 0; }
  .check{ font-size:16px; margin:8px 0; }
</style></head><body>
<div class="doc-kind">%s</div>
<h1>%s</h1>
<p class="updated">%s</p>
%s
</body></html>"""


def html(fname, title, kind, sub, body):
    p = os.path.join(HERE, fname)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(PAGE % (title, CSS, kind, title, sub, body))
    return p


# ══════════════════ 한 장 동의서 ══════════════════
동의서 = """
<p>안녕하세요. 수업에서 숙제 제출과 확인에 <b>「오늘의 숙제」</b> 앱을 사용합니다.
학생이 숙제를 사진으로 찍어 올리면 선생님이 확인하고 승인하는 앱입니다.
아래를 확인하시고 동의 여부를 표시해 주세요.</p>

<table>
  <tr><th style="width:160px;">받는 것</th><th>왜 필요한가</th></tr>
  <tr><td>학생 이름, 비밀번호</td><td>계정 구분과 본인 확인</td></tr>
  <tr><td>숙제 제출 사진, 쪽지</td><td>숙제 제출과 확인 (선택)</td></tr>
  <tr><td>보호자 성함·연락처</td><td>만 14세 미만인 경우 법정대리인 동의 확인</td></tr>
</table>

<div class="box">
  <ul>
    <li><b>어디에</b> — 구글 파이어베이스, 대한민국 서울 서버. 국외로 나가지 않습니다.</li>
    <li><b>누가 보나</b> — 학생 본인과 담당 선생님만 봅니다. 다른 학생·다른 반 선생님은
        <b>서버가 막아</b> 볼 수 없습니다.</li>
    <li><b>언제 지우나</b> — 수업을 그만두거나 동의를 철회하시면 즉시 지웁니다.</li>
  </ul>
</div>

<p class="sub">숙제 사진에 학생의 글씨와 이름, 경우에 따라 얼굴이 담길 수 있습니다.
주민등록번호·위치정보·연락처 목록은 받지 않고, 광고에 쓰지 않습니다.</p>

<p><b>동의하지 않으셔도 됩니다.</b> 그 경우 기존처럼 종이로 숙제를 검사하며
학생에게 어떤 불이익도 없습니다. 동의 후에도 언제든 철회하실 수 있습니다.</p>

<div class="sign">
  <p class="check">□ 위 내용을 확인하였으며 개인정보 수집·이용에 <b>동의합니다.</b></p>
  <p class="check">□ 동의하지 않습니다.</p>
  <p style="margin-top:20px;">학생 이름 <span class="fill" style="min-width:150px;">&nbsp;</span>
     &nbsp; 보호자 성함 <span class="fill" style="min-width:150px;">&nbsp;</span> (서명)</p>
  <p>보호자 연락처 <span class="fill" style="min-width:150px;">&nbsp;</span>
     &nbsp; 날짜 <span class="fill" style="min-width:50px;">&nbsp;</span> 년
     <span class="fill" style="min-width:40px;">&nbsp;</span> 월
     <span class="fill" style="min-width:40px;">&nbsp;</span> 일</p>
</div>

<p class="sub">문의 · 김주원 kimnui2012@gmail.com &nbsp;|&nbsp;
자세한 내용은 앱 안 「마이페이지 &gt; 개인정보처리방침」에서 보실 수 있습니다.</p>
"""

# ══════════════════ 한 장 견적서 ══════════════════
견적서 = """
<div class="key">
  숙제 제출·확인 앱 「오늘의 숙제」 도입 견적입니다.
  <b>서버 실비는 학생 150명까지 사실상 들지 않습니다.</b>
</div>

<h2>비용</h2>
<table>
  <tr><th style="width:190px;">항목</th><th style="width:170px;">금액</th><th>주기</th></tr>
  <tr><td>서버 사용료 (실비)</td><td>학생 150명까지 <b>0원</b></td><td>월</td></tr>
  <tr><td>운영·유지보수</td><td><span class="fill">&nbsp;</span> 원</td><td>월</td></tr>
  <tr><td>초기 구축·설정·교육</td><td><span class="fill">&nbsp;</span> 원</td><td>1회</td></tr>
  <tr><td>도메인 (선택)</td><td>13,000~23,000원</td><td>연</td></tr>
  <tr><td><b>월 합계</b></td><td><b><span class="fill">&nbsp;</span> 원</b></td><td>월</td></tr>
</table>
<p class="sub">서버 사용료는 구글에 내는 실비입니다. 청구서를 그대로 보여 드리고
실제 쓴 만큼만 청구합니다. 도메인은 선택이며 지금 주소는 무료입니다.</p>

<h2>서버 실비 — 규모별</h2>
<table>
  <tr><th style="width:190px;">규모</th><th style="width:170px;">학생 수</th><th>한 달</th></tr>
  <tr><td>2~5반</td><td>30~75명</td><td><b>0원</b></td></tr>
  <tr><td>10반</td><td>150명</td><td>약 50원</td></tr>
  <tr><td>20반</td><td>300명</td><td>약 1,500원</td></tr>
  <tr><td>40반 (여러 지점)</td><td>600명</td><td>약 7,300원</td></tr>
</table>

<h2>운영·유지보수에 포함되는 일</h2>
<table>
  <tr><th style="width:250px;">하는 일</th><th>얼마나 자주</th></tr>
  <tr><td>학생 비밀번호 재설정</td><td>요청할 때마다</td></tr>
  <tr><td>학기마다 계정 발급·정리</td><td>학기당 1~2회</td></tr>
  <tr><td>오류 대응과 수정, 새 내용 배포</td><td>생길 때마다</td></tr>
  <tr><td>사용량·요금 확인</td><td>월 1회</td></tr>
</table>

<div class="key">
  <b>들지 않는 비용</b> — 서버 호스팅(월 2~3만원), SSL 인증서(연 10만원),
  앱스토어 등록(연 10만원), 학생 기기 설치, 문자 발송. 모두 0원입니다.
</div>

<p class="sub">앱 주소 https://today-homework.web.app · 설치 없이 주소로 씁니다.
자세한 비용 셈법은 「운영 비용 안내」를, 개인정보 처리는 「개인정보 수집·보관 명세서」를
봐 주세요.</p>
"""

h1 = html('간단_보호자동의서.html', '개인정보 수집·이용 동의서', '동의서',
          '「오늘의 숙제」 숙제 제출 앱', 동의서)
h2 = html('간단_도입견적서.html', '도입 견적서', '견적',
          '「오늘의 숙제」 숙제 제출 앱', 견적서)

with tempfile.TemporaryDirectory() as tmp:
    for src, name in [(h1, '간단_보호자동의서.docx'), (h2, '간단_도입견적서.docx')]:
        n = D.convert(src, os.path.join(OUT, name), tmp)
        print('  ✓ %-28s %6.0f KB' % (name, n / 1024))

# ── 한글 파일 ──
im = Images(); b = []
b += [P('안녕하세요. 수업에서 숙제 제출과 확인에 「오늘의 숙제」 앱을 사용합니다. '
        '학생이 숙제를 사진으로 찍어 올리면 선생님이 확인하고 승인하는 앱입니다. '
        '아래를 확인하시고 동의 여부를 표시해 주세요.'),
      table([['받는 것', '왜 필요한가'],
             ['학생 이름, 비밀번호', '계정 구분과 본인 확인'],
             ['숙제 제출 사진, 쪽지', '숙제 제출과 확인 (선택)'],
             ['보호자 성함·연락처', '만 14세 미만인 경우 법정대리인 동의 확인']],
            widths=[13000, 31419]),
      B('어디에 — 구글 파이어베이스, 대한민국 서울 서버. 국외로 나가지 않습니다.'),
      B('누가 보나 — 학생 본인과 담당 선생님만 봅니다. 다른 학생·다른 반 선생님은 '
        '서버가 막아 볼 수 없습니다.'),
      B('언제 지우나 — 수업을 그만두거나 동의를 철회하시면 즉시 지웁니다.'),
      P('숙제 사진에 학생의 글씨와 이름, 경우에 따라 얼굴이 담길 수 있습니다. '
        '주민등록번호·위치정보·연락처 목록은 받지 않고, 광고에 쓰지 않습니다.'),
      P('동의하지 않으셔도 됩니다. 그 경우 기존처럼 종이로 숙제를 검사하며 학생에게 '
        '어떤 불이익도 없습니다. 동의 후에도 언제든 철회하실 수 있습니다.'),
      P(''),
      P('□  위 내용을 확인하였으며 개인정보 수집·이용에 동의합니다.'),
      P('□  동의하지 않습니다.'),
      table([['학생 이름', L, '보호자 성함', L + ' (서명)'],
             ['보호자 연락처', L, '날짜', '20 %s 년 %s 월 %s 일' % (S, S, S)]],
            widths=[9000, 12000, 9000, 14419], head=False),
      B('문의 · 김주원 kimnui2012@gmail.com   자세한 내용은 앱 안 '
        '「마이페이지 > 개인정보처리방침」에서 보실 수 있습니다.')]
build(os.path.join(OUT, '보호자동의서_한장.hwpx'), '개인정보 수집·이용 동의서',
      '「오늘의 숙제」 숙제 제출 앱', b, im)
print('  ✓ %-28s %6d KB' % ('보호자동의서_한장.hwpx',
                            os.path.getsize(os.path.join(OUT, '보호자동의서_한장.hwpx')) // 1024))

im = Images(); b = []
b += [P('숙제 제출·확인 앱 「오늘의 숙제」 도입 견적입니다. '
        '서버 실비는 학생 150명까지 사실상 들지 않습니다.')]
b += [H('비용'),
      table([['항목', '금액', '주기'],
             ['서버 사용료 (실비)', '학생 150명까지 0원', '월'],
             ['운영·유지보수', L + ' 원', '월'],
             ['초기 구축·설정·교육', L + ' 원', '1회'],
             ['도메인 (선택)', '13,000~23,000원', '연'],
             ['월 합계', L + ' 원', '월']],
            widths=[14000, 20419, 10000]),
      B('서버 사용료는 구글에 내는 실비입니다. 청구서를 그대로 보여 드리고 실제 쓴 만큼만 '
        '청구합니다. 도메인은 선택이며 지금 주소는 무료입니다.')]
b += [H('서버 실비 — 규모별'),
      table([['규모', '학생 수', '한 달'],
             ['2~5반', '30~75명', '0원'],
             ['10반', '150명', '약 50원'],
             ['20반', '300명', '약 1,500원'],
             ['40반 (여러 지점)', '600명', '약 7,300원']],
            widths=[15000, 15000, 14419])]
b += [H('운영·유지보수에 포함되는 일'),
      table([['하는 일', '얼마나 자주'],
             ['학생 비밀번호 재설정', '요청할 때마다'],
             ['학기마다 계정 발급·정리', '학기당 1~2회'],
             ['오류 대응과 수정, 새 내용 배포', '생길 때마다'],
             ['사용량·요금 확인', '월 1회']],
            widths=[22000, 22419])]
b += [P('들지 않는 비용 — 서버 호스팅(월 2~3만원), SSL 인증서(연 10만원), '
        '앱스토어 등록(연 10만원), 학생 기기 설치, 문자 발송. 모두 0원입니다.'),
      B('앱 주소 https://today-homework.web.app · 설치 없이 주소로 씁니다.'),
      B('자세한 비용 셈법은 「운영 비용 안내」를, 개인정보 처리는 '
        '「개인정보 수집·보관 명세서」를 봐 주세요.')]
build(os.path.join(OUT, '도입견적서_한장.hwpx'), '「오늘의 숙제」 도입 견적서',
      '숙제 제출·확인 앱', b, im)
print('  ✓ %-28s %6d KB' % ('도입견적서_한장.hwpx',
                            os.path.getsize(os.path.join(OUT, '도입견적서_한장.hwpx')) // 1024))
