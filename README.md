# arXiv Citation Counter

A Chrome extension that displays Google Scholar citation counts on arXiv paper pages.

## Features

- Automatically detects arXiv paper pages
- Fetches citation counts from Google Scholar
- Displays citation information below the "Cite as" field
- Shows loading states and error handling

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Visit any arXiv paper page (e.g., https://arxiv.org/abs/2301.00001)

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main logic for citation fetching and display
- `styles.css` - Styling for the citation counter display

## How it works

1. Detects when you're on an arXiv paper page
2. Extracts the paper title and authors
3. Queries Google Scholar for citation information
4. Displays the citation count below the "Cite as" field

## Limitations

- Google Scholar may rate-limit requests
- Some papers may not be found on Google Scholar
- Citation counts may not be real-time accurate