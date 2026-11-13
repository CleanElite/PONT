// Official PONT auction calendar. The 23rd is advanced to Friday if Saturday,
// or postponed to Monday if Sunday. UTC keeps dates independent of browser zone.
export function pontAuctionDateForMonth(year, month) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error('Lună invalidă');
  const date = new Date(Date.UTC(year, month - 1, 23, 12));
  if (date.getUTCDay() === 6) date.setUTCDate(22);
  if (date.getUTCDay() === 0) date.setUTCDate(24);
  return date.toISOString().slice(0, 10);
}
// Campaigns are for the following month; bidding takes place in the prior month.
export function pontAuctionDateForCampaign(campaignMonth) {
  if (!/^\d{4}-(0[1-9]|1[0-2])(?:-01)?$/.test(campaignMonth || '')) throw new Error('Campanie invalidă');
  const [year, month] = campaignMonth.split('-').map(Number);
  const preceding = new Date(Date.UTC(year, month - 2, 1, 12));
  return pontAuctionDateForMonth(preceding.getUTCFullYear(), preceding.getUTCMonth() + 1);
}
export function pontAuctionDateLabel(campaignMonth) {
  const date = pontAuctionDateForCampaign(campaignMonth);
  const [y,m,d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('ro-RO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
    .format(new Date(Date.UTC(y,m-1,d,12)));
}

export const PONT_AUCTION_START_HOUR = 10;
export const PONT_AUCTION_END_HOUR = 18;

// Local civil time in Bucharest; DST-safe (no fixed UTC offset).
export function pontAuctionIsInWindow(campaignMonth, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone:'Europe/Bucharest',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(now).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  const currentDate = parts.year+'-'+parts.month+'-'+parts.day;
  const minute = Number(parts.hour) * 60 + Number(parts.minute);
  return currentDate === pontAuctionDateForCampaign(campaignMonth) &&
    minute >= 10 * 60 && minute < 18 * 60;
}
