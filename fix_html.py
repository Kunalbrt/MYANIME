import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('Loaded index.html...')

# ── FIX 1: Remove mobileSearchStrip ──────────────────────────
content = re.sub(
    r'<div id="mobileSearchStrip"[^>]*>.*?</div>',
    '',
    content,
    flags=re.DOTALL
)
print('Fix 1 done: mobileSearchStrip removed')

# ── FIX 2: Move episodesTab inside admin-container ────────────
pattern = r'(\s*<!-- ── EPISODES TAB ── -->.*?</div>\s*\n\s*\n)'
match = re.search(pattern, content, re.DOTALL)
if match:
    tab_html = match.group(1)
    content = content.replace(tab_html, '')
    content = content.replace(
        '</div><!-- /admin-container -->',
        tab_html + '\n  </div><!-- /admin-container -->'
    )
    print('Fix 2 done: episodesTab moved inside admin-container')
else:
    print('Fix 2 skipped: episodesTab pattern not found')

# ── FIX 3: Cache busting ──────────────────────────────────────
content = content.replace(
    '<script src="app.js"></script>',
    '<script src="app.js?v=3"></script>'
)
content = content.replace(
    '<script src="mobile.js"></script>',
    '<script src="mobile.js?v=3"></script>'
)
print('Fix 3 done: cache busting added')

# ── FIX 4: Fix broken emoji using encode/decode trick ─────────
# The garbled chars are UTF-8 bytes misread as Latin-1
# Re-encode each garbled sequence back to correct emoji
broken_to_fixed = {
    b'\xc3\xb0\xc5\xb8\x22\x9c': '\U0001F4E2',  # ðŸ"¢ -> 📢
    b'\xc3\xb0\xc5\xb8\x22\x9d': '\U0001F4E3',  # ðŸ"£
}

# Simpler: just fix the msp icons with regex
content = re.sub(r'class="msp-icon">\?+', 'class="msp-icon">\U0001F50D', content)
content = re.sub(r'class="msp-clear">\?+', 'class="msp-clear">\u2715', content)
content = re.sub(r'>([\?]{2,})<', '>\U0001F5D1\uFE0F<', content)

print('Fix 4 done: msp icons fixed')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('')
print('Done! All fixes applied to index.html')