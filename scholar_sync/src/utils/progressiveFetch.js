import axios from 'axios';

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Fetch data progressively in chunks. Resolves with first 10 items instantly to populate UI
 * and clear loading states, then queries the remaining items in the background.
 */
export const progressiveFetch = async (url, config = {}, onUpdate) => {
  const delim = url.includes('?') ? '&' : '?';
  const headers = {
    ...getAuthHeader(),
    ...(config.headers || {})
  };
  const requestConfig = { ...config, headers };

  // 1. First 10 items (Instant response)
  const firstRes = await axios.get(`${url}${delim}limit=10`, requestConfig);
  onUpdate(firstRes.data, false);
  
  // 2. Background remaining items (Silent loading)
  try {
    const restRes = await axios.get(`${url}${delim}skip=10`, requestConfig);
    if (restRes.data && restRes.data.length > 0) {
      onUpdate(restRes.data, true);
    }
  } catch (err) {
    console.error('Background progressive fetch failed:', err);
  }
  return firstRes.data;
};
