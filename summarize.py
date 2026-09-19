import json
from pathlib import Path
data = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
print(f'total_files: {data["total_files"]}')
print(f'total_words: {data["total_words"]}')
for cat, files in data['files'].items():
    print(f'  {cat}: {len(files)} files')
if data.get('skipped_sensitive'):
    print(f'skipped_sensitive: {len(data["skipped_sensitive"])} files')
    for f in data['skipped_sensitive']:
        print(f'  - {f}')