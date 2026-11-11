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
