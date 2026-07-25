const axios = require('axios');

const HEADERS = {
  'User-Agent': 'ScholarHub-HPU/1.0 (https://scholarhubhpu.in; mailto:admin@scholarhubhpu.in)',
  'Accept': 'application/json'
};

/**
 * Extract clean DOI string from full URL or dirty string
 * e.g. "https://doi.org/10.1016/j.solmat.2023.112345" -> "10.1016/j.solmat.2023.112345"
 */
const extractDoi = (inputStr) => {
  if (!inputStr) return null;
  const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i;
  const match = String(inputStr).match(doiRegex);
  return match ? match[1].replace(/[/;.]+$/, '') : null;
};

/**
 * Fetch DOI metadata & cited-by count from OpenAlex & CrossRef APIs
 */
const fetchDoiCitationData = async (doiInput) => {
  const cleanDoi = extractDoi(doiInput);
  if (!cleanDoi) return null;

  // 1. Try OpenAlex API
  try {
    const openAlexUrl = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(cleanDoi)}`;
    const response = await axios.get(openAlexUrl, { headers: HEADERS, timeout: 6000 });
    if (response.data) {
      const data = response.data;
      return {
        doi: cleanDoi,
        citationCount: Number(data.cited_by_count || 0),
        title: data.title || '',
        year: String(data.publication_year || ''),
        journalName: data.primary_location?.source?.display_name || '',
        authors: Array.isArray(data.authorships) ? data.authorships.slice(0, 5).map(a => a.author?.display_name).filter(Boolean).join(', ') : '',
        source: 'OpenAlex API'
      };
    }
  } catch (err) {
    // OpenAlex fallback to CrossRef
  }

  // 2. Try CrossRef API
  try {
    const crossRefUrl = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
    const response = await axios.get(crossRefUrl, { headers: HEADERS, timeout: 6000 });
    if (response.data?.message) {
      const msg = response.data.message;
      const count = Number(msg['is-referenced-by-count'] || 0);
      const title = Array.isArray(msg.title) ? msg.title[0] : msg.title || '';
      const year = msg['published-print']?.['date-parts']?.[0]?.[0] || msg['published-online']?.['date-parts']?.[0]?.[0] || '';
      const journalName = Array.isArray(msg['container-title']) ? msg['container-title'][0] : msg['container-title'] || '';
      const authors = Array.isArray(msg.author) ? msg.author.map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean).join(', ') : '';

      return {
        doi: cleanDoi,
        citationCount: count,
        title,
        year: String(year || ''),
        journalName,
        authors,
        source: 'CrossRef API'
      };
    }
  } catch (err) {
    // Fail silently
  }

  return null;
};

/**
 * Automatically sync publications and compute real h-index, i10-index, and total citations for a user
 */
const syncUserProfileCitations = async (user) => {
  if (!user || !user.profile) return user;

  let profileModified = false;
  const publications = Array.isArray(user.profile.publications) ? user.profile.publications : [];
  const citationCounts = [];

  for (let i = 0; i < publications.length; i++) {
    const pub = publications[i];
    const targetDoi = pub.doi || pub.paperLink || pub.url;
    if (targetDoi) {
      const apiData = await fetchDoiCitationData(targetDoi);
      if (apiData) {
        pub.citationCount = apiData.citationCount;
        if (!pub.title && apiData.title) pub.title = apiData.title;
        if (!pub.journalName && apiData.journalName) pub.journalName = apiData.journalName;
        if (!pub.year && apiData.year) pub.year = apiData.year;
        if (!pub.authors && apiData.authors) pub.authors = apiData.authors;
        profileModified = true;
      }
    }
    citationCounts.push(Number(pub.citationCount || 0));
  }

  // Calculate real h-index and i10-index
  citationCounts.sort((a, b) => b - a);
  let computedHIndex = 0;
  for (let i = 0; i < citationCounts.length; i++) {
    if (citationCounts[i] >= i + 1) {
      computedHIndex = i + 1;
    } else {
      break;
    }
  }
  const computedI10Index = citationCounts.filter(c => c >= 10).length;
  const totalCitations = citationCounts.reduce((sum, val) => sum + val, 0);

  user.profile.metrics = {
    totalCitations,
    hIndex: computedHIndex,
    i10Index: computedI10Index,
    lastSyncedAt: new Date(),
    apiSynced: true
  };
  user.profile.hIndex = computedHIndex;
  user.profile.i10Index = computedI10Index;
  user.profile.googleScholarCitations = totalCitations;

  if (profileModified || !user.profile.metrics?.lastSyncedAt) {
    user.markModified('profile');
    await user.save();
  }

  return user;
};

module.exports = {
  extractDoi,
  fetchDoiCitationData,
  syncUserProfileCitations
};
