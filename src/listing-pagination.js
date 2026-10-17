// Fetch every approved public page, retaining only one record per property.
export async function allPublishedListings(fetchPage) {
  const records = new Map();
  let cursor = null;
  do {
    const page = await fetchPage(cursor);
    for (const item of page.items) records.set(item.id, item);
    if (!page.more) break;
    if (!page.cursor || page.cursor === cursor) throw Error("Listings could not finish loading. Please retry.");
    cursor = page.cursor;
  } while (true);
  return [...records.values()];
}
