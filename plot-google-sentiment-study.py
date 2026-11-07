"""Original static research figures. Requires matplotlib==3.10.7; no remote fonts."""
from pathlib import Path
import json
import math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
from matplotlib.ticker import PercentFormatter, MultipleLocator

ROOT = Path(__file__).resolve().parent
D = json.loads((ROOT / 'google-review-sentiment-study.json').read_text(encoding='utf-8'))
BLUE, INK, MUTED, ORANGE = '#1766ba', '#172d46', '#52657e', '#a9571d'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 12,
                     'text.color': INK, 'axes.labelcolor': INK,
                     'axes.spines.top': False, 'axes.spines.right': False,
                     'svg.fonttype': 'path', 'svg.hashsalt': 'reviewsboost-sentiment-v1',
                     'savefig.facecolor': 'white'})


def save(fig, stem, title, description):
    fig.savefig(ROOT / (stem + '.png'), dpi=100, pil_kwargs={'optimize': True},
                metadata={'Software': 'ReviewsBoost / Matplotlib 3.10.7'})
    fig.savefig(ROOT / (stem + '.svg'), metadata={
        'Title': title, 'Description': description, 'Date': '2026-11-07',
        'Creator': 'ReviewsBoost Editorial Team',
        'Rights': 'CC BY 4.0. Source: Ioannis C. Drivas, doi:10.5281/zenodo.18594870; NLTK VADER.'})
    plt.close(fig)


def heading(fig, title, subtitle):
    fig.text(.075, .94, title, fontsize=21, weight='bold', color=INK)
    fig.text(.075, .89, subtitle, fontsize=12, color=MUTED)


def footer(fig, text):
    fig.text(.075, .055, text, fontsize=10, color=MUTED, linespacing=1.5)


fig, ax = plt.subplots(figsize=(12, 7.8))
fig.subplots_adjust(left=.23, right=.92, top=.76, bottom=.23)
heading(fig, 'The same reviews can receive different sentiment labels',
        '7,015 paired records | English-text input compared with processed-text input')
labels = ['negative', 'neutral', 'positive']
lookup = {(r['english_label'], r['processed_label']): r for r in D['transitions']}
for y, before in enumerate(labels):
    for x, after in enumerate(labels):
        row = lookup[before, after]
        color = '#eff3f7' if before == after else '#fde6ce' if {before, after} == {'negative', 'positive'} else '#dbeaf9'
        ax.add_patch(Rectangle((x-.5, y-.5), 1, 1, facecolor=color, edgecolor='white', linewidth=4))
        ax.text(x, y-.10, f"{row['review_count']:,}", ha='center', va='center', fontsize=24, weight='bold')
        ax.text(x, y+.20, f"{row['row_percent']:.1f}% of this English-label row", ha='center', va='center', fontsize=10)
ax.set(xlim=(-.5, 2.5), ylim=(2.5, -.5), xticks=range(3), yticks=range(3))
ax.set_xticklabels([s.title() for s in labels]); ax.set_yticklabels([s.title() for s in labels])
ax.xaxis.tick_top(); ax.xaxis.set_label_position('top'); ax.set_xlabel('Label from processed text', labelpad=15)
ax.set_ylabel('Label from English text', labelpad=15); ax.tick_params(length=0, pad=10)
for spine in ax.spines.values(): spine.set_visible(False)
fig.text(.23, .16, 'Grey: unchanged    Blue: to/from neutral    Orange: positive ↔ negative', fontsize=11)
footer(fig, '1,403 labels changed (20.0%); 356 crossed directly between positive and negative (5.1%).\nReviewsBoost reanalysis of Drivas’s public library corpus. Model labels are not authenticity or removal decisions.')
save(fig, 'google-sentiment-label-transitions', 'Paired VADER sentiment label transitions',
     'Counts and row percentages for two text representations of the same 7,015 reviews. Not model accuracy or removal odds.')

fig, ax = plt.subplots(figsize=(12, 7.8))
fig.subplots_adjust(left=.10, right=.94, top=.77, bottom=.25)
heading(fig, 'Label changes were more common in low-star records',
        'Percentage changing class when the processed-text field replaces the English-text field')
rows = D['rating_strata']; xs = list(range(5)); rates = [r['changed_percent'] for r in rows]
bars = ax.bar(xs, rates, color=[ORANGE, ORANGE, BLUE, BLUE, BLUE], width=.62)
for bar, row in zip(bars, rows):
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+1.2, f"{row['changed_percent']:.1f}%", ha='center', fontsize=18, weight='bold')
    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+5, f"{row['changed_labels']:,} / {row['reviews']:,}", ha='center', fontsize=10, color=MUTED)
ax.set_xticks(xs, [f"{r['stars']} star{'s' if r['stars'] != 1 else ''}\nn = {r['reviews']:,}" for r in rows])
ax.set_ylim(0, math.ceil((max(rates)+10)/5)*5); ax.yaxis.set_major_formatter(PercentFormatter(100))
ax.yaxis.set_major_locator(MultipleLocator(10)); ax.set_axisbelow(True); ax.grid(axis='y', alpha=.16)
ax.set_ylabel('Changed sentiment labels within each star group')
footer(fig, 'Denominators differ across star groups. Stars were not used to train, correct or validate the sentiment model.\nReviewsBoost analysis | Source: Drivas, doi:10.5281/zenodo.18594870 | Fixed NLTK VADER 3.9.4.')
save(fig, 'google-sentiment-changes-by-stars', 'Sentiment label changes by review star rating',
     'Observed change proportions among 536 one-star, 231 two-star, 353 three-star, 937 four-star and 4,958 five-star records.')

fig, ax = plt.subplots(figsize=(12, 7.8))
fig.subplots_adjust(left=.10, right=.94, top=.77, bottom=.25)
heading(fig, 'A classification cutoff is another analytical choice',
        'All 50 cutoffs reuse the same 7,015 paired records; none measures Google removal probabilities')
rows = D['threshold_sensitivity']; xs = [r['absolute_cutoff'] for r in rows]
ax.plot(xs, [r['changed_percent'] for r in rows], color=BLUE, linewidth=2.8, label='Any label change')
ax.plot(xs, [r['direct_opposite_percent'] for r in rows], color='#397469', linewidth=2.5, label='Positive ↔ negative only')
ax.axvline(.05, color=ORANGE, linestyle='--', linewidth=1.5)
default = next(r for r in rows if r['absolute_cutoff'] == .05)
ax.scatter([.05], [default['changed_percent']], color=ORANGE, zorder=5, s=70)
ax.annotate(f"Conventional ±0.05 cutoff\n{default['changed_percent']:.1f}% changed", (.05, default['changed_percent']),
            xytext=(.13, default['changed_percent']+7), arrowprops={'arrowstyle': '-', 'color': ORANGE}, fontsize=12, color=ORANGE)
ax.set_xlim(.01, .50); ax.set_ylim(0, max(35, math.ceil(max(r['changed_percent'] for r in rows)/5)*5+5))
ax.yaxis.set_major_formatter(PercentFormatter(100)); ax.xaxis.set_major_locator(MultipleLocator(.1))
ax.set_xlabel('Absolute compound-score cutoff (±t)'); ax.set_ylabel('Share of the same paired review records')
ax.grid(alpha=.15); ax.legend(frameon=False, loc='lower right')
footer(fig, 'Positive ≥ +t; negative ≤ −t; neutral between. This sensitivity sweep is not 50 independent samples.\nReviewsBoost original calculations from fixed scores on two source text fields; conventional VADER threshold attributed.')
save(fig, 'google-sentiment-threshold-sensitivity', 'Sentiment label change sensitivity to cutoff',
     'Changing the classification cutoff changes reported disagreement. The fixed source records and scorer are unchanged.')

fig = plt.figure(figsize=(12, 6.3)); fig.patch.set_facecolor('#f4f7fb')
fig.text(.075, .88, 'REVIEWSBOOST  /  ORIGINAL REANALYSIS', color=BLUE, fontsize=14, weight='bold')
fig.text(.075, .68, 'Google review sentiment', fontsize=34, weight='bold')
fig.text(.075, .57, 'The preprocessing problem', fontsize=27, color=MUTED)
fig.text(.075, .29, '20.0%', fontsize=73, weight='bold', color=BLUE)
fig.text(.43, .35, '1,403 labels changed', fontsize=24, weight='bold')
fig.text(.43, .25, '7,015 reviews · 86 library profiles', fontsize=17, color=MUTED)
fig.text(.075, .10, 'Same scorer, two stored text fields. Not a fake-review rate. November 2026.', fontsize=12, color=MUTED)
save(fig, 'google-sentiment-study-cover', 'Google review sentiment: the preprocessing problem',
     'ReviewsBoost paired reanalysis: 1,403 of 7,015 labels changed between two stored input fields; not a removal or authenticity statistic.')
print('PASS: three original 1200x780 figures and a 1200x630 social cover exported as PNG and SVG.')
