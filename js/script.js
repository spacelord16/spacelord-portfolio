// Set current year in footer
document.getElementById("y").textContent = new Date().getFullYear();

// Google Scholar Live Citation Updater
class ScholarUpdater {
  constructor() {
    this.scholarId = "keOjVIEAAAAJ";
    this.corsProxy = "https://api.allorigins.win/raw?url=";
    this.fallbackData = {
      totalCitations: 52,
      hIndex: 3,
      i10Index: 1,
      publications: [
        {
          id: "paper1",
          title: "Machine learning for cognitive behavioral analysis",
          citations: 44,
        },
        {
          id: "paper2",
          title: "Multimodal Machine Learning for Deception Detection",
          citations: 4,
        },
        {
          id: "paper3",
          title: "CoviCare: Tracking Covid-19 using PowerBI",
          citations: 3,
        },
      ],
    };
  }

  async fetchScholarData() {
    try {
      // Create a loading indicator
      this.showLoadingState();

      // Attempt to fetch from Google Scholar via CORS proxy
      const scholarUrl = `https://scholar.google.com/citations?user=${this.scholarId}&hl=en&view_op=list_works`;
      const response = await fetch(
        `${this.corsProxy}${encodeURIComponent(scholarUrl)}`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const html = await response.text();
      const data = this.parseScholarHTML(html);

      this.updateUI(data);
      this.hideLoadingState();

      // Cache the data
      localStorage.setItem("scholarData", JSON.stringify(data));
      localStorage.setItem("scholarLastUpdate", Date.now().toString());
    } catch (error) {
      console.warn(
        "Failed to fetch live data, using cached or fallback data:",
        error
      );
      this.handleFallback();
    }
  }

  parseScholarHTML(html) {
    // Create a temporary DOM to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract citations count
    const citationsElement = doc.querySelector(
      "#gsc_rsb_st tbody tr:first-child td:nth-child(2)"
    );
    const totalCitations = citationsElement
      ? parseInt(citationsElement.textContent)
      : this.fallbackData.totalCitations;

    // Extract h-index
    const hIndexElement = doc.querySelector(
      "#gsc_rsb_st tbody tr:nth-child(2) td:nth-child(2)"
    );
    const hIndex = hIndexElement
      ? parseInt(hIndexElement.textContent)
      : this.fallbackData.hIndex;

    // Extract i10-index
    const i10IndexElement = doc.querySelector(
      "#gsc_rsb_st tbody tr:nth-child(3) td:nth-child(2)"
    );
    const i10Index = i10IndexElement
      ? parseInt(i10IndexElement.textContent)
      : this.fallbackData.i10Index;

    // Extract individual paper citations
    const publications = this.extractPublicationCitations(doc);

    return {
      totalCitations,
      hIndex,
      i10Index,
      publications,
      lastUpdated: new Date().toISOString(),
    };
  }

  extractPublicationCitations(doc) {
    const publications = [];

    // Find all publication rows
    const publicationRows = doc.querySelectorAll("#gsc_a_t .gsc_a_tr");

    publicationRows.forEach((row, index) => {
      try {
        const titleElement = row.querySelector(".gsc_a_at");
        const citationElement = row.querySelector(".gsc_a_c");

        if (titleElement && citationElement) {
          const title = titleElement.textContent.trim().toLowerCase();
          const citations = parseInt(citationElement.textContent) || 0;

          // Match with our papers based on title keywords
          let paperId = null;
          if (
            title.includes("cognitive behavioral analysis") ||
            title.includes("machine learning for cognitive")
          ) {
            paperId = "paper1";
          } else if (
            title.includes("multimodal") &&
            title.includes("deception")
          ) {
            paperId = "paper2";
          } else if (title.includes("covicare") || title.includes("covid-19")) {
            paperId = "paper3";
          }

          if (paperId) {
            publications.push({
              id: paperId,
              title: titleElement.textContent.trim(),
              citations: citations,
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing publication row:", error);
      }
    });

    // If we couldn't extract from HTML, use fallback data
    return publications.length > 0
      ? publications
      : this.fallbackData.publications;
  }

  handleFallback() {
    // Try to use cached data first
    const cachedData = localStorage.getItem("scholarData");
    const lastUpdate = localStorage.getItem("scholarLastUpdate");

    // Use cached data if it's less than 24 hours old
    if (cachedData && lastUpdate) {
      const hoursSinceUpdate =
        (Date.now() - parseInt(lastUpdate)) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) {
        this.updateUI(JSON.parse(cachedData));
        this.hideLoadingState();
        return;
      }
    }

    // Fallback to manual increment (conservative approach)
    this.updateUI(this.fallbackData);
    this.hideLoadingState();
  }

  updateUI(data) {
    // Update citation count
    const citationElements = document.querySelectorAll(
      '[data-scholar="citations"]'
    );
    citationElements.forEach((el) => {
      el.textContent = data.totalCitations;
      el.classList.add("scholar-updated");
    });

    // Update h-index
    const hIndexElements = document.querySelectorAll(
      '[data-scholar="h-index"]'
    );
    hIndexElements.forEach((el) => {
      el.textContent = data.hIndex;
      el.classList.add("scholar-updated");
    });

    // Update i10-index
    const i10IndexElements = document.querySelectorAll(
      '[data-scholar="i10-index"]'
    );
    i10IndexElements.forEach((el) => {
      el.textContent = data.i10Index;
      el.classList.add("scholar-updated");
    });

    // Update individual paper citations
    if (data.publications && data.publications.length > 0) {
      data.publications.forEach((paper) => {
        const paperElements = document.querySelectorAll(
          `[data-paper-citations="${paper.id}"]`
        );
        paperElements.forEach((el) => {
          if (el.textContent !== paper.citations.toString()) {
            el.textContent = paper.citations;
            el.classList.add("scholar-updated");

            // Add a subtle notification for updated papers
            this.showPaperUpdateNotification(paper);
          }
        });
      });
    }

    // Add last updated timestamp
    this.addUpdateTimestamp(data.lastUpdated);
  }

  showPaperUpdateNotification(paper) {
    // Create a temporary notification for paper updates
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px 16px;
      color: var(--fg);
      font-size: 0.9em;
      z-index: 1000;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    notification.textContent = `Updated: ${paper.title.substring(0, 40)}... (${
      paper.citations
    } citations)`;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  addUpdateTimestamp(timestamp) {
    const impactElement = document.querySelector(".scholar-impact");
    if (impactElement && timestamp) {
      const date = new Date(timestamp);
      const timeString = date.toLocaleString();

      let timestampEl = impactElement.querySelector(".last-updated");
      if (!timestampEl) {
        timestampEl = document.createElement("small");
        timestampEl.className = "last-updated";
        timestampEl.style.cssText =
          "display: block; margin-top: 8px; color: var(--muted); font-size: 0.85em;";
        impactElement.appendChild(timestampEl);
      }

      timestampEl.textContent = `Last updated: ${timeString}`;
    }
  }

  showLoadingState() {
    const loadingElements = document.querySelectorAll(
      "[data-scholar], [data-paper-citations]"
    );
    loadingElements.forEach((el) => {
      el.classList.add("scholar-loading");
    });
  }

  hideLoadingState() {
    const loadingElements = document.querySelectorAll(
      "[data-scholar], [data-paper-citations]"
    );
    loadingElements.forEach((el) => {
      el.classList.remove("scholar-loading");
    });
  }

  // Check for updates every hour when page is active
  startAutoUpdate() {
    setInterval(() => {
      if (!document.hidden) {
        this.fetchScholarData();
      }
    }, 3600000); // 1 hour
  }
}

// Initialize Scholar Updater when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const scholarUpdater = new ScholarUpdater();

  // Fetch data immediately
  scholarUpdater.fetchScholarData();

  // Start auto-update
  scholarUpdater.startAutoUpdate();

  // Also update when page becomes visible (user returns to tab)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      scholarUpdater.fetchScholarData();
    }
  });
});

// Add smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});
