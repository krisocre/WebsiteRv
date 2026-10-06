"""Reproduce the research figure from the downloadable JSON. Requires Matplotlib.
Original figure: ReviewsBoost, CC BY 4.0. Underlying numbers: Google disclosures.
"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator

root = Path(__file__).resolve().parent
data = json.loads((root / 'google-fake-business-profile-data.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11, 'svg.fonttype': 'none'})
fig, axes = plt.subplots(2, 1, figsize=(12, 7.8), dpi=100)
fig.patch.set_facecolor('#f5f8fc')
fig.subplots_adjust(left=.09, right=.95, top=.75, bottom=.19, hspace=.67)
fig.text(.07, .95, 'GOOGLE MAPS / SOURCE AUDIT / 2019–2025', fontsize=11, color='#32617d')
fig.text(.07, .9, 'Profiles and creation attempts are different measures', fontsize=19, weight='bold', color='#12314b')
fig.text(.07, .85, 'Published headline numbers, with qualifiers retained. These are not exact annual totals.', fontsize=10, color='#526575')
for ax, metric, title, color in zip(axes, ['fake_profile_actions','fake_profile_creation_attempts'], ['Fake profile actions: removed or blocked (wording varies by year)', 'Fake profile creation attempts stopped'], ['#087fe8','#97611f']):
    records = [r for r in data['rows'] if r['metric'] == metric]
    for r in records:
        year = r['activity_year']
        if r['reported_number'] is None:
            ax.text(year, .8, 'Not\ndisclosed', ha='center', fontsize=9, color='#687888')
            continue
        value = r['reported_number'] / 1_000_000
        qualifier = r['qualifier']
        label = ('>' if qualifier == 'more_than' else 'Nearly ' if qualifier == 'nearly' else '') + f'{value:g}m'
        marker = '^' if qualifier == 'more_than' else 'D' if qualifier == 'nearly' else 'o'
        ax.scatter(year, value, marker=marker, s=90, color=color, zorder=3)
        ax.annotate(label, (year, value), xytext=(0, 12), textcoords='offset points', ha='center', fontsize=10, weight='bold', color='#12314b')
    ax.set_title(title, loc='left', fontsize=12, weight='bold', pad=18, color='#12314b')
    ax.set_xlim(2018.6, 2025.4)
    ax.set_xticks(range(2019, 2026))
    ax.set_ylim(0, 17 if metric == 'fake_profile_actions' else 25)
    ax.set_ylabel('Million profiles' if metric == 'fake_profile_actions' else 'Million attempts')
    ax.yaxis.set_major_locator(MultipleLocator(5))
    ax.grid(axis='y', alpha=.2)
    ax.set_axisbelow(True)
    ax.set_facecolor('#ffffff')
    for side in ['top','right']:
        ax.spines[side].set_visible(False)
fig.text(.07, .115, '> means more than the plotted number. “Nearly” is approximate; unqualified figures are reported headlines.', fontsize=9, color='#526575')
fig.text(.07, .085, 'Missing disclosures have no plotted value. No growth rate or cumulative total is inferred.', fontsize=9, color='#526575')
fig.text(.07, .045, 'Sources: seven Google annual Maps enforcement announcements. Compilation: ReviewsBoost, 6 October 2026 / CC BY 4.0.', fontsize=9, color='#32617d')
for extension in ['svg','png']:
    fig.savefig(root / ('google-fake-business-profile-enforcement.' + extension), dpi=100, metadata={'Creator':'ReviewsBoost'} if extension == 'svg' else {'Software':'ReviewsBoost / Matplotlib'})
plt.close(fig)
