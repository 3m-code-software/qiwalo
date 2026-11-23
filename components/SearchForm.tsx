import { CITIES } from "@/lib/constants";
import type { CityKey, SearchFilter } from "@/lib/types";

export default function SearchForm({ initial = {} }: { initial?: SearchFilter }) {
  return (
    <form
      action="/search"
      method="get"
      className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-2xl shadow-navy/15 ring-1 ring-gold/10 md:grid-cols-2 lg:grid-cols-6"
    >
      <div className="lg:col-span-2">
        <label className="label" htmlFor="q">الوجهة أو اسم الوحدة</label>
        <input id="q" name="q" className="input" placeholder="الأقصر، أسوان، النيل..." defaultValue={initial.q ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="city">المدينة</label>
        <select id="city" name="city" className="input" defaultValue={initial.city ?? ""}>
          <option value="">كل المدن</option>
          {(Object.keys(CITIES) as CityKey[]).map((k) => <option key={k} value={k}>{CITIES[k].ar}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="checkIn">الوصول</label>
        <input id="checkIn" name="checkIn" type="date" className="input" defaultValue={initial.checkIn ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="checkOut">المغادرة</label>
        <input id="checkOut" name="checkOut" type="date" className="input" defaultValue={initial.checkOut ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="guests">الضيوف</label>
        <input id="guests" name="guests" type="number" min={1} max={12} className="input" defaultValue={initial.guests ?? 1} />
      </div>
      <div className="flex items-end lg:col-span-6">
        <button type="submit" className="btn-gold w-full !py-3">ابحث عن إقامتك</button>
      </div>
    </form>
  );
}
