# ReviewsBoost reply/removal timing research

Published October 27, 2026, version 1.0. Brand: ReviewsBoost only.
Article: `/google-review-replies-removal-bias-study.html`.

## Original contribution

Six attributed deleted-review rows are joined to 18 conditional timing cells.
Under an explicitly assumed same-review `R < T` ordering, reply-bin lower bounds
can rule out an earlier deletion window. This is a compatibility model, not a
causal estimate, an observed outcome or proof that the source pipeline obeys the
assumption. The source itself already cautions against causal reply-speed claims;
the article acknowledges that and adds formal constraints and precision checks.

The six row counts total 326,224; the difference from the declared study total of
335,520 is 9,296 (2.7706%). We do not label this lost data, invent a seventh group,
or infer its reply behaviour. Raw record-level inclusion rules are unavailable.

For a separately declared nearest-tenth half-up rounding model, the 0.0% display
and row size 38,145 permit integer counts 0–19 before applying any time-order
restriction. The six rounding intervals sum to 96,837–97,138, conditional on the
row and rounding assumptions. Those are compatible values, not measured events.

Source: Localo, May 29, 2026. The fresh October 27 source text has SHA-256
`3a4f5051be6e999f87168b151bb13b17e23162134cde4f08e5857f71f1b7a273`.
Raw captures stay excluded under `research-sources/reply-study/`. The public input
file contains numerical rows, provenance and model conventions. Samy Suissa's
2008 paper supplies general time-bias context, not Google-specific validation.
Google's reply and reporting guidance are cited for the separate practical tasks.

## Reproduce

```
python build-google-reply-study.py
python audit-google-reply-study.py
python plot-google-reply-study.py
python build-google-reply-article.py
node build-legal-pages.cjs
node seo-audit.mjs
```

The builder uses Python's standard library. The independent audit enumerates
integer counts rather than reuse the builder's interval formula. Plotting needs
Matplotlib. Two CSVs have CSVW column definitions; combined JSON, source inputs,
BibTeX and reproduction scripts are downloadable. Three SVG/PNG pairs are new,
with 1200×780 PNG dimensions. Original analysis and charts are CC BY 4.0, while
external source materials retain their own rights.

## Limits and discovery

No raw timestamps, complete reappearance histories, all-posted-review comparison
group, causal effect, Canadian cohort or client outcome data were obtained. Reply
interval boundaries and rounding are stated assumptions. A late-reply zero is
not evidence that waiting protects a review. The publication discloses the
commercial interest and does not promise rankings or removals.

Blog feature/ItemList, homepage research link, RSS, image sitemap, resource index
and a contextual response-guide link are updated. The older observation-window
study stays linked from the blog and the new article. Article, Dataset and three
ImageObjects share consistent identifiers and licence/source metadata. This notes
file is excluded from the published site.
