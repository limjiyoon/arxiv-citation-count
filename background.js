// Background script to handle Google Scholar requests (bypasses CORS)

// Cache for storing citation counts (expires after 1 hour)
const citationCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCitations') {
    getCachedOrFetchCitationCount(request.scholarUrl)
      .then(count => sendResponse({ success: true, count }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

async function getCachedOrFetchCitationCount(scholarUrl) {
  // Check cache first
  const cacheKey = scholarUrl;
  const cached = citationCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.count;
  }
  
  // Fetch fresh data
  const count = await fetchCitationCount(scholarUrl);
  
  // Cache the result
  citationCache.set(cacheKey, {
    count: count,
    timestamp: Date.now()
  });
  
  // Clean up expired cache entries periodically
  cleanExpiredCache();
  
  return count;
}

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of citationCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      citationCache.delete(key);
    }
  }
}

async function fetchCitationCount(scholarUrl) {
  try {
    if (!scholarUrl) {
      throw new Error('No Scholar URL provided');
    }

    const response = await fetch(scholarUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Protect against very large HTML responses (ReDoS protection)
    if (html.length > 1000000) { // 1MB limit
      throw new Error('Response too large to process safely');
    }
    
    return parseCitationCount(html);
  } catch (error) {
    // Avoid logging potentially sensitive error information
    throw new Error('Citation fetch failed');
  }
}

function parseCitationCount(html) {
  // Look for links with cites= parameter (most reliable)
  // Extract from href="/scholar?cites=...">text</a> structure
  const citeLinkPattern = /href="[^"]*cites=[^"]*"[^>]*>([^<]*(\d+)[^<]*)<\/a>/g;
  let match;
  while ((match = citeLinkPattern.exec(html)) !== null) {
    const linkText = match[1];
    const numberMatch = linkText.match(/(\d+)/);
    if (numberMatch) {
      return parseInt(numberMatch[1]);
    }
  }

  return 0;
}