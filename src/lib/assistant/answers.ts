export type AssistantProductContext = {
  title: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  framework: string | null;
  technologies: string[];
  features: string[];
  requirements: string[];
  license: string;
  version: string;
  reviews: { rating: number; comment: string }[];
};

export type AssistantSellerEarningsContext = {
  currency: string;
  availableBalance: number;
  pendingEarnings: number;
  minimumPayout: number;
  commissionRateBps: number;
  nextAvailableAt: string | null;
  payoutAccountVerified: boolean;
  activePayoutStatus: string | null;
  latestPayout: {
    amount: number;
    currency: string;
    status: string;
    requestedAt: string;
    failureReason: string | null;
  } | null;
};

export type AssistantBuyerPurchasesContext = {
  hasMore: boolean;
  purchases: {
    reference: string;
    productName: string;
    purchasedAt: string;
    orderStatus: string;
    paymentConfirmed: boolean;
    refundStatuses: string[];
    downloadCount: number;
    mostRecentDownloadAt: string | null;
    downloadableFilesAvailable: boolean;
  }[];
};

export type AssistantSellerStoreContext = {
  storeName: string | null;
  storeDescription: string | null;
  category: string | null;
  visibility: string | null;
  hasLogo: boolean;
  hasBanner: boolean;
  hasCustomUrl: boolean;
};

export type AssistantContext = {
  page: string;
  marketIntelligence: {
    liveMarketplaceSalesAnalyticsAvailableToAssistant: false;
    liveExternalResearchAvailableToAssistant: false;
  };
  marketplace: {
    commissionRatePercent: number;
    minimumPayout: number;
    currency: string;
    earningHoldDays: number;
  };
  product?: AssistantProductContext;
  sellerStore?: AssistantSellerStoreContext;
  sellerEarnings?: AssistantSellerEarningsContext;
  buyerPurchases?: AssistantBuyerPurchasesContext;
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function answerSellerEarnings(question: string, context: AssistantSellerEarningsContext) {
  const text = question.toLowerCase();
  if (/\b(add|set up|setup|change|update|verify)\b.*\b(payout|bank|account)\b|\b(payout|bank)\b.*\b(account|details)\b/.test(text)) {
    return context.payoutAccountVerified
      ? "Your payout account is verified. You can review its details from the Payouts page in your seller dashboard."
      : "Open Payouts in your seller dashboard to add your bank details and complete verification. You'll need a verified payout account before requesting a transfer.";
  }
  if (/\b(latest|last|status|where is my payout)\b/.test(text)) {
    if (!context.latestPayout) return "I don't see a payout request on your account yet. You can check or request one from your Payouts page.";
    const requestedAt = new Date(context.latestPayout.requestedAt).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "UTC" });
    const failure = context.latestPayout.failureReason ? ` The note on it says: ${context.latestPayout.failureReason}` : "";
    return `Your latest payout is ${context.latestPayout.status.toLowerCase()} for ${formatNaira(context.latestPayout.amount)}. You requested it on ${requestedAt}.${failure}`;
  }

  const summary = `You have ${formatNaira(context.availableBalance)} available to withdraw, and ${formatNaira(context.pendingEarnings)} still pending. The minimum payout is ${formatNaira(context.minimumPayout)}.`;
  const blockers: string[] = [];
  if (!context.payoutAccountVerified) blockers.push("Your payout account still needs to be added and verified.");
  if (context.activePayoutStatus) {
    const payout = context.latestPayout;
    blockers.push(`A payout${payout ? ` for ${formatNaira(payout.amount)}` : ""} is currently ${context.activePayoutStatus.toLowerCase()}, so that amount is on hold while it's being handled.`);
  }
  if (context.availableBalance < context.minimumPayout) blockers.push(`Your available balance hasn't reached the ${formatNaira(context.minimumPayout)} minimum yet.`);
  if (context.pendingEarnings > 0) {
    blockers.push(context.nextAvailableAt
      ? `Pending earnings are still on hold; the next release is scheduled for ${new Date(context.nextAvailableAt).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: "UTC" })}.`
      : "Pending earnings aren't available to withdraw yet.");
  }
  if (context.latestPayout && ["FAILED", "CANCELLED"].includes(context.latestPayout.status)) {
    blockers.push(`Your last payout was ${context.latestPayout.status.toLowerCase()}${context.latestPayout.failureReason ? `: ${context.latestPayout.failureReason}` : "."}`);
  }
  if (blockers.length) {
    return `${summary}\n\n${blockers.join(" ")} Check your Payouts page for the latest details.`;
  }
  return `${summary}\n\nEverything looks ready to request a payout. You can do that from your Payouts page; it will still need review.`;
}

function answerProductQuestion(question: string, product: AssistantProductContext) {
  const text = question.toLowerCase();
  if (/\b(review|rating)\b/.test(text) && /\b(write|leave|submit|post|add)\b/.test(text)) {
    return "You can review products you've purchased. Open Reviews from your account to see which purchases are eligible.";
  }
  if (/\b(requirements?|prerequisites?|need to run|compatible)\b/.test(text)) {
    return product.requirements.length
      ? `For ${product.title}, the listed requirements are:\n${product.requirements.map((item) => `• ${item}`).join("\n")}`
      : `I don't see any specific requirements listed for ${product.title}. If compatibility is important, it's worth checking with the seller before buying.`;
  }
  if (/\b(features?|include[sd]?|what do i get|what's included|whats included)\b/.test(text)) {
    if (!product.features.length && !product.description) return `I don't see feature details for ${product.title} on the listing. You could ask the seller for more information before buying.`;
    const features = product.features.length
      ? `It includes:\n${product.features.map((item) => `• ${item}`).join("\n")}`
      : "";
    return [features, product.description].filter(Boolean).join("\n\n");
  }
  if (/\b(price|cost|discount|sale)\b/.test(text)) {
    const originalPrice = product.compareAtPrice && product.compareAtPrice > product.price
      ? `, down from ${formatNaira(product.compareAtPrice)}`
      : "";
    return `${product.title} costs ${formatNaira(product.price)}${originalPrice}.`;
  }
  if (/\b(review|rating|rated|stars?|feedback|buyers? say|buyers? think|people say)\b/.test(text)) {
    if (product.reviewCount === 0) return `${product.title} hasn't received a review yet.`;
    const rating = `${product.rating.toFixed(1)}/5 from ${product.reviewCount} review${product.reviewCount === 1 ? "" : "s"}`;
    const reviews = product.reviews.filter((review) => review.comment.trim()).slice(0, 3);
    return `${product.title} is rated ${rating}.${reviews.length ? `\n\nA few recent comments:\n${reviews.map((review) => `• ${review.rating}/5 — ${review.comment}`).join("\n")}` : ""}`;
  }
  if (/\b(technology|technologies|tech stack|framework|stack)\b/.test(text)) {
    const details = [...new Set([product.framework, ...product.technologies].filter((value): value is string => Boolean(value?.trim())))];
    return details.length ? `${product.title} uses ${details.join(", ")}.` : `The listing doesn't say which technologies ${product.title} uses.`;
  }
  if (/\b(worth|good fit|right for me|should i buy|recommend)\b/.test(text)) {
    return `That depends on what you need it for. ${product.title} is a ${product.category.toLowerCase()}${product.rating > 0 ? `, rated ${product.rating.toFixed(1)}/5` : ""}. Check whether its features and requirements match your project, and whether the price works for you.`;
  }
  if (/\b(product|tell me about|description|overview|what is this)\b/.test(text)) {
    const intro = `${product.title} is in ${product.category.toLowerCase()}.`;
    const rating = product.reviewCount > 0 ? `It's rated ${product.rating.toFixed(1)}/5 from ${product.reviewCount} reviews.` : "It hasn't been reviewed yet.";
    return [intro, product.description, `It's ${formatNaira(product.price)}. ${rating}`].filter(Boolean).join("\n\n");
  }
  return null;
}

export function getBuiltInAssistantAnswer(question: string, context: AssistantContext, includeSellerEarnings = false) {
  const text = question.toLowerCase();
  if (context.sellerEarnings && (includeSellerEarnings || /\b(withdraw|payout|earnings?|available balance|balance|cash out|pending|minimum|money)\b/i.test(question))) {
    return answerSellerEarnings(question, context.sellerEarnings);
  }

  if (context.product) {
    const productAnswer = answerProductQuestion(question, context.product);
    if (productAnswer) return productAnswer;
  }

  if (context.page.startsWith("/products/") && !context.product) {
    return "I can't see this product's details right now. Try refreshing the page, or get in touch with support if it keeps happening.";
  }
  if (/\b(find|search|browse|discover)\b.*\b(product|item|template|script|digital)\b|\b(product|item|template|script|digital)\b.*\b(find|search|browse|discover)\b/.test(text)) {
    return "Head to Marketplace to browse products. You can search by name and narrow the results with categories, price, rating, and sorting options.";
  }
  if (/\b(save|saved|wishlist|wish list|favourites?|favorites?)\b/.test(text)) {
    return "Tap the heart on a product to save it. You can come back to your saved items from Wishlist.";
  }
  if (/\b(review|rating)\b/.test(text) && /\b(write|leave|submit|post|add)\b/.test(text)) {
    return "You can review products you've purchased. Open Reviews from your account to see which purchases are eligible.";
  }
  if (/\b(refund|refunds|dispute|charged twice|payment failed)\b/.test(text)) {
    return "Sorry you're having trouble with a payment or order. Contact support and include your order details so the team can look into it. Please don't send your password or full payment details.";
  }
  if (/\b(downloads?|files?|access|where is my purchase|purchase.*(missing|showing|appear)|missing.*purchase)\b/.test(text)) {
    return "You can find your purchases and available files on the Purchases page. If something you've paid for isn't showing up, contact support with your order details.";
  }
  if (/\b(seller|sell|selling|become a seller|application)\b/.test(text)) {
    return "Thinking about selling on Devisima? Start with the seller application. Once it's approved, you'll be able to manage your listings from your seller dashboard.";
  }
  if (/\b(list|upload|publish|submit)\b.*\b(product|item|listing)\b|\b(product|item|listing)\b.*\b(list|upload|publish|submit)\b/.test(text)) {
    return "Once your seller account is approved, open Seller Products and choose to add a product. Fill in its details, upload the files and images, then submit it for review before it goes live.";
  }
  if (/\b(add|set up|setup|change|update|verify)\b.*\b(payout|bank|account)\b|\b(payout|bank)\b.*\b(account|details)\b/.test(text)) {
    return "Open Payouts in your seller dashboard to add or update your payout account. You'll need to complete verification before you can request a payout.";
  }
  if (/\b(order|purchase)\b.*\b(help|support|problem|issue)\b|\b(help|support)\b.*\b(order|purchase)\b/.test(text)) {
    return "Sorry there's an issue with your order. Contact support from the Contact page and include your order details so the team can help.";
  }
  if (/\b(payout|withdraw|withdrawal|earnings)\b/.test(text)) {
    return "If you're a seller, your earnings and payout details are on the Seller Earnings and Payouts pages. Whether you can withdraw depends on your available balance, the minimum payout, and a verified payout account.";
  }
  if (/\b(coupons?|discounts?|promo codes?|deals?)\b/.test(text)) {
    return "Have a coupon? Enter it at checkout and make sure the total updates before you pay. You can also check the Deals page for current offers.";
  }
  if (/\b(account|password|profile|sign in|login)\b/.test(text)) {
    return "You can update your account from Settings. If you're locked out, use the password recovery link on the sign-in page.";
  }
  if (/\b(how does devisima work|what is devisima|about devisima)\b/.test(text)) {
    return "Devisima is a marketplace for digital products. You can browse listings, buy what you need, and find your purchases and available downloads in your account. Sellers can apply to list their own products.";
  }
  if (/\b(buy|buying|purchase|checkout|cart|pay|payment)\b/.test(text)) {
    return "When you find something you like, add it to your cart and head to checkout. Once your payment is confirmed, you'll find the order and any available downloads under Purchases.";
  }
  return "I can help with the product you're viewing, buying and downloading, seller applications, payouts, coupons, or your account. What are you trying to do?";
}
