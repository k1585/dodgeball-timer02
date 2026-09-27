# -*- coding: utf-8 -*-
"""학원 규모에서 파이어베이스가 실제로 얼마나 드는지.
   읽기가 생기는 곳은 코드에서 센 그대로다(학생 한 번 열 때 = 1+학생수+숙제x3+일정+1)."""
FREE = dict(reads=50000, writes=20000, store=1.0, egress=10.0)
PRICE = dict(read=0.18/100000, write=0.18/100000, store=0.26, egress=0.12)
PHOTO_KB = 250; USD = 1380

def calc(classes, per_class, hw_end=20, events=15, opens=3, t_opens=6, ph=2, subs=0.7):
    students = classes*per_class; teachers = max(1, round(classes/3))
    H = hw_end/2
    reads = (students*opens*(1+per_class+3*H+events+1)
             + teachers*t_opens*(1+per_class+H+per_class*H+events+1)
             + students*subs*ph)
    writes = students*subs*(2+ph) + teachers*3
    store = students*hw_end*ph*PHOTO_KB/1024/1024
    egress = (students*subs*ph*PHOTO_KB/1024/1024)*30*2 + reads*30*0.5/1024/1024
    over = lambda v,f: max(0, v-f)
    cost = (over(reads,FREE['reads'])*30*PRICE['read']
            + over(writes,FREE['writes'])*30*PRICE['write']
            + over(store,FREE['store'])*PRICE['store']
            + over(egress,FREE['egress'])*PRICE['egress'])
    return students, reads, store, cost

print('%-22s %6s %10s %9s %12s' % ('규모','학생','하루 읽기','저장GiB','한 달 요금'))
print('-'*64)
for label, c, pc in [('작은 학원 (2반)',2,15), ('보통 학원 (5반)',5,15),
                     ('큰 학원 (10반)',10,15), ('아주 큰 학원 (20반)',20,15),
                     ('여러 지점 (40반)',40,15)]:
    st, r, s, cost = calc(c, pc)
    print('%-22s %5d명 %9.0f %8.2f %12s'
          % (label, st, r, s, '무료' if cost<=0 else '%s원'%format(int(cost*USD),',')))
print()
print('* 저장은 4주 누적 기준. 학기 내내 쌓으면 더 늘어난다.')
print('* 무료 한도: 읽기 5만/일, 저장 1GiB, 전송 10GiB/월')
