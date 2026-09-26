# -*- coding: utf-8 -*-
"""한글 문서(.hwpx)를 직접 만든다.

hwpx 는 zip + XML(OWPML)이다. 형식이 공개돼 있어 만들 수는 있지만, 글꼴·문단
모양 같은 것을 처음부터 적으려면 끝이 없다. 그래서 이미 한글이 만들어 준
문서 하나를 '틀'로 삼아, 글자 모양과 문단 모양은 그대로 쓰고 내용만 새로 넣는다.

단위는 HWPUNIT(1/7200인치)이다. 1mm = 283.46.
"""
import base64, io, os, re, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'manual')
MM = 283.46
BODY_W = 44419          # 틀 문서의 본문 폭
TODAY = '2026년 9월 26일'

# 틀 문서에서 확인한 모양 번호
C_TITLE, C_SUB, C_HEAD, C_BODY = 9, 14, 10, 11
P_PLAIN, P_CELL, P_FOOT = 0, 24, 21
S_PLAIN, S_CELL = 0, 23
BF_TABLE = 4            # 표 테두리

def esc(t):
    return (t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

_ids = [1204700000]
def nid():
    _ids[0] += 7
    return _ids[0]

def lineseg(n=1):
    out = []
    for i in range(n):
        out.append('<hp:lineseg textpos="0" vertpos="%d" vertsize="1000" textheight="1000"'
                   ' baseline="850" spacing="600" horzpos="0" horzsize="%d" flags="393216"/>'
                   % (i * 1600, BODY_W))
    return '<hp:linesegarray>%s</hp:linesegarray>' % ''.join(out)

def runs(parts):
    """parts: [(글자모양, 글) ...] — 굵게 등은 글자모양 번호로 고른다"""
    out = []
    for cp, txt in parts:
        out.append('<hp:run charPrIDRef="%d"><hp:t>%s</hp:t></hp:run>' % (cp, esc(txt)))
    return ''.join(out)

def para(parts, pp=P_PLAIN, st=S_PLAIN, inner=None):
    body = inner if inner is not None else runs(parts)
    return ('<hp:p id="0" paraPrIDRef="%d" styleIDRef="%d" pageBreak="0" columnBreak="0"'
            ' merged="0">%s%s</hp:p>' % (pp, st, body, lineseg()))


def table(rows, widths=None, head=True):
    """rows: [[칸, 칸], ...] — 첫 줄을 머리로 쓴다"""
    ncol = max(len(r) for r in rows)
    if widths is None:
        widths = [BODY_W // ncol] * ncol
    widths = [int(w) for w in widths]
    widths[-1] = BODY_W - sum(widths[:-1])
    ROW_H = 1400
    trs = []
    for ri, row in enumerate(rows):
        tcs = []
        for ci in range(ncol):
            txt = row[ci] if ci < len(row) else ''
            bold = head and ri == 0
            cell_p = ('<hp:p id="0" paraPrIDRef="%d" styleIDRef="%d" pageBreak="0"'
                      ' columnBreak="0" merged="0">%s%s</hp:p>'
                      % (P_CELL, S_CELL, runs([(C_BODY, txt)]), lineseg()))
            tcs.append(
                '<hp:tc name="" header="%d" hasMargin="0" protect="0" editable="0" dirty="0"'
                ' borderFillIDRef="%d">'
                '<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER"'
                ' linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0"'
                ' hasTextRef="0" hasNumRef="0">%s</hp:subList>'
                '<hp:cellAddr colAddr="%d" rowAddr="%d"/>'
                '<hp:cellSpan colSpan="1" rowSpan="1"/>'
                '<hp:cellSz width="%d" height="%d"/>'
                '<hp:cellMargin left="510" right="510" top="141" bottom="141"/></hp:tc>'
                % (1 if bold else 0, BF_TABLE, cell_p, ci, ri, widths[ci], ROW_H))
        trs.append('<hp:tr>%s</hp:tr>' % ''.join(tcs))
    tbl = ('<hp:tbl id="%d" zOrder="%d" numberingType="TABLE" textWrap="TOP_AND_BOTTOM"'
           ' textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL"'
           ' repeatHeader="1" rowCnt="%d" colCnt="%d" cellSpacing="0" borderFillIDRef="%d"'
           ' noAdjust="0">'
           '<hp:sz width="%d" widthRelTo="ABSOLUTE" height="%d" heightRelTo="ABSOLUTE" protect="0"/>'
           '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0"'
           ' holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP"'
           ' horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
           '<hp:outMargin left="0" right="0" top="0" bottom="0"/>'
           '<hp:inMargin left="540" right="540" top="0" bottom="0"/>%s</hp:tbl>'
           % (nid(), 10, len(rows), ncol, BF_TABLE, BODY_W, ROW_H * len(rows), ''.join(trs)))
    return ('<hp:p id="0" paraPrIDRef="%d" styleIDRef="%d" pageBreak="0" columnBreak="0"'
            ' merged="0"><hp:run charPrIDRef="%d">%s</hp:run>%s</hp:p>'
            % (P_PLAIN, S_PLAIN, C_BODY, tbl, lineseg()))


class Images:
    """그림은 BinData/ 에 담고 머리글과 목록에 등록해야 한글이 찾는다"""
    def __init__(self):
        self.items = []          # (이름, 바이트)

    def add(self, name, width_mm=45):
        from PIL import Image
        p = os.path.join(SHOTS, name + '.png')
        if not os.path.exists(p):
            raise SystemExit('화면 사진 없음: ' + p)
        im = Image.open(p).convert('RGB')
        w = 900
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=74, optimize=True)
        data = buf.getvalue()
        idx = len(self.items) + 1
        key = 'image%d' % idx
        self.items.append((key + '.jpg', data))
        W = int(width_mm * MM)
        H = int(W * im.height / im.width)
        OW, OH = im.width * 75, im.height * 75      # 원본 크기(대략 HWPUNIT)
        return ('<hp:pic reverse="0" id="%d" zOrder="%d" numberingType="PICTURE"'
                ' textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None"'
                ' href="" groupLevel="0" instid="%d">'
                '<hp:offset x="0" y="0"/>'
                '<hp:orgSz width="%d" height="%d"/>'
                '<hp:curSz width="%d" height="%d"/>'
                '<hp:flip horizontal="0" vertical="0"/>'
                '<hp:rotationInfo angle="0" centerX="%d" centerY="%d" rotateimage="1"/>'
                '<hp:renderingInfo>'
                '<hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>'
                '<hc:scaMatrix e1="%f" e2="0" e3="0" e4="0" e5="%f" e6="0"/>'
                '<hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/>'
                '</hp:renderingInfo>'
                '<hc:img binaryItemIDRef="%s" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/>'
                '<hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="%d" y="0"/>'
                '<hc:pt2 x="%d" y="%d"/><hc:pt3 x="0" y="%d"/></hp:imgRect>'
                '<hp:imgClip left="0" right="%d" top="0" bottom="%d"/>'
                '<hp:inMargin left="0" right="0" top="0" bottom="0"/>'
                '<hp:imgDim dimwidth="%d" dimheight="%d"/>'
                '<hp:sz width="%d" widthRelTo="ABSOLUTE" height="%d" heightRelTo="ABSOLUTE" protect="0"/>'
                '<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0"'
                ' holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="PARA" vertAlign="TOP"'
                ' horzAlign="LEFT" vertOffset="0" horzOffset="0"/>'
                '<hp:outMargin left="0" right="0" top="0" bottom="0"/>'
                '<hp:shapeComment>그림입니다.</hp:shapeComment></hp:pic>'
                % (nid(), 20 + idx, nid(), OW, OH, W, H, W // 2, H // 2,
                   W / float(OW), H / float(OH), key,
                   W, W, H, H, OW, OH, OW, OH, W, H))


TEMPLATE = None      # 틀로 쓸 hwpx 경로

def build(path, title, subtitle, blocks, images):
    """blocks: 문단 XML 조각들 / images: Images 객체"""
    z = zipfile.ZipFile(TEMPLATE)
    sec = z.read('Contents/section0.xml').decode('utf-8')
    head = z.read('Contents/header.xml').decode('utf-8')
    hpf = z.read('Contents/content.hpf').decode('utf-8')

    # 1) 본문: 틀의 머리(secPr 가 든 첫 문단)만 남기고 내용을 갈아 끼운다
    m = re.search(r'(<hp:p\b.*?</hp:p>)', sec, re.S)
    first = m.group(1)
    keep = re.search(r'<hp:ctrl>.*?</hp:ctrl>', first, re.S).group(0)   # secPr
    head_p = ('<hp:p id="0" paraPrIDRef="%d" styleIDRef="%d" pageBreak="0" columnBreak="0"'
              ' merged="0"><hp:run charPrIDRef="%d">%s</hp:run>'
              '<hp:run charPrIDRef="%d"><hp:t>%s</hp:t></hp:run>%s</hp:p>'
              % (P_PLAIN, S_PLAIN, C_TITLE, keep, C_TITLE, esc(title), lineseg()))
    body = [head_p]
    if subtitle:
        body.append(para([(C_SUB, subtitle)]))
    body += blocks
    body.append(para([(C_BODY, '작성자:김주원  |  작성일:' + TODAY)], pp=P_FOOT, st=S_CELL))
    newsec = sec[:m.start(1)] + ''.join(body) + '</hs:sec>'

    # 2) 머리글에 그림 목록을 등록한다 (refList 의 맨 앞에 와야 한다)
    if images.items:
        lst = ''.join('<hh:binData id="%d" type="EMBEDDING" format="%s" compress="false"'
                      ' state="OPEN"/>' % (i + 1, n.rsplit('.', 1)[1])
                      for i, (n, _) in enumerate(images.items))
        head = head.replace('<hh:refList>',
                            '<hh:refList><hh:binDataList itemCnt="%d">%s</hh:binDataList>'
                            % (len(images.items), lst), 1)
        add = ''.join('<opf:item id="%s" href="BinData/%s" media-type="image/jpeg"'
                      ' isEmbeded="1"/>' % (n.rsplit('.', 1)[0], n) for n, _ in images.items)
        hpf = hpf.replace('</opf:manifest>', add + '</opf:manifest>', 1)

    # 3) 다시 압축 (mimetype 은 규격상 압축 없이 맨 앞)
    out = zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED)
    out.writestr(zipfile.ZipInfo('mimetype'), b'application/hwp+zip', zipfile.ZIP_STORED)
    for it in z.infolist():
        if it.filename == 'mimetype':
            continue
        data = z.read(it.filename)
        if it.filename == 'Contents/section0.xml':
            data = newsec.encode('utf-8')
        elif it.filename == 'Contents/header.xml':
            data = head.encode('utf-8')
        elif it.filename == 'Contents/content.hpf':
            data = hpf.encode('utf-8')
        elif it.filename == 'Preview/PrvText.txt':
            data = title.encode('utf-8')
        out.writestr(it.filename, data)
    for name, data in images.items:
        out.writestr('BinData/' + name, data)
    out.close()
    return os.path.getsize(path)


# ───── 글 쓰기를 쉽게 해 주는 것들 ─────
def H(name):                      # [섹션 이름]
    return para([(C_HEAD, '[%s]' % name)])

def P(text):                      # 보통 문단
    return para([(C_BODY, text)])

def B(text):                      # * 로 시작하는 줄
    return para([(C_BODY, '*' + text)])

def PIC(imgs, name, cap, mm=45):  # 그림 + 설명
    x = imgs.add(name, mm)
    out = [para([], inner='<hp:run charPrIDRef="%d">%s</hp:run>' % (C_BODY, x))]
    if cap:
        out.append(para([(C_SUB, cap)]))
    return out
