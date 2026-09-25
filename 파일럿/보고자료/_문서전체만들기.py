# -*- coding: utf-8 -*-
"""문서를 한 번에 다시 만든다. 화면이 바뀌면 _캡처스크립트.js 를 먼저 돌린다."""
import importlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
print('문서를 만듭니다\n')
for m in ['_doc00','_doc01','_doc02','_doc03','_doc04',
          '_doc08','_doc09','_doc10','_doc11','_doc12']:
    importlib.import_module(m)
print('\n끝났습니다.')
