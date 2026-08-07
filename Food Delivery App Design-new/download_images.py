import re
import urllib.request
import os

with open("src/app/data/catalog.ts", "r") as f:
    catalog = f.read()

urls = list(set(re.findall(r'https://images\.unsplash\.com/[^\s"\'\`]+', catalog)))
print(f"Found {len(urls)} images to download.")

os.makedirs("public/img", exist_ok=True)

for i, url in enumerate(urls):
    filename = f"img_{i}.jpg"
    try:
        urllib.request.urlretrieve(url, f"public/img/{filename}")
        catalog = catalog.replace(url, f"./img/{filename}")
        print(f"Downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

with open("src/app/data/catalog.ts", "w") as f:
    f.write(catalog)

print("Updated catalog.ts")
