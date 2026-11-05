CREATE TABLE restaurants (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  whatsapp TEXT NOT NULL CHECK (
    length(whatsapp) BETWEEN 8 AND 15
    AND whatsapp NOT GLOB '*[^0-9]*'
    AND substr(whatsapp, 1, 1) <> '0'
  ),
  phone TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE daily_menus (
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
  menu_date TEXT NOT NULL CHECK (date(menu_date, '+0 days') IS menu_date),
  first_course TEXT NOT NULL CHECK (length(trim(first_course)) > 0),
  second_course TEXT NOT NULL CHECK (length(trim(second_course)) > 0),
  first_price_bani INTEGER CHECK (first_price_bani > 0),
  second_price_bani INTEGER CHECK (second_price_bani > 0),
  full_price_bani INTEGER NOT NULL CHECK (full_price_bani > 0),
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'sold_out')),
  accepts_card INTEGER NOT NULL DEFAULT 0 CHECK (accepts_card IN (0, 1)),
  offers_delivery INTEGER NOT NULL DEFAULT 0 CHECK (offers_delivery IN (0, 1)),
  allergens TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (restaurant_id, menu_date)
) STRICT;

CREATE INDEX daily_menus_date_state ON daily_menus (menu_date, state);

-- The public API filters this view by today's Europe/Bucharest date.
CREATE VIEW public_menus AS
SELECT
  m.restaurant_id, r.name, r.whatsapp, r.phone, m.menu_date,
  m.first_course, m.second_course, m.first_price_bani, m.second_price_bani,
  m.full_price_bani, m.state, m.accepts_card, m.offers_delivery, m.allergens
FROM daily_menus AS m
JOIN restaurants AS r ON r.id = m.restaurant_id
WHERE r.active = 1 AND m.state IN ('published', 'sold_out');
