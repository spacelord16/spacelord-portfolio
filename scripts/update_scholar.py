import json
import os
from scholarly import scholarly, ProxyGenerator

SCHOLAR_ID = "keOjVIEAAAAJ"
OUTPUT_FILE = "data/scholar.json"

def get_scholar_data():
    try:
        # Set up a ProxyGenerator to bypass Google Scholar rate limiting on GitHub Actions IPs
        pg = ProxyGenerator()
        pg.FreeProxies()
        scholarly.use_proxy(pg)
        
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=['indices', 'counts', 'publications'])
        
        # Calculate citations for top 3 key papers
        paper_citations = {
            "paper1": 0, # Machine learning for cognitive behavioral analysis...
            "paper2": 0, # Multimodal Machine Learning for Deception Detection...
            "paper3": 0  # CoviCare: Tracking Covid-19 using PowerBI
        }

        for pub in author.get('publications', []):
            title = pub['bib']['title'].lower()
            citations = pub.get('num_citations', 0)
            
            if "cognitive behavioral analysis" in title:
                paper_citations["paper1"] = citations
            elif "deception detection" in title:
                paper_citations["paper2"] = citations
            elif "covicare" in title:
                paper_citations["paper3"] = citations

        data = {
            "total_citations": author.get('citedby', 0),
            "h_index": author.get('hindex', 0),
            "i10_index": author.get('i10index', 0),
            "papers": paper_citations
        }
        
        return data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    print("Fetching Google Scholar data...")
    new_data = get_scholar_data()
    
    if new_data:
        # Load existing data to check if there are changes (optional but good for tracking)
        try:
            with open(OUTPUT_FILE, 'r') as f:
                old_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            old_data = {}
            
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(new_data, f, indent=2)
            
        print(f"Successfully saved scholar data to {OUTPUT_FILE}")
    else:
        print("Failed to fetch new data.")
        # Exit with error code so GitHub actions knows it failed
        exit(1)
