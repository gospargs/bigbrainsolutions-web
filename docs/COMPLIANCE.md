# Compliance

## Anchor prices and the published price list (COMPLIANCE-001)

Croatian Government decisions NN 101/26 (*Odluka o isticanju dodatne cijene* and *Odluka o objavi cjenika proizvoda i usluga kao mjera izravne kontrole cijena*), with the effective date moved to 17.11.2026 by NN 110/26, require two things from this site for every service with a fixed public price:

1. **An anchor price (*sidrena cijena*) shown next to the price.** These are the six service cards on `/usluge/` and `/en/services/` that carry an `anchor` value.
2. **A machine-readable price list published on the site**, linked from the footer on every page. The current file is `PRICE_LIST_PATH` in `src/data/price-list.ts`, served from `public/`.

Services priced as "Individualna ponuda" / "Custom quote" have no fixed price and are not in scope.

### Current anchor prices

The anchor price is the price in effect on 10.9.2026. Git history shows none of the six changed between 19.8.2026 (CONTENT-004 lowered Izrada web stranica from 800 € to 500 €) and 16.11.2026, so each anchor equals its current price.

| Service | Price | Anchor price |
|---|---|---|
| Popravak i instalacija računala | od 35 € | 35 € |
| Uklanjanje virusa i zlonamjernog softvera | od 30 € | 30 € |
| Postavljanje i podrška mreže | od 45 € | 45 € |
| Hardverske usluge | od 25 € | 25 € |
| Softverske usluge | od 20 € | 20 € |
| Izrada web stranica | od 500 € | 500 € |

### File format

- UTF-8 with a byte-order mark, so Excel opens Croatian characters correctly. `;` as delimiter, decimal comma, one header row.
- Columns: `naziv_usluge;maloprodajna_cijena;posebni_oblik_prodaje;sidrena_cijena`. `posebni_oblik_prodaje` is empty while no promotion runs.
- File name: `cjenik-bigbrain-solutions-rijecka-15a-dubrovnik-usluge-YYYYMMDD-HHMM.csv`, in Zagreb time. The decision asks for the premises type, address, designation, storage number and timestamp. There is no storage number for a single-location service business.

### When any of the six prices changes

1. Update the price and, if needed, the anchor in both `src/pages/usluge.astro` and `src/pages/en/services.astro`. Under the decision, the anchor stays the 10.9.2026 price.
2. Add a **new** CSV in `public/` with the current date and time in its name and the new values. Do not edit the old file.
3. Point `PRICE_LIST_PATH` in `src/data/price-list.ts` at the new file.
4. **Keep the previous file in `public/` for 30 days** after the change, then delete it. Note its removal date in the table below.
5. A price change must be live by 8:00 on the day it takes effect.

| File | Published | Replaced | Delete after |
|---|---|---|---|
| `cjenik-bigbrain-solutions-rijecka-15a-dubrovnik-usluge-20261116-2150.csv` | 16.11.2026 | — | — |
