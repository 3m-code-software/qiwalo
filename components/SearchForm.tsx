import { AMENITIES, CITIES, PROPERTY_TYPES } from "@/lib/constants";
import type { CityKey, PropertyType, SearchFilter } from "@/lib/types";

export default function SearchForm({ initial = {} }: { initial?: SearchFilter }) {
  return (
    <form
      action="/search"
      method="get"
      className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-2xl shadow-navy/15 ring-1 ring-gold/10 md:grid-cols-2 lg:grid-cols-12"
    >
      <div className="lg:col-span-4">
        <label className="label" htmlFor="q">الوجهة أو اسم الوحدة</label>
        <input id="q" name="q" className="input" placeholder="الأقصر، أسوان، النيل..." defaultValue={initial.q ?? ""} />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="city">المدينة</label>
        <select id="city" name="city" className="input" defaultValue={initial.city ?? ""}>
          <option value="">كل المدن</option>
          {(Object.keys(CITIES) as CityKey[]).map((k) => <option key={k} value={k}>{CITIES[k].ar}</option>)}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="type">نوع الوحدة</label>
        <select id="type" name="type" className="input" defaultValue={initial.type ?? ""}>
          <option value="">كل الأنواع</option>
          {(Object.keys(PROPERTY_TYPES) as PropertyType[]).map((k) => (
            <option key={k} value={k}>{PROPERTY_TYPES[k].ar}</option>
          ))}
        </select>
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="checkIn">الوصول</label>
        <input id="checkIn" name="checkIn" type="date" className="input" defaultValue={initial.checkIn ?? ""} />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="checkOut">المغادرة</label>
        <input id="checkOut" name="checkOut" type="date" className="input" defaultValue={initial.checkOut ?? ""} />
      </div>

      <div className="lg:col-span-2">
        <label className="label" htmlFor="guests">الضيوف</label>
        <input id="guests" name="guests" type="number" min={1} max={12} className="input" defaultValue={initial.guests ?? 1} />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="minPrice">السعر من</label>
        <input id="minPrice" name="minPrice" type="number" min={0} className="input" placeholder="الحد الأدنى" defaultValue={initial.minPrice ?? ""} />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="maxPrice">السعر إلى</label>
        <input id="maxPrice" name="maxPrice" type="number" min={0} className="input" placeholder="الحد الأعلى" defaultValue={initial.maxPrice ?? ""} />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="minRating">التقييم</label>
        <select id="minRating" name="minRating" className="input" defaultValue={initial.minRating != null ? String(initial.minRating) : ""}>
          <option value="">كل التقييمات</option>
          <option value="3">★ 3 فأكثر</option>
          <option value="4">★ 4 فأكثر</option>
          <option value="5">★ 5 فقط</option>
        </select>
      </div>
      <div className="flex items-end lg:col-span-4">
        <button type="submit" className="btn-gold w-full !py-3">ابحث عن إقامتك</button>
      </div>

      <fieldset className="lg:col-span-12">
        <legend className="label !mb-2">المرافق</legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-ivory p-3 sm:grid-cols-3 lg:grid-cols-5">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-navy transition hover:bg-gold-soft">
              <input
                type="checkbox"
                name="amenities"
                value={amenity}
                defaultChecked={initial.amenities?.includes(amenity) ?? false}
                className="h-4 w-4 shrink-0 accent-[#c6a15b]"
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
