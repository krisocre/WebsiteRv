"""Render the original ReviewsBoost figure from the published analysis CSV.

Requires matplotlib. Run from this file's directory after generating the CSV.
Chart and compilation: CC BY 4.0; source publication rights remain with Yelp.
"""
import csv
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
with (root / 'yelp-review-status-2025.csv').open(encoding='utf-8', newline='') as source:
    rows = list(csv.DictReader(source))

plt.rcParams.update({'font.family': 'DejaVu Sans', 'svg.fonttype': 'none'})
fig = plt.figure(figsize=(12, 6.3), dpi=100, facecolor='#f5f8fc')
fig.text(.055, .925, 'REVIEWSBOOST  /  SOURCE DATA EXPLAINED', color='#0568c0', fontsize=11, weight='bold')
fig.text(.055, .845, 'Filtered does not mean deleted', fontsize=27, color='#16223b', weight='bold')
fig.text(.055, .782, 'Yelp review contributions in 2025 · Global · Rounded source shares', fontsize=13, color='#566478')
ax = fig.add_axes((.30, .255, .60, .43))
colors = ['#1b63b7', '#087f80', '#a33d24', '#566478']
for i, (row, color) in enumerate(zip(rows, colors)):
    share = int(row['reported_share_percent'])
    ax.barh(i, share, height=.56, color=color)
    ax.text(share + 1.3, i, f'{share}%', va='center', fontsize=15, weight='bold', color='#16223b')
ax.set_yticks(range(4), [r['status'] for r in rows], fontsize=13, color='#16223b')
ax.invert_yaxis()
ax.set_xlim(0, 80)
ax.set_xticks([0, 20, 40, 60, 80], ['0%', '20%', '40%', '60%', '80%'], fontsize=11, color='#566478')
ax.set_facecolor('#f5f8fc')
ax.set_axisbelow(True)
ax.grid(axis='x', color='#dce3eb', linewidth=.8)
ax.tick_params(axis='both', length=0, pad=12)
for spine in ax.spines.values():
    spine.set_visible(False)
fig.text(.055, .135, '17 / (17 + 11 + 2) = 56.7%', fontsize=16, weight='bold', color='#16223b')
fig.text(.055, .09, 'Share of the combined non-recommended + removed group that was filtered, not deleted.', fontsize=11, color='#566478')
fig.text(.055, .033, 'Source: Yelp, 2025 Trust & Safety Report (Feb. 25, 2026). Analysis: reviewsboost.ca · Not Canadian success odds.', fontsize=9, color='#566478')
for extension in ['svg', 'png']:
    fig.savefig(root / f'yelp-review-status-2025.{extension}', dpi=100, facecolor=fig.get_facecolor())
plt.close(fig)
