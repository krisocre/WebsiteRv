"""Reproduce three ReviewsBoost timing-study figures. Requires Matplotlib."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-removal-time-analysis.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'svg.fonttype':'none','svg.hashsalt':'reviewsboost-time-v1'})
INK,BLUE,MUTED,PALE='#16314b','#087fe8','#556b7c','#b6c8d5'
def frame(title,subtitle,synthetic=False):
    fig,ax=plt.subplots(figsize=(12,7.8),dpi=100)
    fig.patch.set_facecolor('white')
    fig.text(.065,.95,'REVIEWSBOOST / '+('CONSTRUCTED EXAMPLES — NOT GOOGLE OR CLIENT DATA' if synthetic else 'ORIGINAL OBSERVATION-WINDOW ANALYSIS / VERSION 1.0'),color=BLUE,fontsize=10.5)
    fig.text(.065,.875,title,color=INK,fontsize=23,weight='bold')
    fig.text(.065,.815,subtitle,color=MUTED,fontsize=11.5)
    fig.text(.065,.041,'ReviewsBoost, October 24, 2026 / CC BY 4.0. Source observations remain attributed to their original publisher.',color=MUTED,fontsize=9)
    return fig,ax
def style(ax):
    ax.set_axisbelow(True);ax.grid(axis='x',alpha=.14)
    ax.tick_params(axis='y',length=0,pad=14)
    for side in ['top','right','left']:ax.spines[side].set_visible(False)
    ax.spines['bottom'].set_color('#cad8e2')
def save(fig,name):
    for ext in ['svg','png']:
        p=ROOT/(name+'.'+ext)
        fig.savefig(p,dpi=100,metadata={'Creator':'ReviewsBoost','Date':None} if ext=='svg' else {'Software':'ReviewsBoost / Matplotlib'})
        if ext=='svg':
            s=p.read_text(encoding='utf-8').replace("font-family: 'DejaVu Sans'","font-family: 'DejaVu Sans', Arial, sans-serif")
            p.write_text('\n'.join(line.rstrip() for line in s.splitlines())+'\n',encoding='utf-8')
    plt.close(fig)

fig,ax=frame('Creation cohorts have different possible lifespans.','Conditional calendar support in grey; Localo’s reported deleted-review medians in blue.')
fig.subplots_adjust(left=.18,right=.81,top=.70,bottom=.26)
for i,c in enumerate(D['cohorts']):
    lo=c['conditional_lifespan_lower_days'];hi=c['conditional_lifespan_upper_days']
    ax.plot([lo,hi],[i,i],color=PALE,linewidth=5,zorder=1)
    ax.scatter([lo,hi],[i,i],s=28,facecolor=[PALE if c['lower_inclusive'] else 'white','white'],edgecolor=PALE,zorder=2)
    ax.scatter([c['median_lifespan_days']],[i],s=60,color=BLUE,zorder=3)
    ax.text(1.025,i,f"{c['median_lifespan_days']:,} days",transform=ax.get_yaxis_transform(),ha='left',va='center',fontsize=11,color=INK,clip_on=False)
ax.set_yticks(range(7),[c['source_year_label'] for c in D['cohorts']]);ax.invert_yaxis();ax.set_xlim(-40,3550)
ax.set_xticks([0,500,1000,1500,2000,2500,3000]);ax.set_xlabel('Days from creation to deletion',labelpad=11);style(ax)
fig.text(.065,.153,'Assumption: deletion events fall in November 2023–January 2026; creation bins use half-open calendar intervals.',color=MUTED,fontsize=10)
fig.text(.065,.107,'These are mathematical possibilities, not fitted survival curves. Raw event dates and sampling rules were not available.',color=MUTED,fontsize=10)
save(fig,'google-removal-time-calendar-support')

fig,ax=frame('The same 5-day median can describe 5% or 90%.','Two synthetic cohorts start with 100 reviews each. Follow-up ends at day 30.',synthetic=True)
fig.subplots_adjust(left=.21,right=.87,top=.69,bottom=.31)
for i,s in enumerate(D['synthetic_scenarios']):
    deleted=s['deleted_count'];visible=s['still_visible_at_day_30']
    ax.barh(i,deleted,color=BLUE,height=.44,label='Deleted at day 5' if i==0 else None)
    ax.barh(i,visible,left=deleted,color=PALE,height=.44,label='Still visible at day 30' if i==0 else None)
    if deleted>=10:ax.text(deleted/2,i,str(deleted),ha='center',va='center',color='white',fontsize=16,weight='bold')
    else:ax.text(deleted+1,i-.32,str(deleted)+' deleted',ha='left',color=BLUE,fontsize=12)
    ax.text(deleted+visible/2,i,str(visible),ha='center',va='center',color=INK,fontsize=15)
ax.set_yticks([0,1],['Synthetic A','Synthetic B']);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xticks([0,20,40,60,80,100])
ax.set_xlabel('Reviews in each constructed 100-review cohort',labelpad=11);style(ax)
ax.legend(frameon=False,loc='lower center',bbox_to_anchor=(.5,-.40),ncol=2,fontsize=11)
fig.text(.065,.14,'Deleted-only median: 5 days in both. Population median: not reached by day 30 in A; day 5 in B.',color=INK,fontsize=11)
fig.text(.065,.095,'Remaining reviews are right-censored at day 30. Neither example is a measured Google removal rate.',color=MUTED,fontsize=10)
save(fig,'google-removal-time-synthetic-denominators')

fig,ax=frame('Monthly averages need the right time weights.','Published monthly averages × months reconstruct approximate period totals, not exact counts.')
fig.subplots_adjust(left=.24,right=.91,top=.71,bottom=.29)
labels=['Nov–Dec 2023 (2 months)','Jan–Jun 2024 (6 months)','Jul–Dec 2024 (6 months)','Jan–Jun 2025 (6 months)','Jul–Dec 2025 (6 months)','Jan 2026 (1 month)']
for i,p in enumerate(D['periods']):
    value=p['implied_deletions_from_displayed_mean']
    ax.barh(i,value,color=BLUE if i==4 else INK,height=.55)
    ax.text(value+3500,i,f'≈{value:,}',va='center',color=INK,fontsize=11)
ax.set_yticks(range(6),labels);ax.invert_yaxis();ax.set_xlim(0,265000)
ax.set_xticks([0,50000,100000,150000,200000],['0','50k','100k','150k','200k'])
ax.set_xlabel('Approximate deletions implied by displayed means',labelpad=11);style(ax)
fig.text(.065,.164,'Reconstructed: 335,513. Reported study total: 335,520. Difference: 7; no missing-review claim is inferred.',color=INK,fontsize=10.5)
fig.text(.065,.112,'Source: Localo’s period table. Compatibility with rounding is a sensitivity illustration; its rounding rule is not stated.',color=MUTED,fontsize=10)
save(fig,'google-removal-time-period-reconstruction')
print('Built three original SVG and 1200×780 PNG figures.')
