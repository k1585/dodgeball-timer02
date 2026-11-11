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
