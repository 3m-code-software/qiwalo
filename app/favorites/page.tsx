import type { Metadata } from "next";
import FavoritesList from "@/components/FavoritesList";
import { getRepo } from "@/lib/repo";

export const metadata: Metadata = {
  title: "المفضلة",
  description: "الوحدات التي حفظتها في قيوالو على هذا الجهاز.",
};

export const instant = false;

export default async function FavoritesPage() {
  const properties = (await getRepo().then((repo) => repo.listAllProperties()))
    .filter((property) => property.status === "PUBLISHED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-7">
        <span className="eyebrow !text-gold">قائمتك الخاصة</span>
        <h1 className="mt-2 text-3xl font-black text-navy md:text-4xl">المفضلة</h1>
        <p className="muted mt-2 max-w-2xl text-sm leading-7">
          الوحدات اللي حفظتها بتتخزن في متصفحك فقط على هذا الجهاز. تقدر تشيلها من القائمة في أي وقت.
        </p>
      </div>
      <FavoritesList properties={properties} />
    </div>
  );
}
