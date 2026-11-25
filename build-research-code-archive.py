"""Package the scripts offered by ReviewsBoost research articles."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parent
PUBLIC_SCRIPTS = (
    "audit-google-maps-language-data.py",
    "audit-google-reply-study.py",
    "audit-google-review-coverage.py",
    "audit-google-staff-name-data.py",
    "build-google-maps-language-article.py",
    "build-google-maps-language-data.py",
    "build-google-removal-time-data.py",
    "build-google-reply-study.py",
    "build-google-review-coverage-article.py",
    "build-google-review-coverage-data.py",
    "build-google-sentiment-study.py",
    "build-google-staff-name-article.py",
    "build-google-staff-name-data.py",
    "google-review-extortion-analysis.py",
    "plot-google-fake-business-profiles.py",
    "plot-google-maps-language-study.py",
    "plot-google-removal-time-study.py",
    "plot-google-reply-study.py",
    "plot-google-review-coverage.py",
    "plot-google-sentiment-study.py",
    "plot-google-staff-name-study.py",
)


if __name__ == "__main__":
    with ZipFile(ROOT / "reviewsboost-research-code.zip", "w") as archive:
        for name in PUBLIC_SCRIPTS:
            entry = ZipInfo(name)
            entry.compress_type = ZIP_DEFLATED
            source = (ROOT / name).read_text(encoding="utf-8")
            archive.writestr(entry, source.encode("utf-8"))
