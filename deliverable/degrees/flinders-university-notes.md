# Flinders University: degree list notes

Checked 2026-09-26. File: `flinders-university.csv` (368 rows).

## Sources
- The course finder's own data feed, `https://www.flinders.edu.au/flinders-services/courses.json` (402 entries). The JS course finder at `/study/courses` reads it, and the finder page's server-rendered accordion shows the same list. This feed was the master list of "currently offered" courses. It also gave level, locations and domestic/international availability.
- `https://www.flinders.edu.au/sitemap.xml`, used to find `/study/courses/*` and `/online/courses/*` pages (about 480 URLs). Every finder and sitemap course page was fetched: 498 pages, with redirects followed.
- Course pages: the award names and the "course handbook" links on each page. Area pages such as "Aquaculture" or "Postgraduate Nursing" list their Grad Cert / Grad Dip / Master awards as handbook links.
- The Flinders Handbook 2026 (`https://handbook.flinders.edu.au/courses/2026/<CODE>`), fetched for about 370 course codes. The `college` column comes from its College field.
- `https://www.flinders.edu.au/study/apply/apply-research-degree/what-you-can-study`, used for research degrees.

## Counts
| level | rows |
|---|---|
| Undergraduate | 128 |
| Honours | 16 |
| Postgraduate coursework | 184 |
| Research | 40 |
| **Total** | **368** |

17 rows are double/combined degrees (`double_degree=true`).

## Modelling decisions
- **Domestic and international** use the same page at Flinders (a toggle), so there is nothing to de-duplicate. No course is international-only.
- **Online versions.** An `/online/courses/` page that shares a handbook code or name with an on-campus course (for example Bachelor of Business (Online)) is merged into one row, with `Online` added to campuses. The URL points to the `/study/courses/` page when one exists.
- **Duration and entry variants are merged into one row**:
  - Master of Nursing 1.5 yr / 2 yr
  - Master of Public Health 1.5 / 2 yr
  - Master of Education and Master of Education (Qualified Teacher Entry)
  - Master of Inclusive and Specialised Education and its Qualified Teacher Entry version
  - Master of Teaching (Primary/Secondary) and their Accelerated versions
  - the City-campus codes (`...FP`)
- **Separate rows are kept for:**
  - the named Master of Clinical Rehabilitation specialisations (Neurological Physiotherapy; Neurological Occupational Therapy)
  - Bachelor of Paramedicine NT and Regional External Program
  - Bachelor of Medical Science (Laboratory Medicine) (Regional External Program)
  - Bachelor of Science (Forensic and Analytical Science Pathway)

  Each of these has its own finder entry and course code.
- **Honours.** The 1-year honours years are `level=Honours`, `award_type=Honours`. Bachelor of Computing and Mathematical Sciences (Honours) is also here, because the handbook calls it a 1-year honours course. The 4-year "embedded" honours degrees (Engineering, Laws (Honours), Criminology (Honours), Psychology (Honours), and so on) are `Undergraduate / Bachelor`. So three names appear twice, once in each level:
  - Bachelor of Criminology (Honours)
  - Bachelor of International Relations and Political Science (Honours)
  - Bachelor of Medical Science (Honours)
- **Graduate-entry bachelors** are listed as Undergraduate: Bachelor of Letters, Nursing (Graduate Entry), Psychological Studies (Graduate Entry), Midwifery (Post-Registration).
- **Doctor of Medicine and Juris Doctor** are Postgraduate coursework. The handbook classes them as "Masters (extended)".
- **PhD.** Flinders publishes one page per discipline, such as "Doctor of Philosophy (PhD) in Engineering". All of them are the same handbook award (PHD). Each discipline page is its own row, as the finder lists it. A generic "Doctor of Philosophy" row (handbook link) is also included. There is no MPhil and no professional doctorate in the catalogue.
- **Excluded:**
  - majors (including "Bachelor of Business majoring in ...")
  - undergraduate "Major in ..." pages
  - VET-pathway entry variants
  - the Uni Ready Program
  - the Flinders University Academy diplomas and pre-masters (these are pathway programs)
  - undergraduate certificates other than the 2 listed in the finder. The 2 finder-listed Undergraduate Certificates are included, because they are award courses.
- **Master of Business** (research; handbook MBUSR) is not in the finder or the sitemap. It was found through a link on the "what you can study" research page, and its course page is live, so it is included.
- **Names** follow the finder's wording, with a few fixes where the finder label was truncated or misspelt and the course page heading gives the full name:
  - "Graduate Certificate in Radiological" -> "... Radiological Protection"
  - "Graduate Certificate in Advanced Manufacturing" -> "... in Nuclear Systems"
  - "Master of Pallative Care" -> "Master of Palliative and End-of-Life Care"

  For area pages, the award names come from the page's own links, with "(City)", "(Online)" and duration suffixes removed.

## College column: important caveat
- For most rows, `college` is the **2026 Handbook "College" field**. The handbook still uses the **pre-restructure college names**:
  - College of Business, Government and Law
  - College of Education, Psychology and Social Work
  - College of Humanities, Arts and Social Sciences
  - College of Medicine and Public Health
  - College of Nursing and Health Sciences
  - College of Science and Engineering
  - Flinders University Academy (Diploma in Information Technology)
- The website's "Colleges" page (`/about/structure/colleges`) now lists **5 new colleges**:
  - Business, Creative Arts, Law and Social Sciences
  - Human Sciences and Culture
  - Health and Enablement
  - Medicine and Public Health
  - Science and Engineering

  No official course-by-course mapping from old to new was found, so none was invented.
- **PhD discipline pages.** The handbook gives the PhD's college as "University". For 16 PhD discipline pages, `college` is instead the single college that the course page itself names. Those pages already use the **new** names: College of Business, Creative Arts, Law and Social Sciences; College of Human Sciences and Culture; College of Science and Engineering. The Doctor of Philosophy (Clinical Psychology) page names the old College of Education, Psychology and Social Work.
- **Handbook codes not linked from the course page.** For some rows the course page had no handbook link, or a broken one. The code was then confirmed by fetching the handbook page and checking that its title matches:
  - BBA, BCRWR, BDCI, BDDE, BEDIE, BEDPR, BGD, BITNCS, BLANG, BMIDRN, BPFD, BPFTM, BPS, BPSY, BSW, DIPA, DIPLA, MRIH, BENGBHMEB, BENGEVH, BENEEHMENM, GCNSC
- **Bachelor of Occupational Therapy.** Its page links to a handbook code (BOT) that returns 404. The college comes from the handbook entry "Bachelor of Allied Health (Occupational Therapy)" (BAHOT), by analogy with Physiotherapy, whose page links "Bachelor of Allied Health (Physiotherapy)".
- **Codes only in the 2025 handbook.** A few course codes (GCBUSA, GDPBUSA, GCIR, GCSIM, MBASIM, GCENGMFP) are not in the 2026 handbook, so the 2025 handbook was used for those. It only affects the college of Master of Business Administration (Social Impact).
- **Empty college (17 rows):**
  - the generic Doctor of Philosophy (handbook: "University")
  - 11 PhD discipline pages that name no college: Clinical; Disability and Community Inclusion; Health Emergencies and Health Security; Health Sciences and Allied Health; Healthy Ageing and Aged Care; History, Archaeology, Geography and Indigenous Studies; Medical Biosciences; Nursing and Midwifery; Palliative Care and End of Life; Public Health and Rural and Remote Health; PhD by Prior Published Work
  - 5 nuclear online courses, whose pages link the wrong handbook entry (Master of Teaching (Birth to 5)) and have no handbook entry of their own: Grad Cert in Advanced Manufacturing in Nuclear Systems; Grad Cert in Nuclear Science and Technology; Grad Cert in Radiological Protection; Grad Dip of Nuclear Science and Technology; Master of Nuclear Science and Technology

## Campuses
- Values are as the finder lists them: Bedford Park, City, Tonsley, Online, Riverland, Port Pirie, Mount Gambier, Darwin, Adelaide CBD, "City (some topics)", Adelaide Oval, Alberton, "Regional South Australia", "Hybrid (NSW and VIC)", "Online plus placement/intensive (Alice Springs)". Trailing asterisks were removed.
- Campuses are empty for the honours-year pages and PhD discipline pages that list none.

## Gaps and doubts
- **Finder entries whose page is broken (excluded):**
  - Bachelor of Letters (History) (Graduate Entry): 404
  - "Leadership in Education" postgraduate page: 404. Graduate Certificate in Leadership in Education (Online) is included.
  - Bachelor of Creative Industries (Honours) 1 year: redirects to a study-area page
  - Bachelor of Design and Technology (Honours) 1 year: redirects to a major page
- **Master of Remote and Indigenous Health.** The finder link (`master-remote-health-practice`) returns 404. The live page `/study/courses/master-remote-indigenous-health` was used instead.
- **Live pages in the sitemap but not in the finder were treated as retired and not listed.** Examples:
  - Bachelor of Engineering Technology (Systems and Security), whose page says "no longer offered as of 2026"
  - Bachelor of Science (Honours) (Coasts and Oceans)
  - Bachelor of Letters (Archaeology) and (Modern Greek) (Graduate entry)
  - Bachelor of Midwifery (Post Registration) (Registered Midwife)
  - Bachelor of Applied Geographical Information Systems (Honours)
  - postgraduate Biotechnology, Dementia Care and Leadership, Teaching (Special Education)
  - OUA and "uni-hub" copies of existing courses
  - Bachelor of Information Technology (Network and Cybersecurity Systems) (Online), a uni-hub page

  Some of these may still take students.
- **Higher doctorates** (Doctor of Laws, Doctor of Letters, Doctor of Science) are mentioned on the research-degree page. They are awarded for published work and were not listed.
- **Postgraduate area pages.** Their award list depends on the handbook links on each page. Some links on course pages point to the wrong handbook entry (for example, the Costume Design page links to Fashion). Names were taken from the finder or page text, not from those links.
