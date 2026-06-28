/**
 * Fetch data progressively in chunks using the provided axios/api instance.
 * Resolves with first 10 items instantly to populate UI and clear loading states,
 * then queries the remaining items in the background.
 */
export const progressiveFetch = async (api, url, config = {}, onUpdate) => {
  const delim = url.includes('?') ? '&' : '?';

  // 1. First 10 items (Instant response)
  const firstRes = await api.get(`${url}${delim}limit=10`, config);
  onUpdate(firstRes.data, false);
  
  // 2. Background remaining items (Silent loading)
  try {
    const restRes = await api.get(`${url}${delim}skip=10`, config);
    if (restRes.data && restRes.data.length > 0) {
      onUpdate(restRes.data, true);
    }
  } catch (err) {
    console.error('Background progressive fetch failed:', err);
  }
  return firstRes.data;
};
