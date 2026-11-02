"""Original reproducible figures. Matplotlib is a local build dependency only."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FixedLocator, FuncFormatter

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-staff-name-study.json').read_text(encoding='utf-8'))
BLUE,INK,ORANGE,GRID='#087bea','#16223b','#a7572c','#d6e0ec'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'text.color':INK,'axes.labelcolor':INK,
                     'xtick.color':INK,'ytick.color':INK,'svg.fonttype':'path','svg.hashsalt':'reviewsboost-staff-names-v1'})

def start(title,subtitle,height=780,left=.33,right=.8):
    fig,ax=plt.subplots(figsize=(12,height/100),dpi=100)
    fig.patch.set_facecolor('#f5f8fc');ax.set_facecolor('#f5f8fc')
    fig.subplots_adjust(left=left,right=right,top=.77,bottom=.27)
    fig.text(.05,.955,'REVIEWSBOOST  /  ORIGINAL EVIDENCE AUDIT',size=10,weight='bold',color=BLUE)
    fig.text(.05,.895,title,size=23,weight='bold')
    fig.text(.05,.84,subtitle,size=11)
    ax.spines[['top','right','left']].set_visible(False);ax.spines['bottom'].set_color(GRID)
    ax.grid(axis='x',color=GRID,linewidth=.7);ax.set_axisbelow(True);ax.tick_params(axis='y',length=0,pad=12)
    return fig,ax

def finish(fig,name,note):
    fig.text(.05,.12,note,size=10,linespacing=1.6)
    fig.text(.05,.045,'Source estimates: Reviewflowz & Cartelis (2026) · Compilation/calculations: ReviewsBoost · CC BY 4.0',size=9)
    for ext in ['png','svg']:
        metadata={'Date':D['published'],'Creator':'ReviewsBoost'} if ext=='svg' else {'Software':'ReviewsBoost / Matplotlib'}
        fig.savefig(ROOT/(name+'.'+ext),dpi=100,metadata=metadata)
    plt.close(fig)

fig,ax=start('A name is not the same as a request','Twelve review-level comparisons; shared underlying data, not twelve independent experiments.',1100)
rows=[r for r in D['estimates'] if r['comparison_level']=='review']
labels=['No controls','Same business, age, length\n(main comparison)','Cleaned study base','Staff-like recurring name','One-off name','Under 30 days, staff-like name','First week, same business','First week, staff-like name','United States only','Europe only','Home services + healthcare','Four purged chains']
for y,r in enumerate(rows):
    color=ORANGE if r['record_id']=='R01' else BLUE
    ax.errorbar(r['relative_rate'],y,xerr=[[r['relative_rate']-r['interval_low']],[r['interval_high']-r['relative_rate']]],fmt='o',color=color,ecolor=color,capsize=4,linewidth=2,markersize=6)
    ax.text(1.03,y,f"{r['relative_rate']:.2f} [{r['interval_low']:.2f}–{r['interval_high']:.2f}]",transform=ax.get_yaxis_transform(),va='center',size=10)
ax.set_yticks(range(len(rows)),labels);ax.invert_yaxis();ax.set_xscale('log');ax.set_xlim(.65,1.6)
ax.xaxis.set_major_locator(FixedLocator([.75,1,1.25,1.5]));ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:g}×'))
ax.xaxis.set_minor_formatter(FuncFormatter(lambda *_:''));ax.axvline(1,color=INK,ls='--',lw=1)
ax.set_xlabel('Relative deletion rate and published 95% interval (log scale)')
finish(fig,'google-staff-name-review-estimates','The study observes name mentions, not the invitation that produced each review.\nAn interval containing 1 is not proof of equivalence, policy compliance or a Canadian removal probability.')

fig,ax=start('The business-level comparison changes','Source estimates for name-heavy versus name-rare businesses as covariate controls are added.',left=.32,right=.79)
rows=[r for r in D['estimates'] if r['comparison_level']=='business']
labels=['No adjustment','Industry, region, group size','Additional pace adjustment\n(source chart label)']
for y,r in enumerate(rows):
    ax.errorbar(r['relative_rate'],y,xerr=[[r['relative_rate']-r['interval_low']],[r['interval_high']-r['relative_rate']]],fmt='o',color=BLUE,capsize=5,linewidth=3,markersize=8)
    ax.text(1.03,y,f"{r['relative_rate']:.2f} [{r['interval_low']:.2f}–{r['interval_high']:.2f}]",transform=ax.get_yaxis_transform(),va='center',size=10)
ax.set_yticks(range(3),labels);ax.set_ylim(2.6,-.6);ax.set_xscale('log');ax.set_xlim(.55,6.5)
ax.xaxis.set_major_locator(FixedLocator([.75,1,2,4,6]));ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:g}×'))
ax.xaxis.set_minor_formatter(FuncFormatter(lambda *_:''));ax.axvline(1,color=INK,ls='--',lw=1)
ax.set_xlabel('Relative deletion rate and published 95% interval (log scale)')
finish(fig,'google-staff-name-business-controls','Source label: at least 50% versus under 10% of positive reviews naming a person.\nBusiness-level models and review-level comparisons answer different questions; they must not be pooled.')

fig,ax=start('A ratio of rounded averages is a different number','Our arithmetic from displayed group means beside the source’s separate adjusted summaries.',left=.30,right=.93)
labels=['Reviews gained\n(previous 12 months)','Reviews lost\n(short window, annualised)','Net\n(mixed time bases)']
for y,r in enumerate(D['ratio_audit']):
    raw,adjusted=r['ratio_of_rounded_means'],r['source_adjusted_summary']
    ax.plot([raw,adjusted],[y,y],color='#b6c8dc',lw=2,zorder=1)
    ax.scatter(raw,y-.07,s=85,marker='o',color=BLUE,label='Ratio of rounded means' if y==0 else None,zorder=3)
    ax.scatter(adjusted,y+.07,s=85,marker='s',color=ORANGE,label='Source adjusted summary' if y==0 else None,zorder=3)
    ax.text(raw,y-.22,f'{raw:.2f}×',ha='center',size=11)
    ax.text(adjusted,y+.27,f'{adjusted:.2f}×',ha='center',size=11)
ax.set_yticks(range(3),labels);ax.set_ylim(2.6,-.65);ax.set_xlim(0,3.7);ax.axvline(1,color=INK,ls='--',lw=1)
ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:g}×'));ax.set_xlabel('Name-heavy / name-rare relative summary')
ax.legend(loc='lower left',bbox_to_anchor=(0,1.03),ncol=2,frameon=False,fontsize=10,borderaxespad=0)
finish(fig,'google-staff-name-ratio-audit','Raw ratios: 121/63, 16/5 and 105/58. They need not reproduce model-adjusted summaries.\nThese are different summaries, not a causal contrast, a measured retention rate or a counting-error finding.')
print('Generated three original deterministic SVG/PNG figure pairs.')
