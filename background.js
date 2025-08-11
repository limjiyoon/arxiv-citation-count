// Background script to handle Google Scholar requests (bypasses CORS)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCitations') {
    fetchCitationCount(request.scholarUrl)
      .then(count => sendResponse({ success: true, count }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

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
    return parseCitationCount(html);
  } catch (error) {
    console.warn('Background script citation fetch failed:', error);
    throw error;
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