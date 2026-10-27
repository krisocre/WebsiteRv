from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import numpy as np
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-reply-removal-study.json').read_text(encoding='utf-8'));rows=D['cohorts']
plt.rcParams.update({'svg.fonttype':'none','svg.hashsalt':'reviewsboost-reply-1','font.family':'DejaVu Sans','font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False})
INK='#16223b';RED='#d22c39';PALE='#f8fafc'
def start(title,subtitle,left=.2):
 fig,ax=plt.subplots(figsize=(12,7.8),dpi=100);fig.patch.set_facecolor(PALE);ax.set_facecolor(PALE);fig.subplots_adjust(left=left,right=.94,top=.76,bottom=.2)
 fig.text(.055,.93,title,color=INK,size=23,weight='bold');fig.text(.055,.865,subtitle,color=INK,size=12)
 return fig,ax
def save(fig,name,note):
 fig.text(.055,.09,note,color=INK,size=10);fig.text(.055,.04,'ReviewsBoost · Original analysis and figures: CC BY 4.0 · Source aggregates: Localo (2026)',color='#57667a',size=9)
 fig.savefig(ROOT/(name+'.png'));fig.savefig(ROOT/(name+'.svg'),metadata={'Date':'2026-10-27','Creator':'ReviewsBoost'})
 svg=ROOT/(name+'.svg');text=svg.read_text(encoding='utf-8').replace("font-family: 'DejaVu Sans'","font-family: 'DejaVu Sans', Arial, sans-serif");svg.write_text('\n'.join(line.rstrip() for line in text.splitlines())+'\n',encoding='utf-8');plt.close(fig)
fig,ax=start('A slow-reply bar is not a protective effect','Source percentages describe selected reviews that were deleted, grouped by observed owner reply speed.')
y=np.arange(6);values=[r['source_removed_within_7_days_percent'] for r in rows];ax.barh(y,values,color=[INK]*4+[RED,INK],height=.62)
ax.set_yticks(y,[r['reply_label'] for r in rows]);ax.invert_yaxis();ax.set_xlim(0,46);ax.set_xlabel('Reported removed-within-7-days percentage in the source row (%)');ax.set_axisbelow(True);ax.grid(axis='x',color='#e1e6ed')
for yy,value in zip(y,values):ax.text(value+.7,yy,f'{value:.1f}%',va='center',color=INK)
save(fig,'google-reply-source-rates','These are rounded displays, not all-review deletion risks. Reply time is not report-to-decision turnaround.')
states=['all_reply_times_in_interval_precede_horizon','only_part_of_reply_interval_precedes_horizon','incompatible_if_reply_precedes_removal','not_applicable_no_reply']
labels=['Interval permits\nreply before horizon','Only part of interval\nprecedes horizon','Incompatible under\nthe stated model','No reply-time\ninterval']
matrix=np.array([[states.index(next(e['state'] for e in D['eligibility'] if e['source_row']==r['record_id'] and e['horizon_days']==h)) for h in [1,7,30]] for r in rows])
fig,ax=start('Which reply times can precede a deletion window?','Conditional model only: the reply belongs to the same review and occurs strictly before its removal (R < T).')
ax.imshow(matrix,cmap=ListedColormap(['#dbe7f2','#f3d8a7','#e7bec2','#e5e7eb']),vmin=0,vmax=3,aspect='auto')
ax.set_xticks([0,1,2],['Deletion by day 1','Deletion by day 7','Deletion by day 30']);ax.set_yticks(range(6),[r['reply_label'] for r in rows]);ax.tick_params(length=0,pad=9)
for i in range(6):
 for j in range(3):ax.text(j,i,labels[matrix[i,j]],ha='center',va='center',color=INK,size=10)
save(fig,'google-reply-time-eligibility','Bin boundaries and 86,400-second days are model assumptions. Cell colours are compatibility classes, never probabilities.')
fig,ax=start('A rounded percentage does not reveal an exact count','Integer count intervals under an assumed nearest-0.1-percentage-point rounding rule; not observed counts.')
lo=[r['conditional_7_day_count_min'] for r in rows];hi=[r['conditional_7_day_count_max'] for r in rows]
ax.barh(y,lo,color='#b6c8da',height=.58);ax.errorbar([(a+b)/2 for a,b in zip(lo,hi)],y,xerr=[(b-a)/2 for a,b in zip(lo,hi)],fmt='|',color=RED,capsize=6,markersize=14)
ax.set_yticks(y,[r['reply_label'] for r in rows]);ax.invert_yaxis();ax.set_xlim(0,65000);ax.set_xlabel('Compatible 7-day event count within the source deleted-review row');ax.set_axisbelow(True);ax.grid(axis='x',color='#e1e6ed')
for yy,a,b in zip(y,lo,hi):ax.text(b+1000,yy,f'{a:,}–{b:,}',va='center',color=INK,size=10)
save(fig,'google-reply-rounded-counts','The source does not supply its rounding rule. The 0.0% / 38,145 row alone permits 0–19 events under this model.')
print('Built three ReviewsBoost figures, SVG plus 1200×780 PNG.')
