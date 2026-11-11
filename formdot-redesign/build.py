"""시안 빌드: src/concept-*.html 템플릿에 공통 CSS·JS(엔진+코어)를 넣어 concepts/ 아래 독립 실행 HTML로 만들어요."""
import glob, os
R = os.path.dirname(os.path.abspath(__file__))
css = open(f"{R}/src/core.css").read()
js = open(f"{R}/src/engine.js").read() + "\n" + open(f"{R}/src/core.js").read()
for t in sorted(glob.glob(f"{R}/src/concept-*.html")):
    s = open(t).read()
    assert "<!--@@CORE_CSS@@-->" in s and "<!--@@CORE_JS@@-->" in s, t
    s = s.replace("<!--@@CORE_CSS@@-->", "<style>\n" + css + "</style>").replace("<!--@@CORE_JS@@-->", "<script>\n" + js + "</script>")
    out = f"{R}/concepts/" + os.path.basename(t)
    open(out, "w").write(s); print("built", os.path.relpath(out, R), len(s) // 1024, "KB")

# 갤러리: 저장소용 index.html (완전한 HTML 문서)
g = open(f"{R}/src/gallery.html").read()
open(f"{R}/index.html", "w").write('<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + g.replace("</style>", "</style>\n</head>\n<body>", 1) + "\n</body>\n</html>\n")
print("built index.html")
# Artifact(claude.ai 미리보기)용: 외부 스타일시트는 Google Fonts만 허용되므로 Pretendard 대신 Noto Sans KR
import shutil
A = f"{R}/dist-artifact"; shutil.rmtree(A, ignore_errors=True); os.makedirs(A + "/concepts"); os.makedirs(A + "/assets"); os.makedirs(A + "/docs")
open(A + "/index.html", "w").write(g)
PRE = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">'
for f in glob.glob(f"{R}/concepts/*.html"):
    s = open(f).read(); assert PRE in s
    open(A + "/concepts/" + os.path.basename(f), "w").write(s.replace(PRE, '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">'))
for f in glob.glob(f"{R}/assets/*"): shutil.copy(f, A + "/assets/")
for f in glob.glob(f"{R}/docs/*.md") + [f"{R}/README.md"]:
    if os.path.exists(f): shutil.copy(f, A + ("/" if f.endswith("README.md") else "/docs/"))
print("built dist-artifact/")

# 운영용: C 안내형 여정 + 실제 Firebase 연결 (live/index.html). Firebase 웹 설정은 공개용 값이라 코드에 들어가도 돼요 (보안은 규칙이 담당)
import json, re
cfg_src = os.environ.get("FD_SOURCE", "")
if cfg_src and os.path.exists(cfg_src):
    src = open(cfg_src).read()
    cfg = src[src.index("const FIREBASE_CONFIG = ") + len("const FIREBASE_CONFIG = "):]
    cfg = cfg[:cfg.index("};") + 1]
    s = open(f"{R}/concepts/concept-c-guided.html").read()
    live = open(f"{R}/src/live.js").read().replace("/*@@FIREBASE_CONFIG@@*/", cfg)
    head = """<meta name="description" content="3D 모델링부터 프린팅까지, 당신의 아이디어를 현실로 구현합니다. 파일만 올리면 바로 견적!">
<meta property="og:type" content="website"><meta property="og:url" content="https://k1585.github.io/"><meta property="og:site_name" content="FORMDOT.">
<meta property="og:title" content="FORMDOT. · 형태의 시작, 상상을 현실로."><meta property="og:description" content="3D 모델링부터 프린팅까지, 당신의 아이디어를 현실로 구현합니다. 파일만 올리면 바로 견적!">
<meta property="og:image" content="https://k1585.github.io/og.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="manifest" href="manifest.webmanifest">
"""
    s = s.replace("<title>FORMDOT · C 안내형 여정</title>", "<title>FORMDOT. · 3D 모델링 · 프린팅</title>\n" + head)
    s = s.replace('<meta name="theme-color" content="#f5f6f8">', '<meta name="theme-color" content="#202124">')
    s = s.replace("</head>", "<style>\n" + open(f"{R}/src/live.css").read() + "</style>\n</head>", 1)
    marker = "</script>\n<script>\nconst {$, $$, esc, won} = FD;"
    assert s.count(marker) == 1
    s = s.replace(marker, "</script>\n<script>\n" + live + "</script>\n<script>\nconst {$, $$, esc, won} = FD;")
    os.makedirs(f"{R}/live", exist_ok=True)
    open(f"{R}/live/index.html", "w").write(s); print("built live/index.html")
