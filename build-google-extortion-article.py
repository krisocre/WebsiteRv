"""Build one article and its discovery entries; preserve existing articles/homepage."""
from pathlib import Path
import html
import json
import re

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-review-extortion-study.json').read_text(encoding='utf-8'))
DATE='2026-11-13'; FILE='google-review-extortion-canada-data-study.html'; URL='https://reviewsboost.ca/'+FILE
TITLE="Google Review Extortion: Canada's $0-Loss Data Gap"
H1='Google review extortion: why $0 lost does not mean nothing happened'
DESC='A new Canadian extortion-data audit explains the $0-loss gap, with 22,801 broader report records, three charts, open data and Google reporting guidance.'
esc=lambda value:html.escape(str(value),quote=True)
sources=D['sources'];F=D['findings']
def ref(key,label):return f'<a href="{esc(sources[key])}">{label}</a>'
def table(caption,heads,rows):
    return '<div class="table-scroll" tabindex="0" role="region" aria-label="'+esc(caption)+'"><table class="comparison"><caption>'+caption+'</caption><thead><tr>'+''.join('<th scope="col">'+h+'</th>' for h in heads)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+str(v)+('</th>' if i==0 else '</td>') for i,v in enumerate(row))+'</tr>' for row in rows)+'</tbody></table></div>'
figures=[('google-extortion-zero-loss-years','Shares with zero recorded dollar loss are 91.6%, 91.1%, 86.0%, 91.0% and 87.1% in five source periods; 2025 covers January to September only.'),('google-extortion-status-loss','Zero recorded loss appears in all 16,109 Attempt-coded records, 4,328 of 6,493 Victim-coded records, and all 199 records in the pooled remaining statuses.'),('google-extortion-email-fields','In the same selected report universe, 6,626 records name Email as the solicitation method; 696 name Email as the method of reporting to CAFC.')]
def figure(i,caption):
    name,alt=figures[i]
    return f'<figure class="data-figure"><picture><source media="(max-width:600px)" srcset="{name}-mobile.svg" width="630" height="850"><img src="{name}.svg" width="1200" height="780" loading="lazy" decoding="async" alt="{esc(alt)}"></picture><figcaption>{caption} <a href="{name}.svg" download>Download SVG</a> · <a href="{name}.png" download>PNG</a>.</figcaption></figure>'

body=f'''
<h2 id="answer">Do you have to lose money before reporting Google review extortion?</h2>
<p>No. If someone ties a demand for money, goods or favours to removing suspicious Google reviews, preserve the demand and use Google’s dedicated reporting route. Its guidance does not ask you to pay first. In fact, Google says: <q>Do not engage with or pay the malicious individuals.</q> {ref('google_extortion','Google’s review-extortion guidance')}.</p>
<p>For an owner facing a one-star attack, the damage may be the threat itself: time spent checking the listing, uncertainty about customers seeing it, and pressure to make a quick decision. A recorded dollar loss is a different measure. Treating the two as interchangeable makes both a weak response plan and a misleading statistic.</p>
<p>We tested that distinction against Canada’s public fraud-reporting data. Our new compilation isolates <strong>22,801 records coded to Canada and extortion</strong> in a pinned Canadian Anti-Fraud Centre export. Of those, <strong>20,636—90.5%—record $0 in the dollar-loss field</strong>.</p>
<div class="callout"><strong>Keep the scope attached to the number.</strong><p>These are broader extortion reports from 2021 to September 2025. They are <strong>not 22,801 Google review attacks</strong>, a business-only sample, or a measure of successful review removal. The export cannot identify those subsets. This article combines original aggregate research with Google-specific reporting guidance.</p></div>
<p><strong>Our contribution:</strong> 31 new aggregate data rows, three original figures, source fingerprints, a reproducible analysis script and an evidence worksheet. No complaint identifiers or individual records are republished. <a href="#methods">Read the method</a> · <a href="#downloads">Download the release</a>.</p>

<h2 id="finding">The surprising part: a Victim code can still have $0 recorded</h2>
<p>The selected export contains 6,493 records with the publisher’s <em>Complaint Type</em> set to <em>Victim</em>. Among them, <strong>4,328 have zero recorded dollar loss: 66.7%</strong>. That is a separate finding from the 16,109 records coded <em>Attempt</em>, all of which have $0 recorded.</p>
<p>We did not reclassify these people or decide whether a crime occurred. We cross-tabulated two fields that the source already contains. The useful point is narrower: filtering this export to positive dollar amounts would discard most of its Victim-coded extortion records.</p>
<blockquote><p>A zero in the money column is not a complete account of an extortion report.</p><cite>ReviewsBoost, Canadian extortion-data audit, version 1.0.0</cite></blockquote>
{table('Canada-coded extortion records: publisher status versus recorded dollar loss',['Complaint Type','All records','$0 recorded','Positive loss'],[['Attempt','16,109','16,109','0'],['Victim','6,493','4,328','2,165'],['Other / Unknown / Incomplete','199','199','0'],['Total','22,801','20,636','2,165']])}
{figure(1,'Original ReviewsBoost cross-tabulation. The percentages use each status row’s own denominator. Publisher codes and recorded amounts are retained as supplied; these are not Google moderation outcomes.')}
<p>A zero field does not establish whether no payment was made, a cost was unreported, a loss occurred later, or the consequences were non-monetary. The export does not resolve all of those possibilities. It also does not measure cancelled bookings, lost sales, staff time or distress. We therefore describe the finding as <em>zero recorded dollar loss</em>, rather than silently turning it into “no harm”. {ref('definitions','CAFC’s definitions and data notes')}.</p>

<h2 id="years">A pattern across the available periods</h2>
<p>Zero-dollar entries are not confined to one year in this release. They make up between 86.0% and 91.6% of the selected records in its five reporting periods.</p>
{figure(0,'Each bar describes the same country/category filter in one period. 2021–2024 are full calendar years; 2025 is a January–September export. The partial year must not be read as a full-year decline.')}
{table('Source-period totals; 2025 is incomplete',['Period','Records','$0 recorded','Share with $0'],[[str(r['year'])+(' (Jan–Sep)' if r['year']==2025 else ''),f"{r['report_records']:,}",f"{r['zero_recorded_loss']:,}",f"{r['zero_loss_percent']:.1f}%"] for r in D['annual']])}
<p>These are reports in a particular export, not a census of extortion. Changes in reporting, classification, systems and the people who report can affect the series. A smaller count cannot, by itself, establish a safer environment for a business. Nor can a larger count tell us how many Google profiles were involved.</p>
<p>There is also a publication gap worth making explicit. The catalogue available when we checked still points to an export ending in September 2025 and notes a delay associated with a system change. A newer CAFC bulletin discusses the first half of 2026, but it is a different publication with a broader scope. We have not spliced its headline totals into this row-level series. {ref('catalogue','CAFC open-data catalogue')} · {ref('cafc_2026','CAFC’s 2026 update')}.</p>

<h2 id="channels">Two email columns that answer different questions</h2>
<p>The dataset contains both <em>Solicitation Method</em> and <em>Complaint Received Type</em>. One concerns how the fraudster initially contacted the complainant; the other concerns how the report reached CAFC. They should not be merged just because both can contain the word <em>Email</em>.</p>
<p>In our selected records, <strong>6,626 name Email as the solicitation method</strong>, while <strong>696 name Email as the report-intake method</strong>. Those are 29.1% and 3.1% of the same 22,801-record scope, answering different questions. Someone contacted by email can report through a website or by phone.</p>
{figure(2,'The bars have the same selected-record denominator, but refer to different fields. This does not estimate how Google review attackers contact businesses or where they are located.')}
<p>That distinction matters in a review-extortion case too. The review may be on Google, the demand may arrive through a messaging app, and the owner’s report may go through a separate Google form. The location of one part of that chain is not a reliable label for every other part.</p>
<p>Our downloadable channel table retains both fields separately, including the source’s unknown categories. It does not recode a broad internet category as “Google”, a messaging app, or a particular campaign.</p>

<h2 id="data-gap">The number we cannot responsibly publish</h2>
<p>We cannot calculate a national Google review-extortion rate from this export. There is no Google-platform marker, review link, review-removal decision or complete business-exposure denominator. A country-coded fraud report is also not necessarily a distinct business or a distinct attacker.</p>
<p>The country filter is deliberately strict: <code>Country = Canada</code>. We exclude records whose country is not specified, even though CAFC’s notes explain that its reports have a Canadian nexus. Our 22,801 therefore should not be described as every Canadian-related extortion report.</p>
<p>We also cannot derive a “chance your review will be removed” from the 90.5% figure. The denominator contains no removal requests or platform decisions. It says something about recorded losses in an extortion-reporting dataset, not the strength of a Google policy case.</p>
<div class="callout"><strong>A useful citation keeps three qualifiers.</strong><p>“ReviewsBoost’s reanalysis found zero recorded dollar loss in 20,636 of 22,801 <em>Canada-coded, broader extortion reports</em> in a <em>2021–September 2025 export</em>.” Dropping the category or time window changes the claim.</p></div>

<h2 id="evidence">For your Google case, keep the review and the demand together</h2>
<p>The national dataset is useful context. Your own evidence has a different job: showing what happened to a particular Business Profile and what someone demanded.</p>
<p>Keep a private record of:</p>
<ul><li><strong>The affected listing.</strong> Record the correct public Business Profile link so similarly named businesses are not confused.</li><li><strong>The specific contributions.</strong> Keep direct review links where available and dated screenshots of what was visible.</li><li><strong>The actual demand.</strong> Preserve the original communication and its connection to the reviews, rather than only a summary of how it felt.</li><li><strong>The timeline.</strong> Distinguish when reviews appeared, when contact arrived, and when any later messages were received.</li><li><strong>The reporting history.</strong> Keep the channel, submission date and reference or status actually provided. Do not invent a case number when none was issued.</li></ul>
<p>Google’s dedicated guidance asks for communications, demands, review links and relevant timing. Private sender details may be relevant to its investigation; that is not a reason to publish them in a public response. Its extortion channel is for a direct demand tied to removal, while other policy concerns use the ordinary review-reporting process. {ref('google_extortion','Google’s evidence requirements')} · {ref('google_reporting','Ordinary review reporting')}.</p>
<p>A run of negative ratings alone does not identify who wrote them. A refund dispute alone does not establish a coordinated attack. Describe the material you can preserve and leave unresolved connections unresolved. The worksheet below is designed for that separation, not for generating accusations.</p>

<h2 id="professional-help">What professional assistance should add</h2>
<p>A useful assessment helps identify the correct listing and contributions, organise relevant evidence, distinguish reporting routes and keep track of eligible follow-up. It should make the next step clearer without promising control over Google’s decision.</p>
<p>Hiring an independent service to help prepare a policy-based case is a different transaction from paying the party making a threat. Ask who is doing the work, what they will do, what you will pay and how an outcome will be documented. Never provide your Google password for an initial assessment.</p>
<p>ReviewsBoost provides <a href="/">Google review removal assistance for Canadian businesses</a>. An assessment request is free. Current service pricing is <strong>CAD $45 upfront per accepted review, plus CAD $95 for each successfully removed review</strong>, with scope and applicable terms confirmed before paid work. Removal is not guaranteed. <a href="google-review-removal-cost-canada.html">See the pricing explanation</a> or <a href="/#assessment">request an assessment</a>.</p>

<h2 id="methods">Method, source version and limits</h2>
<p>On November 13, 2026, we downloaded the CSV linked from CAFC’s open-data catalogue. The pinned file contains 350,361 rows and 21 columns. Its 350,361 source IDs are unique in this snapshot. We retained rows where the English country and thematic-category fields exactly equal <code>Canada</code> and <code>Extortion</code>, producing 22,801 records.</p>
<p>The nominal file window is January 1, 2021 to September 30, 2025. The earliest selected record is dated January 2, 2021 and the latest September 29, 2025. Those observed endpoints do not change the nominal export window. The catalogue’s metadata modification date is March 25, 2026; it does not make the underlying rows 2026 observations.</p>
<p>We parsed the currency field with decimal arithmetic, retained the publisher’s status codes, and calculated counts and shares. Annual rows use their own period totals. The status table uses its own status-row denominator. The channel table uses 22,801 in both field groups. Shares are calculated before rounding; counts remain integers.</p>
<p>For readability, the status chart pools Other, Unknown and Incomplete into one 199-record group. The downloadable JSON explains that grouping. We publish five annual rows, six status-by-loss rows and twenty channel rows: <strong>31 aggregate rows in total</strong>. No complaint ID, demographic record, individual report date or narrative is exported.</p>
<p>The source is public reporting data, not an independently validated survey of businesses. We do not infer criminal guilt, platform prevalence, causal changes, financial consequences outside the recorded field or review-removal success. The analysis script validates the source checksum and stops if the file changes, allowing later releases to be distinguished from this one.</p>

<h2 id="questions">Questions Canadian business owners ask</h2>
<h3>Does Google require proof that I paid the person?</h3><p>Its extortion guidance focuses on the demand and supporting evidence, and advises against paying the malicious party. Preserve what happened without creating a payment just to strengthen a report.</p>
<h3>Can these statistics prove my reviews are fake?</h3><p>No. These are broader reporting aggregates with no review-level evidence. The facts about your particular contributions and communications still matter.</p>
<h3>Can a review disappear without the displayed stars changing?</h3><p>A rounded aggregate cannot reliably identify the status of one contribution. Check that review and the relevant reporting status. Our <a href="google-review-rating-resilience-study.html">rating resilience study</a> explains how review-count arithmetic affects aggregate sensitivity.</p>
<h3>What if there is no removal-related demand?</h3><p>Assess the actual content and available evidence against the ordinary review policies. A low rating or disagreement alone is not a sufficient removal case. Our <a href="google-review-removal-checker.html">private evidence builder</a> can help organise the concern.</p>

<h2 id="downloads">Download, reproduce and cite</h2>
<ul><li><a href="google-review-extortion-annual.csv" download>Five period-level aggregate rows (CSV)</a></li><li><a href="google-review-extortion-status-loss.csv" download>Six status-by-loss rows (CSV)</a></li><li><a href="google-review-extortion-channels.csv" download>Twenty channel rows with field names and denominators (CSV)</a></li><li><a href="google-review-extortion-study.json" download>Complete release, filters, source hash and limits (JSON)</a></li><li><a href="google-review-extortion-analysis.py" download>Reproducible standard-library Python analysis</a></li><li><a href="google-review-extortion-evidence-worksheet.txt" download>Private review-and-demand evidence worksheet (TXT)</a></li><li><a href="google-review-extortion-study.bib" download>Citation (BibTeX)</a></li></ul>
<p><strong>Suggested citation:</strong> ReviewsBoost Editorial Team. (2026, November 13). <em>Google review extortion: why $0 lost does not mean nothing happened.</em> Canadian extortion-data audit, version 1.0.0. <a href="{URL}">Permanent article and data release</a>.</p>
<p>Contains information licensed under the <a href="{D['licence']}">Open Government Licence – Canada</a>. Source: Canadian Anti-Fraud Centre / Royal Canadian Mounted Police. ReviewsBoost produced the aggregations, figures and interpretation; neither CAFC nor Google endorses this analysis. You may cite our findings and figures with attribution and their scope intact. The source material retains its own terms.</p>

<h2 id="sources">Primary sources and review notes</h2>
<ol><li>{ref('catalogue','CAFC open-data catalogue')}: source scope, resource links and release notice.</li><li>{ref('csv','Pinned public reporting CSV')}: the actual numeric input, SHA-256 <code>{D['source_snapshot']['sha256']}</code>.</li><li>{ref('definitions','CAFC definitions PDF')}: field meanings, CAD currency and reporting limitations.</li><li>{ref('google_extortion','Google’s review-extortion reporting guidance')}: the dedicated route and relevant evidence.</li><li>{ref('google_reporting','Google’s ordinary review-reporting guidance')}: other policy concerns and reporting.</li><li>{ref('cafc_2026','CAFC’s first-half 2026 fraud update')}: newer context, not a numeric input to this release.</li></ol>
<p>Sources checked November 13, 2026. Analysis and figures: ReviewsBoost Editorial Team. Corrections can be raised through our <a href="online-reputation-management.html#contact">contact process</a>; identify the article, version and calculation concerned. This analysis is not a legal finding about an identified person.</p>
'''

template=(ROOT/'google-review-widget-coverage-study.html').read_text(encoding='utf-8')
header=re.search(r'<header class="site-header">[\s\S]*?</header>',template)[0]
footer=re.search(r'<footer class="site-footer">[\s\S]*?</footer>',template)[0]
downloads=[('google-review-extortion-annual.csv','Five period aggregates','text/csv'),('google-review-extortion-status-loss.csv','Six status-loss aggregates','text/csv'),('google-review-extortion-channels.csv','Twenty channel aggregates','text/csv'),('google-review-extortion-study.json','Complete methods and aggregate release','application/json')]
graph={'@context':'https://schema.org','@graph':[
 {'@type':'Article','@id':URL+'#article','headline':H1,'description':DESC,'url':URL,'mainEntityOfPage':URL,'datePublished':DATE,'dateModified':DATE,'inLanguage':'en-CA','isAccessibleForFree':True,'author':{'@type':'Organization','name':'ReviewsBoost Editorial Team','url':'https://reviewsboost.ca/editorial-policy.html#authorship'},'publisher':{'@type':'Organization','name':'ReviewsBoost','url':'https://reviewsboost.ca/'},'citation':list(sources.values()),'image':['https://reviewsboost.ca/'+name+'.png' for name,_ in figures],'mainEntity':{'@id':URL+'#dataset'}},
 {'@type':'Dataset','@id':URL+'#dataset','name':D['title'],'description':'Original secondary aggregation of 22,801 Canada-coded broader extortion records into 31 aggregate rows. Not Google-review cases, a business-only sample, a national incidence rate or removal outcomes.','url':URL+'#downloads','version':'1.0.0','datePublished':DATE,'creator':{'@type':'Organization','name':'ReviewsBoost Editorial Team'},'isBasedOn':sources['catalogue'],'citation':[sources['csv'],sources['definitions']],'temporalCoverage':D['source_snapshot']['nominal_window'],'spatialCoverage':{'@type':'Country','name':'Canada'},'variableMeasured':['Source-coded report-record count','Zero versus positive recorded dollar loss','Publisher complaint status','Solicitation versus report-intake method'],'measurementTechnique':'Exact country/category filtering, decimal currency parsing and aggregate cross-tabulation of a SHA-256-pinned CSV.','distribution':[{'@type':'DataDownload','name':label,'contentUrl':'https://reviewsboost.ca/'+name,'encodingFormat':kind} for name,label,kind in downloads]},
 {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':'https://reviewsboost.ca/'},{'@type':'ListItem','position':2,'name':'Learning Centre','item':'https://reviewsboost.ca/blog.html'},{'@type':'ListItem','position':3,'name':'Google review extortion data audit','item':URL}]}]}
toc=''.join(f'<li><a href="#{match[0]}">{match[1]}</a></li>' for match in re.findall(r'<h2 id="([^"]+)">([^<]+)</h2>',body))
page=f'''<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(TITLE)}</title><meta name="description" content="{esc(DESC)}"><meta name="author" content="ReviewsBoost Editorial Team"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><meta name="theme-color" content="#0885fe"><link rel="canonical" href="{URL}"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="manifest" href="site.webmanifest"><link rel="stylesheet" href="content.css"><link rel="alternate" type="application/rss+xml" title="ReviewsBoost Learning Centre" href="https://reviewsboost.ca/feed.xml"><link rel="alternate" type="text/csv" title="Extortion status and loss aggregates" href="google-review-extortion-status-loss.csv">
<meta property="og:type" content="article"><meta property="og:site_name" content="ReviewsBoost"><meta property="og:locale" content="en_CA"><meta property="og:url" content="{URL}"><meta property="og:title" content="{esc(H1)}"><meta property="og:description" content="{esc(DESC)}"><meta property="og:image" content="https://reviewsboost.ca/google-extortion-zero-loss-years.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="780"><meta property="og:image:alt" content="Zero-recorded-loss shares in broader Canada-coded extortion reports, with the partial 2025 period labelled"><meta property="article:published_time" content="{DATE}"><meta property="article:modified_time" content="{DATE}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(TITLE)}"><meta name="twitter:description" content="{esc(DESC)}"><meta name="twitter:image" content="https://reviewsboost.ca/google-extortion-zero-loss-years.png"><meta name="twitter:image:alt" content="Original CAFC aggregate analysis; not Google-specific counts"><meta name="citation_title" content="{esc(H1)}"><meta name="citation_author" content="ReviewsBoost Editorial Team"><meta name="citation_publication_date" content="2026/11/13"><meta name="citation_fulltext_html_url" content="{URL}"><script type="application/ld+json">{json.dumps(graph,ensure_ascii=False).replace('<',chr(92)+'u003c')}</script></head><body><a class="skip-link" href="#main">Skip to content</a>{header}<main id="main"><section class="hero"><div class="container"><p class="eyebrow">Canadian research / Google review extortion</p><h1>{H1}</h1><p class="lede">A new audit of broader Canadian extortion reports exposes a money-only blind spot. Three original graphs and open aggregate data explain what the numbers mean for a careful Google review response.</p><div class="meta-row"><span>Published <time datetime="{DATE}">November 13, 2026</time></span><span>By <a rel="author" href="editorial-policy.html#authorship">ReviewsBoost Editorial Team</a></span><span>Version 1.0.0</span></div></div></section><div class="container article-shell"><article class="prose">{body}</article><aside class="toc" aria-label="On this page"><details><summary style="min-height:44px;line-height:44px;cursor:pointer;font-weight:700">On this page</summary><ol>{toc}</ol><p><a href="google-review-extortion-study.json" download>Download the data release</a></p></details></aside></div></main>{footer}</body></html>'''
assert len(TITLE)<=65 and len(DESC)<=165
(ROOT/FILE).write_text(page,encoding='utf-8')

blog_path=ROOT/'blog.html';blog=blog_path.read_text(encoding='utf-8')
card=f'''<!-- extortion research card start --><article class="card"><span class="tag">New Canadian research · November 2026</span><h3>Google review extortion and the $0-loss gap</h3><p>We audited 22,801 broader Canada-coded extortion records. Explore three new figures, 31 aggregate data rows and a practical review-and-demand evidence worksheet.</p><a href="{FILE}">Read the research and download the data →</a></article><!-- extortion research card end -->'''
marker=r'<!-- extortion research card start -->[\s\S]*?<!-- extortion research card end -->'
if re.search(marker,blog):blog=re.sub(marker,lambda _:card,blog,count=1)
else:
    section=blog.index('aria-labelledby="tools-and-answers"');point=blog.index('<article class="card">',section);blog=blog[:point]+card+'\n'+blog[point:]
def update_schema(match):
    schema=json.loads(match[1])
    for node in schema.get('@graph',[]):
        if node.get('@type')=='CollectionPage':node['dateModified']=DATE
        if node.get('@type')=='ItemList':
            items=node.get('itemListElement',[])
            items=[item for item in items if item.get('url')!=URL and item.get('item')!=URL]
            items.insert(0,{'@type':'ListItem','position':1,'name':H1,'url':URL})
            for position,item in enumerate(items,1):item['position']=position
            node['itemListElement']=items
            if 'numberOfItems' in node:node['numberOfItems']=len(items)
    return '<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<',chr(92)+'u003c')+'</script>'
blog=re.sub(r'<script type="application/ld\+json">([\s\S]*?)</script>',update_schema,blog)
blog_path.write_text(blog,encoding='utf-8')

sitemap_path=ROOT/'sitemap.xml';sitemap=sitemap_path.read_text(encoding='utf-8')
sitemap=re.sub(r'(<loc>https://reviewsboost\.ca/blog\.html</loc>\s*<lastmod>)[^<]+',lambda m:m[1]+DATE,sitemap)
entry='<url><loc>'+URL+'</loc><lastmod>'+DATE+'</lastmod>'+''.join('<image:image><image:loc>https://reviewsboost.ca/'+name+'.png</image:loc></image:image>' for name,_ in figures)+'</url>'
pattern=r'<url>\s*<loc>'+re.escape(URL)+r'</loc>[\s\S]*?</url>'
sitemap=re.sub(pattern,lambda _:entry,sitemap,count=1) if re.search(pattern,sitemap) else sitemap.replace('</urlset>','  '+entry+'\n</urlset>')
sitemap_path.write_text(sitemap,encoding='utf-8')
feed_path=ROOT/'feed.xml';feed=feed_path.read_text(encoding='utf-8');pubdate='Fri, 13 Nov 2026 00:00:00 -0500'
feed=re.sub(r'<lastBuildDate>[^<]+</lastBuildDate>','<lastBuildDate>'+pubdate+'</lastBuildDate>',feed,count=1)
item=f'<item><title>{esc(H1)}</title><link>{URL}</link><guid isPermaLink="true">{URL}</guid><pubDate>{pubdate}</pubDate><description>{esc(DESC)}</description></item>'
if URL not in feed:feed=feed.replace('<item>',item+'\n    <item>',1)
feed_path.write_text(feed,encoding='utf-8')
print('Built article, existing blog-grid card/ItemList, RSS and image-sitemap discovery. Homepage and existing posts unchanged.')
