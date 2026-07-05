import Link from "next/link";
import Image from "next/image";

export interface ShopCardData {
  id: string;
  name: string;
  categories: string[];
  address: string;
  photoUrl?: string;
  rating: number | null;
  reviewCount: number;
  isOpenNow: boolean;
  isVerified?: boolean;
  distanceKm?: number;
}

export default function ShopCard({ shop }: { shop: ShopCardData }) {
  return (
    <Link href={`/shops/${shop.id}`} className="card-hover group flex gap-4 p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-zinc-800 dark:to-zinc-900">
        {shop.photoUrl ? (
          <Image src={shop.photoUrl} alt={shop.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🔧</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold transition-colors group-hover:text-orange-600">{shop.name}</h3>
            {shop.isVerified && <span className="badge-open shrink-0">✓ Verified</span>}
          </div>
          <span className={shop.isOpenNow ? "badge-open shrink-0" : "badge-closed shrink-0"}>
            {shop.isOpenNow ? "Open now" : "Closed"}
          </span>
        </div>
        <p className="text-sm text-zinc-500">{shop.categories.join(" · ")}</p>
        <p className="text-xs text-zinc-400">{shop.address}</p>
        <div className="mt-auto flex items-center gap-2 text-sm">
          {shop.rating !== null ? (
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="text-amber-500">⭐</span> {shop.rating.toFixed(1)}{" "}
              <span className="font-normal text-zinc-400">({shop.reviewCount})</span>
            </span>
          ) : (
            <span className="text-zinc-400">No reviews yet</span>
          )}
          {shop.distanceKm !== undefined && (
            <span className="text-zinc-400">· {shop.distanceKm.toFixed(1)} km away</span>
          )}
        </div>
      </div>
    </Link>
  );
}
