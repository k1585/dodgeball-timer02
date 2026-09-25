# -*- coding: utf-8 -*-
"""보고용 문서를 한 틀에서 만든다.

문서마다 스타일을 따로 적으면 금세 서로 달라진다. 여기서 한 번만 정하고
각 문서는 내용만 적는다. 화면 사진은 manual/ 폴더에서 읽어 줄여서 끼워 넣는다.
"""
import base64, io, os, re, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'manual')
TODAY = '2026년 9월 25일'

CSS = """
  *{ box-sizing:border-box; }
  body{ max-width:760px; margin:0 auto; padding:34px 20px 72px;
    font-family:"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;
    color:#2B2F3A; line-height:1.75; font-size:15px; }
  h1{ font-size:27px; color:#1E3A6B; margin:0 0 6px; letter-spacing:-0.4px; }
  h2{ font-size:18px; color:#1E3A6B; margin:34px 0 10px;
      padding-bottom:7px; border-bottom:2px solid #E8EDF6; }
  h3{ font-size:15.5px; color:#33436B; margin:22px 0 6px; }
  .updated{ color:#8A8FA3; font-size:13.5px; margin:0 0 6px; }
  .doc-kind{ display:inline-block; background:#1E3A6B; color:#fff; font-size:12px;
     font-weight:700; padding:3px 10px; border-radius:20px; margin-bottom:14px; }
  table{ border-collapse:collapse; width:100%; margin:14px 0; font-size:14px; }
  th,td{ border:1px solid #E8EDF6; padding:9px 12px; text-align:left; vertical-align:top; }
  th{ background:#F7F9FD; color:#33436B; font-weight:700; }
  .box{ background:#F9FBFF; border:1px solid #E8EDF6; border-radius:10px;
        padding:16px 18px; margin:16px 0; }
  .key{ background:#FFF8E8; border:1px solid #F0DFB4; border-radius:10px;
        padding:16px 18px; margin:16px 0; }
  .warn{ background:#FDF0EF; border:1px solid #F3D2D0; border-radius:10px;
        padding:16px 18px; margin:16px 0; }
  ul,ol{ padding-left:22px; margin:10px 0; }
  li{ margin:5px 0; }
  code,.cmd{ font-family:ui-monospace,Menlo,Consolas,monospace; font-size:13px;
     background:#F1F4FA; padding:2px 6px; border-radius:5px; }
  .cmd{ display:block; padding:12px 14px; margin:10px 0; line-height:1.7;
     white-space:pre-wrap; word-break:break-all; }
  .shot{ margin:14px 0 22px; }
  .shot img{ width:236px; border:1px solid #E2E7F0; border-radius:12px;
     box-shadow:0 2px 10px rgba(30,58,107,0.07); display:block; }
  .shot .cap{ font-size:13px; color:#8A8FA3; margin-top:7px; }
  .row{ display:flex; gap:18px; flex-wrap:wrap; }
  .step{ border-left:3px solid #C9D6EE; padding:2px 0 2px 16px; margin:18px 0; }
  .step .n{ display:inline-block; background:#1E3A6B; color:#fff; font-size:12px;
     font-weight:700; width:22px; height:22px; line-height:22px; text-align:center;
     border-radius:50%; margin-right:7px; }
  .fill{ background:#FFFDF2; border-bottom:1.5px dashed #D9C37E; padding:1px 22px; }
  .sub{ color:#8A8FA3; font-size:13.5px; }
  .ok{ color:#1FA455; font-weight:700; }
  .no{ color:#E4423F; font-weight:700; }
  .toc a{ color:#1E3A6B; text-decoration:none; font-weight:600; }
  footer{ margin-top:48px; padding-top:16px; border-top:1px solid #E8EDF6;
     color:#A0A5B5; font-size:12.5px; }
  @media print{ body{ padding:0; } h2{ page-break-after:avoid; }
     .shot,.box,.key,.warn,table{ page-break-inside:avoid; } }
"""

_cache = {}
def shot(name, width=236, cap=None):
    """manual/ 의 화면 사진을 줄여서 문서 안에 직접 넣는다.
       파일을 따로 들고 다니지 않아도 문서 하나만 열면 되게 하려는 것이다."""
    if name not in _cache:
        from PIL import Image
        p = os.path.join(SHOTS, name + '.png')
        if not os.path.exists(p):
            raise SystemExit('화면 사진 없음: ' + p)
        im = Image.open(p).convert('RGB')
        w = width * 2                      # 화면이 촘촘한 기기에서도 또렷하게
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=72, optimize=True)
        _cache[name] = base64.b64encode(buf.getvalue()).decode()
    c = '<div class="cap">%s</div>' % cap if cap else ''
    return ('<div class="shot"><img src="data:image/jpeg;base64,%s" alt="%s">%s</div>'
            % (_cache[name], cap or name, c))

def row(*shots):
    return '<div class="row">' + ''.join(shots) + '</div>'

def page(fname, title, kind, body, sub=None):
    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>오늘의 숙제 — %s</title>
<style>%s</style>
</head>
<body>
<div class="doc-kind">%s</div>
<h1>%s</h1>
<p class="updated">%s · 작성일 %s</p>
%s
<footer>「오늘의 숙제」 시범 운영 자료 · %s</footer>
</body>
</html>""" % (title, CSS, kind, title, sub or '오늘의 숙제', TODAY, body, TODAY)
    out = os.path.join(HERE, fname)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print('  ✓ %-42s %6.0f KB' % (fname, os.path.getsize(out)/1024))
