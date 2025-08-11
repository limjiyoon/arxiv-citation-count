class ArxivCitationCounter {
  constructor() {
    this.init();
  }

  init() {
    if (this.isArxivPage()) {
      this.waitForPageLoad().then(() => {
        this.addCitationCounter();
      });
    }
  }

  isArxivPage() {
    return window.location.hostname === 'arxiv.org' &&
           window.location.pathname.includes('/abs/');
  }

  waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  findGoogleScholarLink() {
    // Look for the Google Scholar link in the References & Citations section
    const scholarLink = document.querySelector('a.cite-google-scholar');
    console.log('Google Scholar link found:', scholarLink);
    console.log('Google Scholar link href:', scholarLink ? scholarLink.href : 'None');
    if (scholarLink && scholarLink.href) {
      return scholarLink.href;
    }
    return null;
  }

  async fetchCitationCount(scholarUrl) {
    try {
      if (!scholarUrl) {
        return null;
      }

      // Use background script to bypass CORS
      const response = await chrome.runtime.sendMessage({
        action: 'fetchCitations',
        scholarUrl: scholarUrl
      });

      if (response.success) {
        return response.count;
      } else {
        console.warn('Background script failed:', response.error);
        return null;
      }
    } catch (error) {
      console.warn('Failed to communicate with background script:', error);
      return null;
    }
  }


  createCitationElement(count) {
    const citationRow = document.createElement('tr');
    citationRow.id = 'arxiv-citation-counter';

    // Create label cell
    const labelCell = document.createElement('td');
    labelCell.className = 'tablecell label';
    labelCell.textContent = 'Citations:';

    // Create content cell
    const contentCell = document.createElement('td');
    contentCell.className = 'tablecell';

    if (count === null) {
      const errorSpan = document.createElement('span');
      errorSpan.className = 'citation-count error';
      errorSpan.textContent = 'Service unavailable';
      contentCell.appendChild(errorSpan);
    } else {
      // Sanitize count to ensure it's a safe integer
      const sanitizedCount = Number.isInteger(count) && count >= 0 ? count : 0;

      const countSpan = document.createElement('span');
      countSpan.className = 'citation-count';
      countSpan.textContent = sanitizedCount.toString();

      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'citation-source';
      sourceSpan.textContent = ' (Google Scholar)';

      contentCell.appendChild(countSpan);
      contentCell.appendChild(sourceSpan);
    }

    citationRow.appendChild(labelCell);
    citationRow.appendChild(contentCell);

    return citationRow;
  }

  findCiteAsField() {
    const metaTable = document.querySelector('.metatable');
    if (!metaTable) return null;

    const rows = metaTable.querySelectorAll('tr');
    for (let row of rows) {
      const labelCell = row.querySelector('td.tablecell.label');
      if (labelCell && labelCell.textContent.includes('Cite as:')) {
        return row;
      }
    }
    return null;
  }

  async addCitationCounter() {
    const metaTable = document.querySelector('.metatable table');
    if (!metaTable) {
      console.warn('Could not find metatable on arXiv page');
      return;
    }

    const loadingElement = this.createLoadingElement();
    metaTable.appendChild(loadingElement);

    const scholarUrl = this.findGoogleScholarLink();

    if (!scholarUrl) {
      loadingElement.remove();
      const errorElement = this.createCitationElement(null);
      metaTable.appendChild(errorElement);
      return;
    }

    const citationCount = await this.fetchCitationCount(scholarUrl);
    const citationElement = this.createCitationElement(citationCount);

    loadingElement.remove();
    metaTable.appendChild(citationElement);
  }

  createLoadingElement() {
    const loadingRow = document.createElement('tr');
    loadingRow.id = 'arxiv-citation-loading';
    loadingRow.className = 'loading';

    // Create label cell
    const labelCell = document.createElement('td');
    labelCell.className = 'tablecell label';
    labelCell.textContent = 'Citations:';

    // Create content cell
    const contentCell = document.createElement('td');
    contentCell.className = 'tablecell';

    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'citation-count loading';
    loadingSpan.textContent = 'Loading...';

    contentCell.appendChild(loadingSpan);
    loadingRow.appendChild(labelCell);
    loadingRow.appendChild(contentCell);

    return loadingRow;
  }
}

new ArxivCitationCounter();
