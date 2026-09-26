# Adelaide University: degree list notes

Checked: 2026-09-26

## Sources
- https://adelaideuni.edu.au redirects to **https://adelaide.edu.au/**. The University of Adelaide's old domain now hosts the new Adelaide University site. Its JSON-LD says "Adelaide University is a public Australian university established in 2026 through the merger of the University of Adelaide and the University of South Australia".
- Enumeration: `https://adelaide.edu.au/sitemap.xml` (from robots.txt) lists 566 URLs under `/study/degrees/`. Four of these are not course pages (`2026/`, `2027/` return 404; `compare-degrees/`, `legacy/`). That leaves 562 degree pages, including 49 under `/study/degrees/online/` (the 100% online catalogue).
- Cross-check: the site's Funnelback search index (`search.adelaideuni.edu.au`, degrees data source `uosa~ds-aem-degrees`) holds exactly the same 562 degree URLs.
- I downloaded all 562 pages and read each page's own metadata (`og:title`, `studyLevel`, `compositeID`/program code, `location`, `courseMode`). The college is taken from the "Your program team" block on each page. All pages carry `year=2027`, so this is the 2027-intake catalogue.
- Research degrees were checked against https://adelaide.edu.au/study/how-to-apply/research/, which lists only the Doctor of Philosophy, Master of Philosophy and Master of Research.

## Method
- The site gives each major or specialisation its own page (e.g. "Bachelor of Arts majoring in History", program code BARTS). I grouped pages by program code (the prefix of `compositeID`), so there is one row per program. Campuses are the union across that program's pages.
- 16 programs exist only as major or specialisation pages, with no base page. For these the name is the title with " majoring in …" or " specialising in …" removed, and I checked that this base name appears on the page. The URL is the first major's page. The programs are: Bachelor of Aviation, Bachelor of Commerce, Bachelor of Human Movement, Bachelor of Medical Radiation Science (Honours), Bachelor of Music, Bachelor of Music (Honours), Bachelor of Social Science, Graduate Certificate in Engineering, Graduate Diploma in Design, Graduate Diploma in Engineering, Graduate Diploma in Information Management, Master of Advanced Clinical Physiotherapy, Master of Information Management, Master of Mathematical Sciences and Master of Science.
- One exception is "Graduate Diploma in Nursing specialising in Mental Health". It has its own program code (GDNMH), separate from the Graduate Diploma in Nursing (GDNUR), so it keeps its full page title as its own row.
- Level:
  - Any single degree with "(Honours)" in its name is `Honours`. Most of these are 4-year direct-entry honours degrees. Only "Bachelor of Psychology (Honours) 1-year" is a one-year honours year.
  - Double degrees, including the LLB (Honours) doubles, are `Undergraduate` or `Postgraduate coursework` with `double_degree=true`.
  - Doctor of Medicine, Doctor of Clinical Dentistry and Doctor of Veterinary Medicine are `Postgraduate coursework` with award type `Doctor (coursework)`.
  - The Master of Research is `Research`.
- Excluded:
  - Pathway and foundation programs: Aboriginal and Torres Strait Islander Pathway, CASM Foundation Year, Foundation Studies, UniStart.
  - The 3 Professional Certificates (Clinical Education, Pain Sciences, Defence Contracting Law). The site marks them "Non-Award" or "non-AQF".
- Included: 7 online Undergraduate Certificates. They are award programs (the site's level is "Pre-degree"), so they appear as `Undergraduate` / `Undergraduate Certificate`. Diplomas and Associate Degrees are also tagged "Pre-degree" on the site and are included as `Undergraduate`.

## Counts (305 rows)
- Undergraduate: 100. This is 85 Bachelor (11 of them are double degrees; the 12th double degree is the Master of Architecture, Master of Landscape Architecture), 7 Undergraduate Certificate, 5 Diploma and 3 Associate Degree.
- Honours: 32
- Postgraduate coursework: 170. This is 90 Master, 42 Graduate Certificate, 35 Graduate Diploma and 3 Doctor (coursework).
- Research: 3

Colleges found (6):
- College of Business and Law
- College of Creative Arts, Design and Humanities
- College of Education, Behavioural and Social Sciences
- College of Engineering and Information Technology
- College of Health
- College of Science

## Gaps and doubts
- **College not shown (28 rows, left empty).** These pages have no program team, or only a non-college unit such as "Adelaide University Online", "Learning Futures" or "Research and Innovation":
  - Bachelor of Accounting (online), Bachelor of Aviation, Bachelor of Business (Project Management) (Degree Apprenticeship), Diploma in Health (online)
  - Global Executive MBA (Defence and Space), Graduate Certificate in Global Executive Business Administration in Defence and Space
  - Graduate Certificate in Business Administration (online), Graduate Diploma in Business Administration (online), Master of Business Administration (online), Master of Business Administration (Health Management) (online)
  - Graduate Certificate in Dynamic Effects and Lighting, Graduate Certificate in Engineering, Graduate Certificate in Research Design, Graduate Certificate in Research Skills, Graduate Certificate in Science (Radiation Management)
  - Graduate Diploma in Design, Graduate Diploma in Engineering, Graduate Diploma in Information Management, Graduate Diploma in International Addiction Studies
  - Master of Architecture, Master of Landscape Architecture; Master of Information Management; the three Master of Information Technology programs; Master of Minimally Invasive Surgery
  - Doctor of Philosophy, Master of Philosophy, Master of Research
- The college pages (/about/college/…) do not list degrees, so I could not fill these gaps from them.
- **Same name, separate programs.** Some names appear twice, once on campus and once as a separate 100% online program with its own code and URL under `/online/`: Bachelor of Construction Management, Bachelor of Construction Management (Honours), Bachelor of Criminology and Criminal Justice, Bachelor of Information Technology, Bachelor of Journalism, Bachelor of Psychology, Bachelor of Public Health, Graduate Certificate in Business Administration and Master of Business Administration. The `campuses` value ("Online") and the URL tell them apart.
- **Campus names are exactly as the pages list them, and they are inconsistent.** Examples are "Adelaide City Campus", "Mawson Lakes" (not "Mawson Lakes Campus"), "Mt Gambier", "Adelaide City Campus East", "Online", "Open Universities Australia" (2 online programs delivered via OUA) and "Brisbane - Rising Sun Pictures" (a VFX graduate certificate).
- The sitemap and search index only expose the 2027 version of each page. A program offered for 2026 entry but discontinued for 2027 would not appear. For example, a base page for "Graduate Diploma in Design" (year 2026) still resolves but is not indexed, so I used its 2027 specialisation pages instead.
- The Bachelor of Engineering (Honours) (Flexible Entry) and the apprenticeship variants have their own program codes and are listed as separate rows.
