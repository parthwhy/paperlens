import urllib.request

urls = {
    "landing_page.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2E3Yjc4YjY5YWI0MTQ2MmFiMTNhMjY2ZDA2YTQ1ZTQxEgsSBxCh1t-N7QMYAZIBIgoKcHJvamVjdF9pZBIUQhI5MDg5MzYxOTE1ODM0NjYzNzM&filename=&opi=89354086",
    
    "workspace.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzk1MTMxNjlkYWQwNjQ1MDJhYmI3Zjg3NjRjMWNhMWYwEgsSBxCh1t-N7QMYAZIBIgoKcHJvamVjdF9pZBIUQhI5MDg5MzYxOTE1ODM0NjYzNzM&filename=&opi=89354086",
    
    "concept_map.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2FhY2I4MDVhYjIyZDRkNTBhYTZlZjE2N2QwM2IzMTNlEgsSBxCh1t-N7QMYAZIBIgoKcHJvamVjdF9pZBIUQhI5MDg5MzYxOTE1ODM0NjYzNzM&filename=&opi=89354086",
    
    "animation_studio.html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzY3MWQ1YWNkZjRjNTQ3YTBiMjViMjI5ZmI4N2FiMzc1EgsSBxCh1t-N7QMYAZIBIgoKcHJvamVjdF9pZBIUQhI5MDg5MzYxOTE1ODM0NjYzNzM&filename=&opi=89354086"
}

import os
os.makedirs("stitch_raw_html", exist_ok=True)

for filename, url in urls.items():
    print(f"Downloading {filename}...")
    try:
        urllib.request.urlretrieve(url, os.path.join("stitch_raw_html", filename))
        print(f"Saved to stitch_raw_html/{filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
