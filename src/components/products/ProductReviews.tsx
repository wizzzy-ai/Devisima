import { Star, BadgeCheck, MessageSquareText } from "lucide-react";

type ReviewData = {
  id: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
  user: { name: string };
};

export function ProductReviews({
  averageRating,
  reviewCount,
  reviews,
  ratingCounts,
}: {
  averageRating: number;
  reviewCount: number;
  reviews: ReviewData[];
  ratingCounts: Array<{ rating: number; _count: { _all: number } }>;
}) {
  const counts = new Map(ratingCounts.map((item) => [item.rating, item._count._all]));
  const actualCount = ratingCounts.reduce((total, item) => total + item._count._all, 0);

  return (
    <section id="reviews" className="scroll-mt-8 border-t border-[#e3e8e2] pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0F4C5C]">Buyer feedback</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#101820]">Reviews</h2></div>
        <p className="text-sm text-[#66756b]">Reviews are available to read. Verified purchase reviews can be added when the purchase flow is available.</p>
      </div>

      <div className="mt-5 grid gap-6 rounded-2xl border border-[#dce3dd] bg-white p-5 md:grid-cols-[220px_1fr] md:p-6">
        <div className="flex items-center gap-4 md:block">
          <div><p className="text-4xl font-semibold tracking-tight text-[#173d36]">{reviewCount > 0 ? averageRating.toFixed(1) : "—"}</p><div className="mt-2 flex text-[#d6a533]" aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < Math.round(averageRating) && reviewCount > 0 ? "fill-current" : ""}`} />)}</div><p className="mt-2 text-sm text-[#66756b]">{reviewCount} review{reviewCount === 1 ? "" : "s"}</p></div>
          <div className="ml-auto h-20 w-px bg-[#e7ece7] md:hidden" />
          <div className="hidden md:block" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = counts.get(rating) ?? 0;
            const percentage = actualCount ? (count / actualCount) * 100 : 0;
            return <div key={rating} className="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-xs text-[#66756b]"><span>{rating} star</span><div className="h-2 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full rounded-full bg-[#d6a533]" style={{ width: `${percentage}%` }} /></div><span className="text-right">{count}</span></div>;
          })}
        </div>
      </div>

      {reviews.length ? <div className="mt-5 divide-y divide-[#e3e8e2] rounded-2xl border border-[#dce3dd] bg-white px-5 sm:px-6">
        {reviews.map((review) => {
          const initials = review.user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
          return <article key={review.id} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8f1e8] text-xs font-bold text-[#174c43]">{initials}</span>
              <span className="font-semibold text-[#173d36]">{review.user.name}</span>
              <span className="flex items-center text-[#d6a533]" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : ""}`} />)}</span>
              <time className="ml-auto text-xs text-[#748077]" dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</time>
            </div>
            <div className="ml-12 mt-2">{review.isVerified && <span className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#28735f]"><BadgeCheck className="h-3.5 w-3.5" /> Verified purchase</span>}<p className="whitespace-pre-wrap text-sm leading-6 text-[#4e5d54]">{review.comment}</p></div>
          </article>;
        })}
        {reviewCount > reviews.length && <p className="border-t border-[#e3e8e2] py-4 text-center text-sm text-[#66756b]">Showing the latest {reviews.length} reviews.</p>}
      </div> : <div className="mt-5 rounded-2xl border border-dashed border-[#cdd8ce] bg-white px-6 py-10 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-[#0F4C5C]/60" /><h3 className="mt-3 font-semibold text-[#263d34]">No reviews yet</h3><p className="mt-1 text-sm text-[#66756b]">Be the first to share feedback after verified purchases are supported.</p></div>}
    </section>
  );
}
