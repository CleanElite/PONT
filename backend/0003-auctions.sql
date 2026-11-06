-- PONT promoted placements: restaurant-scoped bidding ledger.
-- All amounts are integer bani. Minimum eligible bid: 5000 bani (50 lei).
-- A bid is an offer, not a payment. Settlement and invoicing are separate.
CREATE TABLE promotion_auctions (
 id TEXT PRIMARY KEY NOT NULL,
 title TEXT NOT NULL,
 starts_at TEXT NOT NULL,
 ends_at TEXT NOT NULL,
 placement_date TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','closed','cancelled')),
 minimum_bid_bani INTEGER NOT NULL DEFAULT 5000 CHECK(minimum_bid_bani>=5000),
 CHECK(ends_at>starts_at)
) STRICT;
CREATE TABLE promotion_bids (
 id TEXT PRIMARY KEY NOT NULL,
 auction_id TEXT NOT NULL REFERENCES promotion_auctions(id),
 restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
 amount_bani INTEGER NOT NULL CHECK(amount_bani>=5000),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid','withdrawn','disqualified'))
) STRICT;
CREATE INDEX promotion_bids_ranking ON promotion_bids(auction_id,status,amount_bani DESC,created_at ASC);
CREATE INDEX promotion_bids_restaurant ON promotion_bids(restaurant_id,auction_id);
-- Deterministic rank: largest bid first; earlier bid wins ties.
CREATE VIEW promotion_rankings AS
SELECT b.auction_id,b.restaurant_id,b.amount_bani,b.created_at,
 ROW_NUMBER() OVER(PARTITION BY b.auction_id ORDER BY b.amount_bani DESC,b.created_at ASC,b.id ASC) AS placement_rank
FROM promotion_bids b JOIN promotion_auctions a ON a.id=b.auction_id
WHERE b.status='valid' AND a.status='closed';
-- Future work: bidding rules, maximum one active bid per restaurant, payment verification,
-- refunds, tie policy and moderation must be agreed before enabling bidding.
