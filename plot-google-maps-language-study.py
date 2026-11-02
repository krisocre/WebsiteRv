"""Three original figures; all values come from the checked JSON release."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-maps-language-study.json').read_text(encoding='utf-8'))
R={(r['period'],r['language']):r for r in D['estimates']}
BLUE='#1766ba';NAVY='#182d49';ORANGE='#a95423';GREY='#52657e';INK='#17243a'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12,'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':INK,'text.color':INK,'svg.fonttype':'path','svg.hashsalt':'reviewsboost-language-v1','savefig.facecolor':'white'})
def save(fig,name):
    # Embedded glyph paths keep SVG exports consistent without downloading a font.
    # Accessible labels/values also appear in the article's HTML tables and alt text.
    fig.savefig(ROOT/(name+'.png'),dpi=100,metadata={'Software':'ReviewsBoost analysis / Matplotlib'});fig.savefig(ROOT/(name+'.svg'),metadata={'Date':'2026-11-02','Creator':'ReviewsBoost analysis / Matplotlib','Title':name.replace('-',' '),'Description':'Historical Google Maps EEA all-content accuracy. Original ReviewsBoost compilation and interval calculations; not review-removal probabilities.'});plt.close(fig)
fig,ax=plt.subplots(figsize=(12,7.8));fig.subplots_adjust(left=.19,right=.9,top=.76,bottom=.23)
fig.text(.075,.94,'English and French switch order in the point estimates',fontsize=20,weight='bold',color=NAVY)
fig.text(.075,.885,'Google Maps automated moderation · EEA contributions across content types',fontsize=12,color=GREY)
labels=[]
for y,(period,language) in enumerate([('2024H2','English'),('2024H2','French'),('2025H1','English'),('2025H1','French')]):
    r=R[period,language];p=r['accuracy_percent'];color=BLUE if language=='English' else ORANGE
    ax.errorbar(p,3-y,xerr=[[p-r['ci_low_percent']],[r['ci_high_percent']-p]],fmt='o',color=color,capsize=6,markersize=10,elinewidth=3)
    ax.text(99.5,3-y,f"{p}% [{r['ci_low_percent']}, {r['ci_high_percent']}]",va='center',ha='left',fontsize=11)
    labels.append(language+'\n'+('Jul–Dec 2024' if period=='2024H2' else 'Jan–Jun 2025'))
ax.set_yticks([3,2,1,0],labels);ax.set_xlim(60,100);ax.set_ylim(-.6,3.6);ax.set_xlabel('Reported accuracy (%) · interval bars are published 95% intervals');ax.grid(axis='x',alpha=.2)
fig.text(.075,.12,'Printed intervals overlap for English/French in both periods.\nThese are not Canadian review-removal probabilities or a test of language effects.',fontsize=11,color=GREY)
fig.text(.075,.045,'ReviewsBoost original compilation · Google EU DSA reports, Table 3.2.3 · Historical data',fontsize=10,color=GREY)
save(fig,'google-maps-language-english-french')
fig,ax=plt.subplots(figsize=(12,13));fig.subplots_adjust(left=.18,right=.9,top=.86,bottom=.12)
fig.text(.075,.955,'26 languages, two historical reporting periods',fontsize=22,weight='bold',color=NAVY)
fig.text(.075,.915,'Point changes are descriptive; printed intervals overlap or touch in all 26 matches.',fontsize=12,color=GREY)
languages=sorted({r['language'] for r in D['estimates']})
for i,language in enumerate(languages):
    y=25-i
    for period,offset,color,marker in [('2024H2',.16,GREY,'o'),('2025H1',-.16,BLUE,'s')]:
        r=R[period,language];p=r['accuracy_percent'];ax.errorbar(p,y+offset,xerr=[[p-r['ci_low_percent']],[r['ci_high_percent']-p]],fmt=marker,color=color,capsize=2,markersize=4,elinewidth=1.3,label=period if i==0 else None)
ax.set_yticks(range(26),list(reversed(languages)));ax.set_xlim(60,100);ax.set_ylim(-.7,25.7);ax.set_xlabel('Reported accuracy (%) · published 95% intervals');ax.grid(axis='x',alpha=.2);fig.legend(*ax.get_legend_handles_labels(),loc='lower left',bbox_to_anchor=(.18,.865),ncol=2,frameon=False)
fig.text(.075,.045,'ReviewsBoost compilation · Google EU DSA Table 3.2.3 · EEA/all-content estimates, not review-only odds.\nWhole-percentage endpoints; no sample sizes/covariance supplied here. No significance tests.',fontsize=10,color=GREY)
save(fig,'google-maps-language-26-comparisons')
fig,ax=plt.subplots(figsize=(12,7.8));fig.subplots_adjust(left=.18,right=.94,top=.72,bottom=.30)
fig.text(.075,.94,'650 interval comparisons, no extra review observations',fontsize=20,weight='bold',color=NAVY)
fig.text(.075,.885,'Each period contains 26 × 25 ÷ 2 = 325 unordered language pairs.',fontsize=12,color=GREY)
colors={'overlapping':BLUE,'touching':'#dfb567','separated':'#725d97'}
for y,period in enumerate(['2024H2','2025H1']):
    left=0;counts=D['summary']['within_period_relations'][period]
    for label in ['overlapping','touching','separated']:
        value=counts.get(label,0);ax.barh(y,value,left=left,color=colors[label],height=.45,label=label.title() if y==0 else None)
        if value>=12:ax.text(left+value/2,y,str(value),ha='center',va='center',color='white' if label!='touching' else INK,weight='bold')
        left+=value
    ax.text(330,y,' / '.join(f"{counts.get(k,0)} {k}" for k in ['overlapping','touching','separated']),va='center',fontsize=10)
ax.set_yticks([0,1],['Jul–Dec 2024','Jan–Jun 2025']);ax.invert_yaxis();ax.set_xlim(0,520);ax.set_xticks([0,100,200,300]);ax.set_xlabel('Number of unordered language pairs');fig.legend(*ax.get_legend_handles_labels(),loc='lower left',bbox_to_anchor=(.075,.155),ncol=3,frameon=False);ax.spines['right'].set_visible(False)
fig.text(.075,.11,'Relationships use printed closed-interval endpoints. Overlap is not equivalence;\nseparation is not a formal significance result. These are derived comparisons, not new cases.',fontsize=11,color=GREY)
fig.text(.075,.04,'ReviewsBoost original geometry analysis · Google EU DSA Table 3.2.3 · Historical EEA data',fontsize=10,color=GREY)
save(fig,'google-maps-language-interval-pairs')
print('Wrote three original SVG/PNG figure pairs (1200×780, 1200×1300, 1200×780).')
