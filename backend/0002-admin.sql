-- Apply after 0001-menus.sql.
CREATE TABLE restaurant_admins (
 email TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
 restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1))
) STRICT;
CREATE INDEX restaurant_admins_restaurant ON restaurant_admins(restaurant_id);
-- Add one verified email per restaurant administrator through a private D1 command.
-- Never commit administrator email addresses or access tokens to GitHub.
