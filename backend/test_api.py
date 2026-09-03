"""Integration test for all API endpoints across multiple formats."""
import requests
import os

BASE = 'http://localhost:8000/api'

test_files = [
    'test_images/test.jpg',
    'test_images/test.png',
    'test_images/test.webp',
    'test_images/test.bmp',
    'test_images/test.tiff',
    'test_images/test.gif',
]

total = 0
passed = 0
failed = 0

for fpath in test_files:
    fmt = os.path.splitext(fpath)[1].upper().strip('.')
    print(f'\n=== Testing {fmt} ===')
    
    tests = [
        ('Upload', '/image/upload', {}),
        ('Resize', '/image/resize', {'width': '50', 'height': '50'}),
        ('Crop', '/image/crop', {'x': '0', 'y': '0', 'width': '50', 'height': '50'}),
        ('Rotate', '/image/rotate', {'angle': '90'}),
        ('Compress', '/image/compress', {'quality': '70'}),
        ('Adjust', '/image/adjust', {'brightness': '20', 'contrast': '10'}),
        ('Filter', '/image/filter', {'filter_name': 'grayscale'}),
        ('Upscale', '/image/upscale', {'scale': '2', 'method': 'lanczos'}),
        ('Enhance', '/image/enhance', {'strength': '1.0'}),
        ('Watermark', '/image/watermark', {'text': 'TEST', 'opacity': '50'}),
        ('Border', '/image/border', {'top': '10', 'bottom': '10', 'left': '10', 'right': '10'}),
    ]
    
    for name, endpoint, data in tests:
        total += 1
        try:
            with open(fpath, 'rb') as f:
                r = requests.post(BASE + endpoint, files={'file': f}, data=data, timeout=30)
            if r.status_code == 200:
                print(f'  {name}: OK')
                passed += 1
            else:
                detail = r.json().get('detail', {})
                err = detail.get('error', str(r.status_code)) if isinstance(detail, dict) else str(detail)
                print(f'  {name}: FAIL ({err})')
                failed += 1
        except Exception as e:
            print(f'  {name}: ERROR ({e})')
            failed += 1

# Test convert separately (PNG -> JPG)
print('\n=== Testing Convert ===')
conversions = [
    ('test_images/test.png', 'JPEG'),
    ('test_images/test.jpg', 'WEBP'),
    ('test_images/test.webp', 'PNG'),
    ('test_images/test.bmp', 'PNG'),
    ('test_images/test.tiff', 'JPEG'),
]
for src, target in conversions:
    total += 1
    try:
        with open(src, 'rb') as f:
            r = requests.post(BASE + '/image/convert', files={'file': f}, data={'output_format': target}, timeout=30)
        fmt_name = os.path.splitext(src)[1].strip('.').upper()
        if r.status_code == 200:
            print(f'  {fmt_name} -> {target}: OK')
            passed += 1
        else:
            print(f'  {fmt_name} -> {target}: FAIL')
            failed += 1
    except Exception as e:
        print(f'  Convert: ERROR ({e})')
        failed += 1

print(f'\n{"="*40}')
print(f'RESULTS: {passed}/{total} passed, {failed} failed')
print(f'{"="*40}')
