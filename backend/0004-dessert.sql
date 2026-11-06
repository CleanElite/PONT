-- Optional dessert, only shown when explicitly entered by restaurant.
ALTER TABLE daily_menus ADD COLUMN dessert TEXT NOT NULL DEFAULT '' CHECK(length(dessert)<=300);
DROP VIEW IF EXISTS public_menus;
CREATE VIEW public_menus AS
SELECT m.restaurant_id,r.name,r.whatsapp,r.phone,m.menu_date,
 m.first_course,m.second_course,m.dessert,m.first_price_bani,m.second_price_bani,
 m.full_price_bani,m.state,m.accepts_card,m.offers_delivery,m.allergens
FROM daily_menus m JOIN restaurants r ON r.id=m.restaurant_id
WHERE r.active=1 AND m.state IN ('published','sold_out');
