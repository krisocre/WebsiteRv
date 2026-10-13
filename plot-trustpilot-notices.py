"""Reproduce four ReviewsBoost figures from trustpilot-notices-2025.json.
Requires Matplotlib. Original analysis/figures CC BY 4.0; underlying counts Trustpilot.
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'trustpilot-notices-2025.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'svg.fonttype':'none','svg.hashsalt':'reviewsboost-trustpilot-v1'})
ink, blue, muted, light='#16314b','#087fe8','#556b7c','#f5f9fd'
def frame(title,subtitle):
    fig,ax=plt.subplots(figsize=(12,7.8),dpi=100)
    fig.patch.set_facecolor('white');ax.set_facecolor('white')
    fig.text(.065,.948,'REVIEWSBOOST / SOURCE-TABLE AUDIT / VERSION 1.0',fontsize=11,color=blue)
    fig.text(.065,.877,title,fontsize=24,color=ink,weight='bold')
    fig.text(.065,.817,subtitle,fontsize=12,color=muted)
    fig.text(.065,.081,'Scope: reviews involving EU users or EU businesses; 17 February–31 December 2025. Not a Canadian sample.',fontsize=10,color=muted)
    fig.text(.065,.044,'Source: Trustpilot DSA report, published 28 February 2026. Original analysis: ReviewsBoost, 8 October 2026 / CC BY 4.0.',fontsize=9,color=muted)
    return fig,ax
def style(ax):
    ax.grid(axis='x',alpha=.13);ax.set_axisbelow(True);ax.tick_params(axis='y',length=0,pad=12)
    for side in ['top','right','left']:ax.spines[side].set_visible(False)
    ax.spines['bottom'].set_color('#cad8e2')
def save(fig,name):
    for ext in ['svg','png']:
        target=ROOT/f'{name}.{ext}'
        fig.savefig(target,dpi=100,metadata={'Creator':'ReviewsBoost','Date':None} if ext=='svg' else {'Software':'ReviewsBoost / Matplotlib'})
        if ext=='svg':
            svg=target.read_text(encoding='utf-8').replace("font-family: 'DejaVu Sans'", "font-family: 'DejaVu Sans', Arial, sans-serif")
            target.write_text('\n'.join(line.rstrip() for line in svg.splitlines())+'\n',encoding='utf-8')
    plt.close(fig)

S=D['summary']
fig,ax=frame('One report. Three different counting units.','Counts of notices, reported items and terms-based actions have different meanings.')
fig.subplots_adjust(left=.30,right=.94,top=.71,bottom=.25)
labels=['Notices received','Reported specific items','Terms-based actions']
values=[S['total_notices'],S['total_items'],S['total_terms_actions']]
ax.barh(range(3),values,color=[blue,ink,'#669bbb'],height=.5)
for i,v in enumerate(values):ax.text(v+5500,i,f'{v:,}',va='center',fontsize=15,color=ink,weight='bold')
ax.set_yticks(range(3),labels);ax.invert_yaxis();ax.set_xlim(0,505000)
ax.set_xticks([0,100000,200000,300000,400000],['0','100k','200k','300k','400k'])
ax.set_xlabel('Published count; units vary by row',labelpad=12);style(ax)
fig.text(.065,.158,'The 26,563 notice–item gap does not identify 26,563 people. No matched report-to-removal outcomes are supplied.',fontsize=10,color=muted)
save(fig,'trustpilot-notices-counting-units')

codes=['KEYWORD_INAUTHENTIC_USER_REVIEWS','KEYWORD_DEFAMATION','KEYWORD_HIDDEN_ADVERTISEMENT','KEYWORD_DISCRIMINATION']
selected=[next(r for r in D['rows'] if r['category_code']==c) for c in codes]
selected.append(next(r for r in D['rows'] if r['subcategory_description']=='Personal Information'))
labels=['Inauthentic user reviews','Defamation','Hidden advertisement','Discrimination','Personal information']
fig,ax=frame('Which reported concerns account for most notices?','These are reported reasons, not verified violation counts. Each share uses 423,762 notices.')
fig.subplots_adjust(left=.30,right=.93,top=.72,bottom=.26)
for i,r in enumerate(selected):
    ax.barh(i,r['notices'],color=blue if i==0 else ink,height=.55)
    ax.text(r['notices']+4500,i,f"{r['notices']:,}  ({r['notices']/S['total_notices']*100:.2f}%)",va='center',fontsize=12,color=ink)
ax.set_yticks(range(5),labels);ax.invert_yaxis();ax.set_xlim(0,365000)
ax.set_xticks([0,100000,200000,300000],['0','100k','200k','300k']);ax.set_xlabel('Notices received',labelpad=12);style(ax)
fig.text(.065,.158,'The five listed reasons total 412,677 notices; other reported reasons account for 11,085. They are not added to parent rows.',fontsize=10,color=muted)
save(fig,'trustpilot-notice-reasons')

fig,ax=frame('The 1,639-item arithmetic residual, located.','Two parent-category item counts are lower than their numeric subcategory sums.')
fig.subplots_adjust(left=.36,right=.91,top=.68,bottom=.34)
values=[1381,258];labels=['Illegal or harmful speech','Scams and fraud']
ax.barh(range(2),values,color=[blue,ink],height=.42)
for i,v in enumerate(values):ax.text(v+25,i,f'+{v:,}',va='center',fontsize=18,color=ink,weight='bold')
ax.set_yticks(range(2),labels);ax.invert_yaxis();ax.set_xlim(0,1700)
ax.set_xlabel('Subcategory item sum minus parent-category item count',labelpad=12);style(ax)
fig.text(.065,.195,'1,381 + 258 = 1,639 = 397,199 total items − 395,560 summed numeric parent-category items.',fontsize=11,color=ink)
fig.text(.065,.149,'This locates the numerical difference. It does not establish missing reviews, duplicated records or the operational cause.',fontsize=10,color=muted)
save(fig,'trustpilot-notice-reconciliation')

fig,ax=frame('Published median action time varies by reason.','Hours reported for five common reasons; medians are not deadlines or Canadian service promises.')
fig.subplots_adjust(left=.30,right=.91,top=.72,bottom=.25)
for i,r in enumerate(selected):
    ax.barh(i,r['median_hours'],color=blue if i==0 else ink,height=.55)
    ax.text(r['median_hours']+1,i,f"{r['median_hours']} hours",va='center',fontsize=13,color=ink)
ax.set_yticks(range(5),['Inauthentic user reviews','Defamation','Hidden advertisement','Discrimination','Personal information'])
ax.invert_yaxis();ax.set_xlim(0,56);ax.set_xlabel('Reported median time to take action (hours)',labelpad=12);style(ax)
fig.text(.065,.158,'The overall reported median is 18 hours. Category medians cannot be averaged to recover the overall median.',fontsize=10,color=muted)
save(fig,'trustpilot-notice-action-times')
print('Built four original SVG and 1200×780 PNG figures')
