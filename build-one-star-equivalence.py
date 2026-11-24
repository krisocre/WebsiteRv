"""Reproduce the synthetic one-star removal comparison and figure."""

import csv
import math
from fractions import Fraction
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MultipleLocator


ROOT = Path(__file__).resolve().parent
COUNTS = (20, 50, 100, 250, 500)
AVERAGES = (30, 35, 40, 42, 44, 45, 46, 47, 48, 49)
FIELDS = (
    "example_rating_count",
    "starting_exact_average",
    "total_stars_before",
    "total_stars_after_one_1_star_removal",
    "count_after_removal",
    "average_after_removal_rounded_6dp",
    "minimum_new_5_star_ratings",
    "equivalence",
)


def scenarios():
    for count in COUNTS:
        for tenths in AVERAGES:
            points = Fraction(count * tenths, 10)
            if points.denominator != 1 or points > 1 + 5 * (count - 1):
                continue
            points = int(points)
            after = Fraction(points - 1, count - 1)
            difference = count * after - points
            needed = math.ceil(difference / (5 - after)) if after < 5 else None
            if needed is not None:
                assert Fraction(points + 5 * needed, count + needed) >= after
                assert Fraction(points + 5 * (needed - 1), count + needed - 1) < after
            yield dict(zip(FIELDS, (
                count, f"{tenths / 10:.1f}", points, points - 1, count - 1,
                f"{float(after):.6f}", needed,
                "finite" if needed is not None else "unreachable_with_additions",
            )))


def save_figure(rows):
    examples = [row for row in rows if row["example_rating_count"] == 100]
    values = [row["minimum_new_5_star_ratings"] for row in examples]
    labels = [row["starting_exact_average"] for row in examples]
    fig, ax = plt.subplots(figsize=(12, 6.3), dpi=100)
    fig.patch.set_facecolor("#f4f8fe")
    ax.set_facecolor("#f4f8fe")
    fig.subplots_adjust(left=.1, right=.95, top=.71, bottom=.22)
    fig.text(.1, .89, "How many 5-star ratings match one removal?", size=25, weight="bold", color="#16223b")
    fig.text(.1, .825, "Illustrative Google rating math for a business with 100 ratings", size=15, color="#405471")
    bars = ax.bar(labels, values, color=["#3177b9"] * (len(values) - 1) + ["#16223b"], width=.64)
    ax.bar_label(bars, padding=4, fontsize=13, color="#16223b")
    ax.set_ylim(0, 74)
    ax.yaxis.set_major_locator(MultipleLocator(10))
    ax.set_axisbelow(True)
    ax.grid(axis="y", color="#d6e1ef")
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.spines["bottom"].set_color("#8ba1bf")
    ax.tick_params(axis="both", labelsize=13, colors="#405471", length=0, pad=9)
    ax.set_xlabel("Exact starting average", fontsize=14, labelpad=11, color="#16223b")
    fig.text(.1, .075, "Equivalent exact average after removing one existing 1-star rating", size=12, color="#405471")
    fig.text(.1, .036, "ReviewsBoost  •  Modelled examples", size=11, color="#405471")
    fig.savefig(ROOT / "one-star-google-rating-equivalence.png", dpi=100, facecolor=fig.get_facecolor())
    plt.close(fig)


if __name__ == "__main__":
    rows = list(scenarios())
    with (ROOT / "one-star-google-rating-equivalence.csv").open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    save_figure(rows)
