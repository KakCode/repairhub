import { prisma } from "@/lib/prisma";
import StarRating from "@/components/StarRating";
import AdminReviewActions from "@/components/AdminReviewActions";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-completed",
  REJECTED: "badge-declined",
};

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { customer: true, shop: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Reviews ({reviews.length})</h2>
      <p className="mb-4 text-sm text-zinc-500">
        New reviews go live immediately. Reject one here to hide it from the public shop page.
      </p>
      {reviews.length === 0 ? (
        <div className="card p-10 text-center text-sm text-zinc-500">No reviews yet.</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{review.customer.name}</span>
                  <span className="text-sm text-zinc-400">on</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{review.shop.name}</span>
                  <span className={STATUS_BADGE[review.status]}>{review.status}</span>
                </div>
                <StarRating value={review.overallRating} readOnly size="text-sm" />
                {review.comment && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{review.comment}</p>
                )}
              </div>
              <AdminReviewActions reviewId={review.id} status={review.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
