"""Render the checked aggregate release. Development dependency: Matplotlib."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
from matplotlib.patches import Patch

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-review-extortion-study.json').read_text(encoding='utf-8'))
BLUE='#087aca'; PALE='#cbdce9'; INK='#16223b'; MUTED='#53677a'; PAPER='#f8fbfe'
plt.rcParams.update({'font.family':'DejaVu Sans','svg.hashsalt':'reviewsboost-extortion-v1',
                     'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False})


def base(mobile, title, subtitle, left=.20):
    fig,ax=plt.subplots(figsize=(6.3,8.5) if mobile else (12,7.8),dpi=100)
    fig.patch.set_facecolor(PAPER);ax.set_facecolor(PAPER)
    fig.subplots_adjust(left=left, right=.94, top=.73 if mobile else .76, bottom=.23)
    fig.text(.06,.94,title,fontsize=18 if mobile else 25,fontweight='bold',color=INK,va='top')
    fig.text(.06,.825 if mobile else .855,subtitle,fontsize=13 if mobile else 17,color=MUTED,va='top')
    ax.tick_params(axis='both',labelsize=12 if mobile else 15,length=0,pad=10)
    ax.spines['bottom'].set_color('#b9cbd9');ax.set_axisbelow(True);ax.grid(axis='x',color='#e1eaf2')
    return fig,ax


def save(fig,name,mobile,footer):
    fig.text(.06,.07,footer,fontsize=10 if mobile else 12,color=MUTED,va='top')
    suffix='-mobile' if mobile else ''
    for extension in ['svg','png']:
        metadata={'Date':'2026-11-13','Creator':'ReviewsBoost; source CAFC open data'} if extension=='svg' else {'Software':'ReviewsBoost original analysis; source CAFC'}
        fig.savefig(ROOT/(name+suffix+'.'+extension),facecolor=fig.get_facecolor(),metadata=metadata)
    plt.close(fig)


for mobile in [False,True]:
    title='Most records have\nno recorded dollar loss' if mobile else 'Most selected records have no recorded dollar loss'
    fig,ax=base(mobile,title,'Broader extortion reports; not Google-review cases')
    groups=D['annual'];shares=[g['zero_loss_percent'] for g in groups]
    ax.barh(range(5),shares,color=BLUE,height=.53)
    ax.barh(range(5),[100-s for s in shares],left=shares,color=PALE,height=.53)
    ax.set_yticks(range(5),[str(g['year'])+('*' if g['year']==2025 else '') for g in groups]);ax.invert_yaxis()
    for i,g in enumerate(groups):ax.text(3,i,f"{g['zero_loss_percent']:.1f}%",va='center',color='white',fontsize=13 if mobile else 17,fontweight='bold')
    ax.set_xlim(0,100);ax.set_xticks([0,25,50,75,100]);ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:g}%'))
    ax.set_xlabel('Share of selected records in each period',fontsize=11 if mobile else 14,labelpad=15,color=MUTED)
    fig.legend(handles=[Patch(color=BLUE,label='$0 recorded'),Patch(color=PALE,label='Positive loss')],loc='lower left',bbox_to_anchor=(.06,.115),frameon=False,ncol=2,fontsize=11 if mobile else 14)
    save(fig,'google-extortion-zero-loss-years',mobile,'ReviewsBoost analysis of CAFC records. Canada + Extortion filter.\n*2025 is January–September only; 2021–2024 are full years.')

    title='A victim code is not\na dollar-loss threshold' if mobile else 'A victim code is not a positive-dollar-loss threshold'
    fig,ax=base(mobile,title,'One export, two separate fields',left=.29 if mobile else .24)
    labels=['Attempt','Victim','Other status*'];zero=[100,100*4328/6493,100]
    ax.barh(range(3),zero,color=BLUE,height=.48);ax.barh(range(3),[100-z for z in zero],left=zero,color=PALE,height=.48)
    ax.set_yticks(range(3),labels);ax.invert_yaxis();ax.set_xlim(0,100)
    for i,value in enumerate(zero):ax.text(4,i,f'{value:.1f}%',va='center',color='white',fontsize=14 if mobile else 19,fontweight='bold')
    ax.set_xticks([0,50,100]);ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:g}%'))
    ax.set_xlabel('Share within each publisher-coded status',fontsize=10 if mobile else 14,labelpad=15,color=MUTED)
    fig.legend(handles=[Patch(color=BLUE,label='$0 recorded'),Patch(color=PALE,label='Positive loss')],loc='lower left',bbox_to_anchor=(.06,.115),frameon=False,ncol=2,fontsize=11 if mobile else 14)
    save(fig,'google-extortion-status-loss',mobile,'CAFC Canada-coded extortion, 2021–September 2025. Not Google-only.\n*Other, Unknown and Incomplete combined. No causal claim.')

    title='Email contact and\nemail reporting differ' if mobile else 'Email contact and email reporting are different fields'
    fig,ax=base(mobile,title,'Same 22,801-record scope; different questions',left=.38 if mobile else .31)
    ax.barh([0,1],[6626,696],color=[BLUE,'#6d9bbd'],height=.45)
    ax.set_yticks([0,1],['Scam first contact:\nEmail','Report sent to CAFC:\nEmail']);ax.invert_yaxis();ax.set_xlim(0,8000)
    for i,value in enumerate([6626,696]):ax.text(value+150,i,f'{value:,}',va='center',fontsize=14 if mobile else 20,color=INK,fontweight='bold')
    ax.set_xticks([0,4000,8000]);ax.xaxis.set_major_formatter(FuncFormatter(lambda x,_:f'{x:,.0f}'))
    ax.set_xlabel('Selected report records',fontsize=11 if mobile else 14,labelpad=15,color=MUTED)
    save(fig,'google-extortion-email-fields',mobile,'Source fields: Solicitation Method and Complaint Received Type.\nReviewsBoost aggregation of CAFC data; not Google-specific counts.')
print('Rendered three original figures, each in desktop/mobile SVG and PNG.')
