const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/research-sync/fetch-profile-data
// @desc    Fetch official academic metrics, publications, and projects from ORCID, Scopus, Google Scholar (SerpAPI), and OpenAlex
// @access  Private
router.post('/fetch-profile-data', protect, async (req, res) => {
  try {
    const { orcidId, scopusId, wosId, vidwanId, googleScholarUrl } = req.body;

    const metrics = {
      hIndex: '',
      i10Index: '',
      scopusCitations: '',
      googleScholarCitations: ''
    };

    const fetchedData = {
      publications: [],
      conferenceProceedings: [],
      experience: [],
      qualifications: [],
      projects: []
    };

    const sourcesSynced = [];
    const errorsEncountered = [];

    // ── 1. ORCID PUBLIC REST API ──
    if (orcidId) {
      const cleanOrcid = orcidId.trim().replace(/^https?:\/\/orcid\.org\//i, '');
      if (cleanOrcid) {
        try {
          const response = await axios.get(`https://pub.orcid.org/v3.0/${cleanOrcid}/record`, {
            headers: { 'Accept': 'application/json' },
            timeout: 10000
          });

          if (response.data) {
            sourcesSynced.push('ORCID');
            const record = response.data;
            const activities = record['activities-summary'] || {};

            // Extract Works (Publications)
            const worksGroups = activities.works?.group || [];
            worksGroups.forEach(group => {
              const summary = group['work-summary']?.[0] || {};
              const title = summary.title?.title?.value || '';
              const journal = summary['journal-title']?.value || '';
              const year = summary['publication-date']?.year?.value || '';
              const type = summary.type || 'JOURNAL';

              let doi = '';
              const externalIds = summary['external-ids']?.['external-id'] || [];
              const doiObj = externalIds.find(id => id['external-id-type']?.toLowerCase() === 'doi');
              if (doiObj) {
                doi = doiObj['external-id-value'];
              }

              if (title) {
                const item = {
                  title,
                  journal: journal || (type.includes('CONFERENCE') ? 'Conference Proceedings' : 'Academic Journal'),
                  year: year ? parseInt(year, 10) : '',
                  type: type.includes('CONFERENCE') ? 'CONFERENCE' : 'JOURNAL',
                  doi: doi || '',
                  url: doi ? `https://doi.org/${doi}` : ''
                };
                if (type.includes('CONFERENCE')) {
                  fetchedData.conferenceProceedings.push(item);
                } else {
                  fetchedData.publications.push(item);
                }
              }
            });

            // Extract Employment (Experience)
            const employmentGroups = activities.employments?.['affiliation-group'] || [];
            employmentGroups.forEach(group => {
              const summaries = group.summaries || [];
              summaries.forEach(s => {
                const emp = s['employment-summary'] || {};
                const designation = emp['role-title'] || 'Faculty/Researcher';
                const org = emp.organization?.name || '';
                const startDate = emp['start-date']?.year?.value || '';
                const endDate = emp['end-date']?.year?.value || 'Present';

                if (org) {
                  fetchedData.experience.push({
                    designation,
                    organization: org,
                    startDate: startDate ? `${startDate}-01-01` : '',
                    endDate: endDate !== 'Present' && endDate ? `${endDate}-12-31` : '',
                    currentlyWorking: endDate === 'Present'
                  });
                }
              });
            });

            // Extract Funding (Projects)
            const fundingGroups = activities.fundings?.group || [];
            fundingGroups.forEach(group => {
              const summary = group['funding-summary']?.[0] || {};
              const title = summary.title?.title?.value || '';
              const org = summary.organization?.name || '';
              const amount = summary.amount?.value || '';
              const currency = summary.amount?.currencyCode || 'INR';

              if (title) {
                fetchedData.projects.push({
                  projectTitle: title,
                  fundingAgency: org,
                  grantAmount: amount ? `${currency} ${amount}` : '',
                  role: 'Principal Investigator',
                  status: 'COMPLETED'
                });
              }
            });
          }
        } catch (orcidErr) {
          console.warn('ORCID API fetch error:', orcidErr.message);
          errorsEncountered.push('ORCID: ' + (orcidErr.response?.data?.message || orcidErr.message));
        }
      }
    }

    // ── 2. ELSEVIER SCOPUS API ──
    if (scopusId) {
      const cleanScopus = scopusId.trim();
      const apiKey = process.env.ELSEVIER_SCOPUS_API_KEY;

      if (cleanScopus && apiKey) {
        try {
          // Author Profile Metrics
          const scopusRes = await axios.get(`https://api.elsevier.com/content/author/author_id/${cleanScopus}?view=METRICS`, {
            headers: {
              'X-ELS-APIKey': apiKey,
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          if (scopusRes.data) {
            sourcesSynced.push('Scopus');
            const authorData = scopusRes.data['author-retrieval-response']?.[0] || scopusRes.data['author-retrieval-response-list']?.[0];
            if (authorData) {
              const core = authorData.coredata || {};
              const hIndexVal = authorData['h-index'] || core['h-index'];
              const citationsVal = core['citation-count'];

              if (hIndexVal) metrics.hIndex = parseInt(hIndexVal, 10);
              if (citationsVal) metrics.scopusCitations = parseInt(citationsVal, 10);
            }
          }

          // Also search Scopus Documents
          try {
            const docSearchRes = await axios.get(`https://api.elsevier.com/content/search/scopus?query=AU-ID(${cleanScopus})&count=20`, {
              headers: {
                'X-ELS-APIKey': apiKey,
                'Accept': 'application/json'
              },
              timeout: 10000
            });

            const entries = docSearchRes.data?.['search-results']?.entry || [];
            entries.forEach(entry => {
              const title = entry['dc:title'];
              const journal = entry['prism:publicationName'];
              const coverDate = entry['prism:coverDate'];
              const year = coverDate ? coverDate.split('-')[0] : '';
              const doi = entry['prism:doi'];

              if (title && !fetchedData.publications.some(p => p.title.toLowerCase() === title.toLowerCase())) {
                fetchedData.publications.push({
                  title,
                  journal: journal || 'Scopus Indexed Journal',
                  year: year ? parseInt(year, 10) : '',
                  type: 'JOURNAL',
                  doi: doi || '',
                  url: doi ? `https://doi.org/${doi}` : ''
                });
              }
            });
          } catch (docErr) {
            console.warn('Scopus document search warning:', docErr.message);
          }
        } catch (scopusErr) {
          console.warn('Scopus API fetch error:', scopusErr.message);
          errorsEncountered.push('Scopus: ' + (scopusErr.response?.data?.['service-error']?.status?.statusText || scopusErr.message));
        }
      }
    }

    // ── 3. GOOGLE SCHOLAR (SERPAPI WITH LIMIT FALLBACK & OPENALEX) ──
    if (googleScholarUrl) {
      const match = googleScholarUrl.match(/user=([a-zA-Z0-9_-]+)/);
      const authorId = match ? match[1] : null;
      const serpApiKey = process.env.SERPAPI_KEY;

      let scholarFetched = false;

      if (authorId && serpApiKey) {
        try {
          const serpRes = await axios.get('https://serpapi.com/search.json', {
            params: {
              engine: 'google_scholar_author',
              author_id: authorId,
              api_key: serpApiKey
            },
            timeout: 10000
          });

          if (serpRes.data && serpRes.data.cited_by) {
            const table = serpRes.data.cited_by.table || [];
            // Table structure: [{citations: {all: 2890}}, {h_index: {all: 18}}, {i10_index: {all: 24}}]
            const citationsObj = table.find(item => item.citations);
            const hIndexObj = table.find(item => item.h_index);
            const i10IndexObj = table.find(item => item.i10_index);

            if (citationsObj?.citations?.all) metrics.googleScholarCitations = parseInt(citationsObj.citations.all, 10);
            if (hIndexObj?.h_index?.all) metrics.hIndex = metrics.hIndex || parseInt(hIndexObj.h_index.all, 10);
            if (i10IndexObj?.i10_index?.all) metrics.i10Index = parseInt(i10IndexObj.i10_index.all, 10);

            sourcesSynced.push('Google Scholar (SerpAPI)');
            scholarFetched = true;

            // Extract articles from Google Scholar
            const articles = serpRes.data.articles || [];
            articles.forEach(art => {
              const title = art.title;
              const journal = art.publication;
              const year = art.year;
              const link = art.link;

              if (title && !fetchedData.publications.some(p => p.title.toLowerCase() === title.toLowerCase())) {
                fetchedData.publications.push({
                  title,
                  journal: journal || 'Scholar Publication',
                  year: year ? parseInt(year, 10) : '',
                  type: 'JOURNAL',
                  doi: '',
                  url: link || ''
                });
              }
            });
          }
        } catch (serpErr) {
          console.warn('SerpAPI error/limit reached, skipping Google Scholar scrape:', serpErr.message);
          errorsEncountered.push('SerpAPI limit reached or skipped (using OpenAlex fallback)');
        }
      }

      // ── 4. OPENALEX API (FALLBACK & METRICS ENRICHMENT) ──
      if (!scholarFetched || orcidId) {
        try {
          const openAlexApiKey = process.env.OPENALEX_API_KEY;
          let openAlexUrl = '';

          if (orcidId) {
            const cleanOrcid = orcidId.trim().replace(/^https?:\/\/orcid\.org\//i, '');
            openAlexUrl = `https://api.openalex.org/authors/https://orcid.org/${cleanOrcid}`;
          }

          if (openAlexUrl) {
            const alexRes = await axios.get(openAlexUrl, {
              params: openAlexApiKey ? { api_key: openAlexApiKey } : {},
              timeout: 10000
            });

            if (alexRes.data) {
              const alex = alexRes.data;
              const summaryStats = alex.summary_stats || {};

              if (summaryStats.h_index && !metrics.hIndex) {
                metrics.hIndex = parseInt(summaryStats.h_index, 10);
              }
              if (summaryStats.i10_index && !metrics.i10Index) {
                metrics.i10Index = parseInt(summaryStats.i10_index, 10);
              }
              if (alex.cited_by_count && !metrics.googleScholarCitations) {
                metrics.googleScholarCitations = parseInt(alex.cited_by_count, 10);
              }

              sourcesSynced.push('OpenAlex');
            }
          }
        } catch (alexErr) {
          console.warn('OpenAlex API warning:', alexErr.message);
        }
      }
    }

    return res.json({
      success: true,
      metrics,
      fetchedData,
      sourcesSynced,
      errorsEncountered
    });

  } catch (err) {
    console.error('Error fetching research profile data:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch research profile data from external APIs',
      error: err.message
    });
  }
});

module.exports = router;
