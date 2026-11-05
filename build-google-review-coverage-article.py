"""Build the coverage article and scoped blog/RSS/sitemap discovery entries."""
from pathlib import Path
import html,json,re

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-review-coverage-study.json').read_text(encoding='utf-8'))
DATE=D['published'];URL=D['article_url'];LICENSE=D['license']
FILE=URL.rsplit('/',1)[1]
TITLE='Google Review Widgets: The 5-Review Limit | ReviewsBoost'
H1='The five-review blind spot in Google review widgets'
DESC='Why a Google review widget can miss reviews: 189 original coverage calculations, three charts and open data explain the five-review API limit.'
esc=lambda value:html.escape(str(value),quote=True)
sources={s['id']:s for s in D['source_inputs']['sources']}
def ref(key,label):return '<a href="'+esc(sources[key]['url'])+'">'+label+'</a>'
def table(caption,headers,rows):
    return '<div class="table-scroll" role="region" tabindex="0" aria-label="'+esc(caption)+'"><table class="comparison"><caption>'+caption+'</caption><thead><tr>'+''.join('<th scope="col">'+h+'</th>' for h in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+str(v)+('</th>' if i==0 else '</td>') for i,v in enumerate(row))+'</tr>' for row in rows)+'</tbody></table></div>'
images=[('google-review-five-record-coverage','Maximum five-record coverage declines from 100 percent at five ratings to 0.1 percent at 5,000 ratings; logarithmic percentage axis.'),
        ('google-review-random-sample-misses','Constructed random-sampling probabilities of missing ten target records range from 1.6 percent in twenty records to 95.1 percent in one thousand; these are not Google detection rates.'),
        ('google-review-refresh-coverage-bounds','In a fixed population of one hundred records, twenty five-record snapshots can contain between five and one hundred unique records.')]
def figure(index,caption):
    name,alt=images[index]
    return f'<figure class="data-figure"><a href="{name}.svg"><img src="{name}.svg" width="1200" height="780" loading="lazy" decoding="async" alt="{esc(alt)}"></a><figcaption>{caption} <a href="{name}.svg" download>SVG</a> · <a href="{name}.png" download>PNG</a>.</figcaption></figure>'

distribution_files=[('google-review-api-facts.csv','12 attributed documentation facts','text/csv'),
                    ('google-review-snapshot-coverage.csv','Nine constructed coverage bounds','text/csv'),
                    ('google-review-sampling-scenarios.csv','159 hypothetical random-sample scenarios','text/csv'),
                    ('google-review-refresh-bounds.csv','21 constructed refresh envelopes','text/csv'),
                    ('google-review-coverage-study.json','Complete release with source provenance and assumptions','application/json')]
distributions=[{'@type':'DataDownload','name':label,'contentUrl':'https://reviewsboost.ca/'+name,'encodingFormat':kind} for name,label,kind in distribution_files]
image_nodes=[{'@type':'ImageObject','@id':'https://reviewsboost.ca/'+name+'.png#image','contentUrl':'https://reviewsboost.ca/'+name+'.png','url':'https://reviewsboost.ca/'+name+'.png','width':1200,'height':780,'caption':alt,'creditText':'ReviewsBoost original calculations and charts; input definitions attributed to Google and R documentation','creator':{'@id':'https://reviewsboost.ca/#organization'},'license':LICENSE,'acquireLicensePage':URL+'#downloads'} for name,alt in images]
graph={'@context':'https://schema.org','@graph':[
    {'@type':'Organization','@id':'https://reviewsboost.ca/#organization','name':'ReviewsBoost','url':'https://reviewsboost.ca/'},
    {'@type':'Article','@id':URL+'#article','url':URL,'headline':H1,'description':DESC,'datePublished':DATE,'dateModified':DATE,'author':{'@type':'Organization','name':'ReviewsBoost Editorial Team','url':'https://reviewsboost.ca/editorial-policy.html#authorship'},'publisher':{'@id':'https://reviewsboost.ca/#organization'},'inLanguage':'en-CA','isAccessibleForFree':True,'mainEntityOfPage':URL,'mainEntity':{'@id':URL+'#dataset'},'articleSection':'Google review monitoring / original analysis','citation':[s['url'] for s in sources.values()],'image':[{'@id':node['@id']} for node in image_nodes]},
    {'@type':'Dataset','@id':URL+'#dataset','identifier':URL+'#dataset','name':D['title'],'url':URL,'description':'Documentation audit with 12 source facts and 189 constructed calculation rows: nine coverage bounds, 159 hypothetical uniform-random sample scenarios, and 21 set-overlap envelopes. No newly observed reviews or businesses; model probabilities are not Google detection or removal rates.','version':'1.0.0','datePublished':DATE,'dateModified':DATE,'creator':{'@id':'https://reviewsboost.ca/#organization'},'publisher':{'@id':'https://reviewsboost.ca/#organization'},'license':LICENSE,'inLanguage':'en-CA','isAccessibleForFree':True,'subjectOf':{'@id':URL+'#article'},'measurementTechnique':'Documented API capability audit, count-coverage upper bounds, exact hypergeometric reference calculations, and deterministic set-overlap bounds','variableMeasured':['documented review response limits and ordering','constructed upper bound on count coverage','hypothetical random-sample miss probability','constructed minimum and maximum unique records across snapshots'],'isBasedOn':[sources[k]['url'] for k in ['places','gbp-list','hypergeometric']],'citation':[sources[k]['url'] for k in ['places','gbp-list','hypergeometric']],'distribution':distributions},
    {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':'https://reviewsboost.ca/'},{'@type':'ListItem','position':2,'name':'Learning Centre','item':'https://reviewsboost.ca/blog.html'},{'@type':'ListItem','position':3,'name':'Google review widget coverage','item':URL}]},*image_nodes]}

template=(ROOT/'google-reviews-staff-names-study.html').read_text(encoding='utf-8')
header=re.search(r'<header class="site-header">[\s\S]*?</header>',template)[0]
footer=re.search(r'<footer class="site-footer">[\s\S]*?</footer>',template)[0]
sections=[('answer','The five-review limit'),('endpoints','What the documentation says'),('coverage','Original coverage calculations'),('sampling','A random-sample benchmark'),('refresh','Why refreshes do not add up'),('selection','Two different selection problems'),('workflow','A Canadian business workflow'),('methods','Methods and limits'),('questions','Questions and answers'),('downloads','Data and citation'),('sources','Sources')]
toc=''.join(f'<li><a href="#{key}">{label}</a></li>' for key,label in sections)
coverage_rows=[[f"{r['total_ratings_n']:,}",str(r['max_places_records']),f"{r['max_count_coverage_pct']:g}%",f"{r['minimum_records_not_in_response']:,}",str(r['gbp_pages_at_50_full_records'])] for r in D['coverage']]
model_rows=[next(r for r in D['random_sample_scenarios'] if r['population_n']==n and r['target_records_k']==10 and r['sample_size_s']==5) for n in [20,50,100,200,500,1000]]
refresh_rows=[r for r in D['refresh_envelopes'] if r['population_n']==100]

body=f'''
<h2 id="answer">Why does a Google review widget show only five reviews?</h2>
<p>A widget built from one Google Places API (New) response can receive at most five review records. The same response can include an aggregate rating and a much larger rating count. A panel showing five comments beside hundreds of ratings can therefore be working as designed. It is not a complete review inventory. {ref('places','Google’s Place resource documentation')}.</p>
<p>This matters when a business uses its website widget to check for a harmful review, verify a reported removal or decide whether every new review has been answered. Those tasks require knowing which records were inspected and which were outside the response.</p>
<div class="callout"><strong>Three findings you can check and cite</strong><ul>
<li><strong>Five records represent at most 0.5% of a 1,000-rating count.</strong> This is count arithmetic, not a sample of Canadian businesses.</li>
<li><strong>A random five-record sample would miss all ten targets in a 200-record population 77.2% of the time.</strong> This is a hypothetical benchmark. Google documents relevance ordering, so it is not Google’s measured detection rate.</li>
<li><strong>Twenty five-record refreshes can still show the same five records.</strong> One hundred unique records is a possible upper bound, not a coverage guarantee.</li>
</ul></div>
<p><strong>What we published:</strong> a new, reproducible compilation of 12 documentation facts and 189 constructed calculation rows, with three original charts. We collected no customer review histories and measured no removal outcomes. <a href="#methods">Methods and limits</a> · <a href="#downloads">Download the release</a>.</p>

<h2 id="endpoints">Two Google interfaces, two different jobs</h2>
<p>Google describes the Places review array as “A maximum of 5 reviews can be returned.” Its documented ordering is relevance. The authorised Business Profile review-list method offers pagination and a maximum requested page size of 50. That is a per-page limit, rather than a 50-review ceiling for a location. {ref('places','Places reference')} · {ref('gbp-list','Business Profile review-list reference')}.</p>
{table('Documentation audit as checked November 5, 2026; capabilities do not establish any particular widget’s implementation.',['Question','Places API (New)','Business Profile reviews.list'],[
 ['How many records in one response?','Up to 5','Requested page size up to 50'],
 ['Is review pagination documented here?','No review continuation field in the Place resource','Yes, through nextPageToken'],
 ['What is the default selection/order?','Relevance','Latest modification first'],
 ['Is a broader aggregate available?','rating and userRatingCount','averageRating and totalReviewCount'],
 ['Who can use the route?','A configured Places application under its access terms','Appropriately authorised access to a verified location']])}
<p>Ask your widget or monitoring provider which route it uses. Some products have authorised access or their own permitted integrations, so the five-record cap must not be applied to every product calling itself a Google review widget. A longer carousel also does not reveal its data source.</p>

<h2 id="coverage">Original dataset: how much can five records cover?</h2>
<p>For an aggregate count <code>N</code>, the most a five-record response can represent by count is <code>100 × min(5,N) / N</code> percent. This assumes all five slots are populated. A shorter response represents less.</p>
<p>There is an important denominator detail: Google’s aggregate count includes ratings without written comments. A share of that count is not the same thing as the share of all written reviews retrieved. We cannot turn an API field definition into a count of missing comments. {ref('places','Definition of userRatingCount')}.</p>
{figure(0,'Figure 1. Original coverage bounds for nine constructed rating counts. Each dot assumes five returned records. The percentage axis is logarithmic; these are not nine observed businesses.')}
{table('Constructed upper bounds, with idealised full-page arithmetic for an authorised Business Profile collection.',['Aggregate count N','Records shown','Maximum count coverage','Not in this response, at least','Pages at 50*'],coverage_rows)}
<p><small>*Pages are <code>ceil(N/50)</code> under a stable, accessible collection with full pages. Follow the actual continuation tokens; count changes, shorter responses and access restrictions can change the work needed.</small></p>
<p>The change from 100 to 1,000 ratings leaves the five-record cap unchanged while reducing this coverage ceiling from 5% to 0.5%. The additional history belongs to the profile, not automatically to the widget’s evidence set. Keep the aggregate rating supplied by Google separate from any average calculated from displayed excerpts.</p>

<h2 id="sampling">A benchmark for what five records can miss</h2>
<p>We constructed 159 finite-population scenarios using nine population sizes, up to seven target counts and sample sizes of one, three and five. A <em>target</em> means a record someone wants to find. It does not mean a one-star, fake or policy-violating review.</p>
<p>In a hypothetical uniform sample without replacement, the probability of finding none of <code>K</code> targets in <code>S</code> draws from <code>N</code> records is <code>C(N−K,S) / C(N,S)</code>. The probability of finding at least one is its complement. This is the hypergeometric model described in the {ref('hypergeometric','R statistics reference')}.</p>
{figure(1,'Figure 2. Original exact calculations for a random five-record sample with ten hypothetical target records. The figure illustrates limited sample coverage, not Google ranking behaviour, abuse prevalence or removal success.')}
{table('Hypothetical random-sample benchmark: ten targets, five draws, fixed population.',['Total records N','Targets K','Chance of missing all targets'],[[f"{r['population_n']:,}",'10',f"{r['miss_pct']:.2f}%"] for r in model_rows])}
<p>At <code>N=200</code>, <code>K=10</code> and <code>S=5</code>, the exact calculation gives a 77.17% miss probability. It does <strong>not</strong> say a real Google widget misses harmful reviews 77.17% of the time. A relevance-based selector could include or omit particular targets systematically. Without observing that selector, these model values cannot be calibrated into actual detection rates.</p>
<p>There is an even simpler result when only one record matters: its inclusion probability in this random benchmark is <code>S/N</code>. Five random records from 500 would have a 1% inclusion probability for that one target. Again, that is a reference calculation rather than a prediction for Google.</p>

<h2 id="refresh">Does refreshing the widget solve the coverage problem?</h2>
<p>Refreshing a five-record response twenty times creates twenty responses. It does not establish that their records are different. Under our explicit assumption that every response contains five records from one unchanged population, the distinct-record count can range from <code>5</code> to <code>min(N,5T)</code>, where <code>T</code> is the number of snapshots.</p>
{figure(2,'Figure 3. Original set-overlap envelope for a fixed 100-record population. At twenty snapshots, both five unique records and one hundred unique records fit these assumptions. The shaded region is not a confidence interval.')}
{table('Constructed unique-record bounds for 100 unchanged records and exactly five records per snapshot.',['Snapshots','Minimum unique','Maximum unique'],[[str(r['snapshots_t']),str(r['minimum_unique_records']),str(r['maximum_unique_records'])] for r in refresh_rows])}
<p>The release includes 21 such envelopes for populations of 20, 100 and 1,000. They say nothing about how often Google changes its selected records. In particular, multiplying the number of refreshes by five counts returned slots, not necessarily new observations. The assumptions are incompatible with interpreting the shaded region as a measured service level.</p>

<h2 id="selection">Review creation and review selection are separate problems</h2>
<p>Selection begins before a widget is involved. Schoenmueller, Netzer and Stahl’s 2020 study examined more than 280 million reviews across 25 platforms and investigated why people with extreme evaluations are more likely to contribute reviews. Their cross-platform findings concern who writes a review; they do not estimate a five-record Google widget’s performance. {ref('polarity','The Polarity of Online Reviews, Journal of Marketing Research')}.</p>
<p>Our audit concerns a later selection step: which existing records a particular response exposes. The two mechanisms should not be folded into one bias estimate. The paper’s dataset is cited as research context; we did not obtain or reanalyse its individual records, and its review count is not part of our 189-row calculation dataset.</p>
<p>This also explains why an average of the five visible star ratings is a weak substitute for a profile’s aggregate. It combines a selected excerpt set with a different denominator. Show the authoritative aggregate when available and describe the excerpts as excerpts.</p>

<h2 id="workflow">A monitoring workflow for Canadian businesses</h2>
<p>The practical issue is the same for a Toronto salon, a Mississauga repair shop or a Vancouver café: first establish what the monitoring view actually covers. These examples are illustrative. We have not estimated city-specific missing-review rates.</p>
<ol><li><strong>Identify the source.</strong> Record whether a panel uses one Places response, authorised Business Profile access, a native management screen or another permitted source. Ask how it handles pagination and records without comments.</li>
<li><strong>Separate aggregate counts from inspected records.</strong> A profile count of 500 and a retrieved set of five are two different measurements. Keep the source and retrieval time beside each.</li>
<li><strong>Check the review itself.</strong> A record absent from a widget may still exist in Google’s interface. Review processing, profile changes and policy action are among the explanations Google gives for actual visibility issues. {ref('missing','Google’s missing-review guidance')}.</li>
<li><strong>Track modifications as well as new posts.</strong> The Business Profile Review resource distinguishes creation from latest modification. A process looking only at creation time can overlook a changed older record. Its last-modified field still does not explain why an edit occurred. {ref('gbp-review','Review timestamp definitions')}.</li>
<li><strong>Check the implementation’s permissions and data rules.</strong> API access does not authorise unrestricted copying of review text or indefinite retention. Plan the monitoring process around the applicable access, storage and attribution requirements. {ref('places-policy','Places API policies')}.</li></ol>
<p>When a particular review may violate policy, preserve the public link and a factual account of the issue through an appropriate process. A widget gap does not prove that a report worked. Our <a href="google-review-removal-checker.html">review evidence checker</a> helps organise a concern, while the <a href="google-review-removal-time-study.html">removal timing study</a> explains why stages and outcomes need different labels.</p>
<div class="callout"><strong>Need help with a specific review?</strong><p>ReviewsBoost assists Canadian businesses with review assessment, reporting and reputation monitoring. Start with a <a href="/#assessment">free assessment request</a> or read about <a href="online-reputation-management.html">our monitoring approach</a>. We explain the scope before paid work; Google decides removal and no result is guaranteed.</p></div>

<h2 id="methods">Methods, provenance and limits</h2>
<p><strong>Study type:</strong> a documentation audit and constructed reference dataset, version 1.0.0. Source definitions were checked on November 5, 2026. The twelve source-fact rows preserve the endpoint, field, interpretation and attribution. The public source manifest records seven retrieved source fingerprints and access dates.</p>
<p>The nine coverage rows use rating counts of 5, 10, 20, 50, 100, 200, 500, 1,000 and 5,000. The sampling grid uses target counts of 1, 2, 5, 10, 20, 50 and 100 where they fit the population, crossed with sample sizes 1, 3 and 5. That produces 159 valid scenarios. The refresh grid uses three population sizes and seven snapshot counts, giving 21 envelopes. Together these are <strong>189 constructed calculations, not 189 businesses or additional observations</strong>.</p>
<p>The builder uses exact integer combinations and reduced fractions before decimal formatting. The independent audit instead multiplies successive conditional miss fractions and enumerates all subsets for small populations. It checks every arithmetic row, the CSV/JSON/CSVW correspondence, documentation constants and locally captured source fingerprints. Exact fraction components are strings in JSON to preserve large integers for JavaScript consumers. Charts are rendered from the release file.</p>
<p>The API facts are version-specific. Actual responses can be shorter, rating counts can change, and an authorised collection can change while it is being paginated. We neither queried Google for individual businesses nor scraped review text. The random model assumes a selection process that the documented Places endpoint does not claim to use. The refresh envelopes assume an unchanged population and exactly five returned records each time. Neither model estimates an empirical Google probability.</p>
<p><strong>Commercial interest:</strong> ReviewsBoost sells review-related assistance. This publication reports no customer results, proprietary fraud detector, ranking experiment or independent peer review. Our contribution is the new documented compilation, calculations and original charts. Requests for corrections can be made through our <a href="editorial-policy.html">editorial policy</a>.</p>

<h2 id="questions">Questions about missing reviews and widgets</h2>
<h3>Does a missing widget review mean Google removed it?</h3><p>No. First check the actual review and the relevant business-management view. A selected response omits many records by design, so omission is not a removal confirmation.</p>
<h3>Can every Google review widget show all reviews?</h3><p>The answer depends on the product’s permitted data source and access. One Places API (New) response has a five-record maximum. That does not describe every authorised integration or Google’s own interfaces.</p>
<h3>Can I infer Google’s real miss rate from your probability chart?</h3><p>No. Its numbers assume uniform random sampling without replacement. Google documents relevance ordering. Our chart is a transparent mathematical benchmark, not an observed widget-performance study.</p>
<h3>Does requesting 50 Business Profile records mean I have every review?</h3><p>No. Fifty is the maximum requested page size. Where a continuation token is returned, more pages remain. The operation also requires the right authorisation and a verified location.</p>
<h3>Will more frequent refreshes guarantee a complete history?</h3><p>No completeness guarantee follows from a response cap. Count distinct review identifiers through a permitted process rather than treating returned slots as new records. Our chart shows how repeated overlap can leave coverage unchanged.</p>

<h2 id="downloads">Download the data, reproduce the figures and cite the work</h2>
<ul>{''.join('<li><a href="'+name+'" download>'+label+'</a>'+(' · <a href="'+name+'-metadata.json" download>CSVW field definitions</a>' if kind=='text/csv' else '')+'.</li>' for name,label,kind in distribution_files)}
<li><a href="google-review-coverage-sources.json" download>Source manifest, field audit and SHA-256 fingerprints</a>.</li>
<li><a href="build-google-review-coverage-data.py" download>Data builder</a> · <a href="audit-google-review-coverage.py" download>Independent arithmetic audit</a> · <a href="plot-google-review-coverage.py" download>Chart script</a> · <a href="build-google-review-coverage-article.py" download>Article builder</a>.</li>
<li><a href="google-review-coverage-study.bib" download>BibTeX citation</a> · <a href="google-review-coverage-study.cff" download>Citation File Format</a>.</li></ul>
<p>Rebuild with <code>python build-google-review-coverage-data.py</code>, then <code>python audit-google-review-coverage.py</code>. Plotting uses <code>python plot-google-review-coverage.py</code> and Matplotlib. The optional <code>--capture</code> flag on the data builder refreshes private source captures and public fingerprints; it does not collect user reviews.</p>
<p>Our original compilation, calculations and chart artwork are released under <a href="{LICENSE}">CC BY 4.0</a>. Source publishers retain rights in their documentation and article. Cite Google for the API limits and ReviewsBoost for this compilation and derived calculations; label the probability examples as hypothetical.</p>
<div class="callout"><strong>Suggested citation</strong><p>ReviewsBoost Editorial Team. (2026, November 5). <em>Google review widget coverage: documentation audit and constructed reference calculations</em> (Version 1.0.0). <a href="{URL}">Article and open dataset</a>.</p></div>

<h2 id="sources">Primary sources and research context</h2>
<ol class="sources"><li>{ref('places','Google Maps Platform, Place resource (Places API New)')}. Review cap, ordering, rating and aggregate-count definitions.</li>
<li>{ref('gbp-list','Google Business Profile API, reviews.list')}. Page limits, continuation, sort order, verified-location requirement and authorisation.</li>
<li>{ref('gbp-review','Google Business Profile API, Review resource')}. Identifiers, creation and modification fields.</li>
<li>{ref('missing','Google Business Profile Help, About missing or delayed reviews')}. Visibility explanations; not a dataset of removal probabilities.</li>
<li>{ref('places-policy','Google Maps Platform, Places API policies and attributions')}. Data-use conditions for implementations.</li>
<li>{ref('hypergeometric','R Core Team, stats documentation: Hypergeometric distribution')}. Reference model for sampling without replacement.</li>
<li>{ref('polarity','Schoenmueller, V., Netzer, O., and Stahl, F. (2020), The Polarity of Online Reviews: Prevalence, Drivers and Implications')}. <em>Journal of Marketing Research</em>, 57(5), 853–877. <a href="https://doi.org/10.1177/0022243720941832">DOI: 10.1177/0022243720941832</a>. Background research only; its underlying review records were not reanalysed here.</li></ol>
'''

page=f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(TITLE)}</title><meta name="description" content="{esc(DESC)}"><meta name="author" content="ReviewsBoost Editorial Team"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><meta name="theme-color" content="#0885fe">
<link rel="canonical" href="{URL}"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="manifest" href="site.webmanifest"><link rel="stylesheet" href="content.css"><link rel="license" href="{LICENSE}"><link rel="alternate" type="application/rss+xml" title="ReviewsBoost Learning Centre" href="https://reviewsboost.ca/feed.xml"><link rel="alternate" type="text/csv" title="Review coverage calculations" href="google-review-snapshot-coverage.csv">
<meta property="og:type" content="article"><meta property="og:site_name" content="ReviewsBoost"><meta property="og:locale" content="en_CA"><meta property="og:url" content="{URL}"><meta property="og:title" content="{esc(H1)}"><meta property="og:description" content="{esc(DESC)}"><meta property="og:image" content="https://reviewsboost.ca/google-review-five-record-coverage.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="780"><meta property="og:image:alt" content="Nine calculated coverage bounds for a five-record Google review response"><meta property="article:published_time" content="{DATE}"><meta property="article:modified_time" content="{DATE}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(H1)}"><meta name="twitter:description" content="{esc(DESC)}"><meta name="twitter:image" content="https://reviewsboost.ca/google-review-five-record-coverage.png"><meta name="twitter:image:alt" content="Maximum count coverage drops as aggregate ratings increase"><meta name="citation_title" content="{esc(H1)}"><meta name="citation_author" content="ReviewsBoost Editorial Team"><meta name="citation_publication_date" content="2026/11/05"><meta name="citation_fulltext_html_url" content="{URL}">
<script type="application/ld+json">{json.dumps(graph,ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body><a class="skip-link" href="#main">Skip to content</a>{header}<main id="main">
<section class="hero"><div class="container"><p class="eyebrow">Original analysis / Google review monitoring</p><h1>{H1}</h1><p class="lede">A review panel can show five comments beside hundreds of ratings. Our documentation audit and 189 reference calculations explain the coverage gap, with three new graphs and open data.</p><div class="meta-row"><span>Published <time datetime="{DATE}">November 5, 2026</time></span><span>By <a href="editorial-policy.html#authorship" rel="author">ReviewsBoost Editorial Team</a></span><span>Source definitions checked November 5, 2026</span></div></div></section>
<div class="container article-shell"><article class="prose">{body}</article><aside class="toc" aria-label="On this page"><strong>On this page</strong><ol>{toc}</ol><p><a href="google-review-coverage-study.json" download>Full data release</a></p><p><a href="/#assessment">Request an assessment</a></p></aside></div>
<section class="section alt" aria-labelledby="coverage-related"><div class="container"><h2 id="coverage-related">More research for a better review process</h2><div class="card-grid"><article class="card"><h3>Replies and removal timing</h3><p>Why time order can change what a review dataset appears to show.</p><a href="google-review-replies-removal-bias-study.html">Read the timing analysis →</a></article><article class="card"><h3>Staff names in reviews</h3><p>Separate a review’s contents from how it was requested.</p><a href="google-reviews-staff-names-study.html">Read the evidence audit →</a></article><article class="card"><h3>Monitor your reputation</h3><p>Build a process for reviewing, responding and following up.</p><a href="online-reputation-management.html">Explore reputation support →</a></article></div></div></section></main>{footer}</body></html>
'''
assert len(TITLE)<=65 and len(DESC)<=165
(ROOT/FILE).write_text(page,encoding='utf-8')

blog_path=ROOT/'blog.html';blog=blog_path.read_text(encoding='utf-8')
feature=f'''<section class="section alt" aria-labelledby="latest-research-title"><div class="container"><div class="section-head"><p class="eyebrow">New research · November 5, 2026</p><h2 id="latest-research-title">The five-review blind spot</h2><p>189 original coverage calculations explain why a Google review widget can miss the record you need.</p></div><div class="card-grid two-column"><article class="card" style="align-self:center;min-height:0"><h3>{H1}</h3><p>Google documents a five-record limit for one Places response. Explore the coverage gap, a hypothetical sampling benchmark and what repeated refreshes can actually establish.</p><a href="{FILE}">Read the study and download the data →</a></article><figure class="data-figure"><a href="{FILE}"><img src="google-review-five-record-coverage.svg" width="1200" height="780" loading="lazy" decoding="async" alt="Maximum count-based coverage of five review records across nine constructed rating counts."></a><figcaption>Original ReviewsBoost calculations from documented API limits; no sampled businesses.</figcaption></figure></div><p>Earlier research: <a href="google-reviews-staff-names-study.html">staff names and request policy</a> · <a href="google-review-removal-language-study.html">language and moderation accuracy</a> · <a href="google-review-replies-removal-bias-study.html">reply timing and time-order bias</a>.</p></div></section>'''
pattern=r'<section class="section alt" aria-labelledby="latest-research-title">[\s\S]*?</section>'
assert re.search(pattern,blog),'Missing blog feature slot'
blog=re.sub(pattern,lambda _:feature,blog,count=1)
def update_blog_schema(match):
    schema=json.loads(match[1])
    for node in schema.get('@graph',[]):
        if node.get('@type')=='CollectionPage':node['dateModified']=DATE
        if node.get('@type')=='ItemList':
            items=node['itemListElement']
            if not any(item.get('url')==URL for item in items):items.append({'@type':'ListItem','position':len(items)+1,'name':H1,'url':URL})
            node['numberOfItems']=len(items)
    return '<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False,indent=2).replace('<',chr(92)+'u003c')+'</script>'
blog=re.sub(r'<script type="application/ld\+json">([\s\S]*?)</script>',update_blog_schema,blog,count=1)
blog_path.write_text(blog,encoding='utf-8')

guide_path=ROOT/'online-reputation-management.html';guide=guide_path.read_text(encoding='utf-8')
discovery=f'<!-- coverage-study discovery start --><p>Is your widget a complete monitoring view? Our <a href="{FILE}">five-review coverage study</a> audits Google’s response limits and publishes 189 reference calculations with three original charts.</p><!-- coverage-study discovery end -->'
marker=r'<!-- coverage-study discovery start -->[\s\S]*?<!-- coverage-study discovery end -->'
if re.search(marker,guide):guide=re.sub(marker,lambda _:discovery,guide,count=1)
else:
    anchor='<h3>Weekly monitoring routine</h3>';assert anchor in guide
    guide=guide.replace(anchor,anchor+discovery,1)
guide_path.write_text(guide,encoding='utf-8')

sitemap_path=ROOT/'sitemap.xml';sitemap=sitemap_path.read_text(encoding='utf-8')
for changed_url in ['https://reviewsboost.ca/blog.html','https://reviewsboost.ca/online-reputation-management.html']:
    sitemap=re.sub(r'(<loc>'+re.escape(changed_url)+r'</loc>\s*<lastmod>)[^<]+',lambda m:m[1]+DATE,sitemap)
entry='<url><loc>'+URL+'</loc><lastmod>'+DATE+'</lastmod>'+''.join('<image:image><image:loc>https://reviewsboost.ca/'+name+'.png</image:loc></image:image>' for name,_ in images)+'</url>'
pattern=r'<url>\s*<loc>'+re.escape(URL)+r'</loc>[\s\S]*?</url>'
if re.search(pattern,sitemap):sitemap=re.sub(pattern,lambda _:entry,sitemap,count=1)
else:sitemap=sitemap.replace('</urlset>','  '+entry+'\n</urlset>')
sitemap_path.write_text(sitemap,encoding='utf-8')

feed_path=ROOT/'feed.xml';feed=feed_path.read_text(encoding='utf-8')
pubdate='Thu, 05 Nov 2026 00:00:00 -0500'
feed=re.sub(r'<lastBuildDate>[^<]+</lastBuildDate>','<lastBuildDate>'+pubdate+'</lastBuildDate>',feed,count=1)
item=f'<item><title>{esc(H1)}</title><link>{URL}</link><guid isPermaLink="true">{URL}</guid><pubDate>{pubdate}</pubDate><description>{esc(DESC)}</description></item>'
if URL not in feed:
    assert '<item>' in feed;feed=feed.replace('<item>',item+'\n    <item>',1)
feed_path.write_text(feed,encoding='utf-8')
print('Built coverage article, blog feature/ItemList, contextual service link, RSS and image sitemap. Homepage unchanged; no deployment.')
