# Croatian Content Review Checklist

All Croatian copy below was drafted by Claude Code per `docs/decisions.md` (DISCOVERY-002 decision b) — natural, locally-appropriate phrasing, not machine-translated, but **not yet reviewed by a native speaker in context**. Read each page live on the preview URL and check it off once it reads naturally to you. Anything marked ⚠️ needs a decision, not just a read-through.

## Homepage (`/`)
- [ ] Hero headline/subhead: "Tehnologija koja radi za vas — kod kuće i na poslu"
- [ ] 3 audience cards (Za tvrtke / Za dom / Web i softver)
- [ ] Warranty band copy
- [ ] Testimonials — translated from the real English originals, attributed to the same real people. ⚠️ **Confirm each of the 5 people is comfortable with a translated (not original-language) version of their testimonial appearing on the rebuilt site**: Mario Cvinar, John Walkden (Ubique Safety Consultants), Siniša Kalinić, Marina Franić, Leo Raguž.
- [ ] Case study / HomeStock spotlight card copy

## Services (`/usluge/`)
- [ ] Section titles and service descriptions (7 services, 3 tracks)
- [ ] ⚠️ **All prices are directional placeholders, not your real rates** — from €35 (repair) to €500 (website) to "custom quote" (web apps). See `docs/decisions.md` for the full list. Replace with real figures before launch.

## About (`/o-nama/`)
- [ ] Founder bio paragraph (translated from the original English "I founded Big Brain Solutions..." bio)
- [ ] Company story paragraphs

## HomeStock (`/homestock/`)
- [ ] Feature descriptions (5 items)
- [ ] "Why we built it" narrative paragraph — this one is the most freely written (not translated from an existing source), worth your closest read
- [ ] "Under the hood" tech paragraph
- [ ] ⚠️ "Uskoro na App Storeu" ("Coming soon") — replace once there's a real App Store link (or Google Play link — confirm if HomeStock is on Android too)

## Contact (`/kontakt/`)
- [ ] Form field labels
- [ ] 6 FAQ question/answer pairs (translated from the real live-site FAQ)
- [ ] Success/error messages for the form

## HomeStock Privacy Policy (`/privatnost-homestock/`)
- [ ] Full legal translation — given this is a legal document, this page most needs a native speaker's read, ideally someone comfortable with Croatian data-protection terminology (AZOP references, GDPR terms). Consider having this specific page reviewed by whoever normally reviews your legal/compliance text, not just for tone.

---

Once you've been through this list, note anything you want changed directly in the relevant `.astro` file, or tell Claude Code what to fix and where.
