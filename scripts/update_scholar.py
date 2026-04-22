import json
import os
from scholarly import scholarly

SCHOLAR_ID = "keOjVIEAAAAJ"
OUTPUT_FILE = "data/scholar.json"

def get_scholar_data():
    try:
        # Avoid proxy providers in CI: recent dependency updates can break proxy wiring.
        # Use direct requests and fail gracefully if Scholar is temporarily unavailable.
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
    existing_data = None
    try:
        with open(OUTPUT_FILE, "r") as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = None

    print("Fetching Google Scholar data...")
    new_data = get_scholar_data()

    if new_data:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(new_data, f, indent=2)

        print(f"Successfully saved scholar data to {OUTPUT_FILE}")
    else:
        if existing_data is not None:
            print("Failed to fetch new data; keeping existing scholar.json.")
            # Keep workflow green when Scholar blocks CI traffic.
            exit(0)

        print("Failed to fetch new data and no existing scholar.json found.")
        exit(1)
