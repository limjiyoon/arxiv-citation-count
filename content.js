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

  extractArxivId() {
    const pathMatch = window.location.pathname.match(/\/abs\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  }

  extractPaperTitle() {
    const titleElement = document.querySelector('h1.title');
    if (titleElement) {
      return titleElement.textContent.replace('Title:', '').trim();
    }
    return null;
  }

  extractAuthors() {
    const authorsElement = document.querySelector('.authors');
    if (authorsElement) {
      return authorsElement.textContent.replace('Authors:', '').trim();
    }
    return null;
  }

  async fetchCitationCount(title, authors) {
    try {
      const query = this.buildScholarQuery(title, authors);
      const response = await fetch(`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Google Scholar');
      }
      
      const html = await response.text();
      return this.parseCitationCount(html);
    } catch (error) {
      console.error('Error fetching citation count:', error);
      return null;
    }
  }

  buildScholarQuery(title, authors) {
    let query = `"${title}"`;
    if (authors) {
      const firstAuthor = authors.split(',')[0].trim();
      query += ` author:"${firstAuthor}"`;
    }
    return query;
  }

  parseCitationCount(html) {
    const citedByRegex = /Cited by (\d+)/;
    const match = html.match(citedByRegex);
    return match ? parseInt(match[1]) : 0;
  }

  createCitationElement(count) {
    const citationDiv = document.createElement('div');
    citationDiv.id = 'arxiv-citation-counter';
    citationDiv.className = 'citation-counter';
    
    if (count === null) {
      citationDiv.innerHTML = `
        <div class="citation-info">
          <span class="citation-label">Citations:</span>
          <span class="citation-count error">Unable to fetch</span>
        </div>
      `;
    } else {
      citationDiv.innerHTML = `
        <div class="citation-info">
          <span class="citation-label">Citations:</span>
          <span class="citation-count">${count}</span>
          <span class="citation-source">(Google Scholar)</span>
        </div>
      `;
    }
    
    return citationDiv;
  }

  findCiteAsField() {
    const metaTable = document.querySelector('.metatable');
    if (!metaTable) return null;

    const rows = metaTable.querySelectorAll('tr');
    for (let row of rows) {
      const th = row.querySelector('th');
      if (th && th.textContent.includes('Cite as:')) {
        return row;
      }
    }
    return null;
  }

  async addCitationCounter() {
    const citeAsRow = this.findCiteAsField();
    if (!citeAsRow) {
      console.warn('Could not find cite-as field on arXiv page');
      return;
    }

    const loadingElement = this.createLoadingElement();
    citeAsRow.parentNode.insertBefore(loadingElement, citeAsRow.nextSibling);

    const title = this.extractPaperTitle();
    const authors = this.extractAuthors();
    
    if (!title) {
      loadingElement.remove();
      console.warn('Could not extract paper title');
      return;
    }

    const citationCount = await this.fetchCitationCount(title, authors);
    const citationElement = this.createCitationElement(citationCount);
    
    loadingElement.remove();
    citeAsRow.parentNode.insertBefore(citationElement, citeAsRow.nextSibling);
  }

  createLoadingElement() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'arxiv-citation-loading';
    loadingDiv.className = 'citation-counter loading';
    loadingDiv.innerHTML = `
      <div class="citation-info">
        <span class="citation-label">Citations:</span>
        <span class="citation-count">Loading...</span>
      </div>
    `;
    return loadingDiv;
  }
}

new ArxivCitationCounter();