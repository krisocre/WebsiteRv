"""Three original plots from the public coverage dataset; no observed Google rates."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-review-coverage-study.json').read_text(encoding='utf-8'))
BLUE='#087ce2'; RED='#b52332'; NAVY='#16223b'; MUTED='#586577'; LINE='#dce3eb'
plt.rcParams.update({'font.family':['DejaVu Sans','Arial','sans-serif'],'font.size':13,'axes.labelcolor':NAVY,
                     'text.color':NAVY,'xtick.color':MUTED,'ytick.color':NAVY,
                     'svg.fonttype':'none','svg.hashsalt':'reviewsboost-coverage-v1',
                     'axes.spines.top':False,'axes.spines.right':False,
                     'axes.spines.left':False,'axes.spines.bottom':False})

def canvas(title,subtitle):
    fig,ax=plt.subplots(figsize=(12,7.8),dpi=100)
    fig.subplots_adjust(left=.19,right=.88,top=.77,bottom=.28)
    fig.text(.065,.93,'REVIEWSBOOST  /  GOOGLE REVIEW COVERAGE',fontsize=11,color=BLUE,weight='bold')
    fig.text(.065,.865,title,fontsize=22,weight='bold',linespacing=1.3)
    fig.text(.065,.81,subtitle,fontsize=12,color=MUTED)
    ax.tick_params(axis='both',length=0,pad=10)
    return fig,ax

def save(fig,name,note):
    fig.text(.065,.09,note,fontsize=11,color=MUTED,linespacing=1.5)
    fig.text(.065,.035,'ReviewsBoost calculations · Documentation checked 5 Nov 2026 · CC BY 4.0',fontsize=10,color=MUTED)
    for extension in ['svg','png']:
        fig.savefig(ROOT/(name+'.'+extension),facecolor='white',metadata={'Date':None} if extension=='svg' else None)
    plt.close(fig)

fig,ax=canvas('Five records cover less as the rating count grows',
              'Maximum count-based coverage of one Places API (New) response')
rows=D['coverage']; y=list(range(len(rows)))
values=[row['max_count_coverage_pct'] for row in rows]
ax.set_xscale('log');ax.set_xlim(.075,150)
ax.scatter(values,y,s=150,color=BLUE,zorder=3)
for i,value in enumerate(values):ax.annotate(f'{value:g}%',(value,i),xytext=(12,0),textcoords='offset points',va='center',fontsize=13,weight='bold')
ax.set_yticks(y,[f"{row['total_ratings_n']:,} ratings" for row in rows]);ax.invert_yaxis()
ax.set_xticks([.1,1,10,100]);ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:g}%'))
ax.grid(axis='x',color=LINE,linewidth=.8,zorder=0)
ax.set_xlabel('Share represented by five records — logarithmic scale',labelpad=15)
save(fig,'google-review-five-record-coverage','Source: Google Place resource; upper bound = 100 × 5 / N.\nN includes ratings with or without text. These are constructed sizes, not sampled businesses.')

fig,ax=canvas('A small random sample can miss all ten targets',
              'Hypothetical benchmark only — Google relevance ordering is not random')
rows=[next(r for r in D['random_sample_scenarios'] if r['population_n']==n and r['target_records_k']==10 and r['sample_size_s']==5) for n in [20,50,100,200,500,1000]]
y=list(range(len(rows)));values=[r['miss_pct'] for r in rows]
ax.barh(y,[100]*len(rows),height=.5,color='#edf1f6')
ax.barh(y,values,height=.5,color=RED)
for i,value in enumerate(values):ax.text(value+2 if value<25 else value-2,i,f'{value:.1f}%',va='center',ha='left' if value<25 else 'right',color=NAVY if value<25 else 'white',weight='bold',fontsize=14)
ax.set_xlim(0,106);ax.set_xticks([0,25,50,75,100],['0%','25%','50%','75%','100%'])
ax.set_yticks(y,[f"{r['population_n']:,} total" for r in rows]);ax.invert_yaxis()
ax.set_xlabel('Chance of missing all 10 targets in 5 random draws',labelpad=15)
save(fig,'google-review-random-sample-misses','Exact finite-population calculation: C(N − 10, 5) / C(N, 5).\nTargets are hypothetical records of interest, not fraud labels or Google removal outcomes.')

fig,ax=canvas('Twenty refreshes do not guarantee 100 unique reviews',
              'Constructed bounds: 100 unchanged records, exactly 5 returned each time')
rows=[r for r in D['refresh_envelopes'] if r['population_n']==100]
x=[r['snapshots_t'] for r in rows];low=[r['minimum_unique_records'] for r in rows];high=[r['maximum_unique_records'] for r in rows]
ax.fill_between(x,low,high,color=BLUE,alpha=.10)
ax.plot(x,high,'o-',color=BLUE,lw=2.5,label='Maximum possible: min(100, 5 × refreshes)')
ax.plot(x,low,'o-',color=RED,lw=2,label='Minimum possible: the same 5 every time')
ax.set_xlim(.5,30.5);ax.set_ylim(0,108);ax.set_xticks([1,5,10,20,30]);ax.set_yticks([5,25,50,75,100])
ax.grid(axis='y',color=LINE,linewidth=.8)
ax.set_xlabel('Number of five-record snapshots',labelpad=15);ax.set_ylabel('Distinct records seen',labelpad=12)
ax.legend(loc='upper left',fontsize=11,frameon=False)
save(fig,'google-review-refresh-coverage-bounds','These are possible set-overlap bounds, not measurements of Google refresh behaviour.\nNo elapsed-time or random-independence assumption. The API gives no unique-coverage guarantee.')
print('Plotted three original SVG/PNG pairs (1200 × 780).')
