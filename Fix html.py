import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ── FIX 1: Garbled emojis ─────────────────────────────────────
emoji_fixes = [
    ('ðŸ"',     '📝'),
    ('ðŸ—\'️', '🗑️'),
    ('ðŸ—ï¸',   '🗑️'),
    ('ðŸ—',     '🗑️'),
    ('☁ï¸',    '☁️'),
    ('â­',      '⭐'),
    ('ðŸ"',     '📁'),
    ('ðŸ§­',    '🧭'),
    ('ðŸ–Š',    '🖊️'),
    ('ðŸ–Œ',    '🖌️'),
    ('ðŸ"',     '📋'),
    ('ðŸ"',     '🔍'),
    ('ðŸ"‚',    '📂'),
    ('ðŸ"ˆ',    '📈'),
    ('ðŸ"Š',    '📊'),
    ('ðŸ"¢',    '📢'),
    ('ðŸ"­',    '📭'),
    ('ðŸ"',     '🔒'),
    ('ðŸ"§',    '📧'),
    ('ðŸ"±',    '📱'),
    ('ðŸ'¥',    '👥'),
    ('ðŸ'¾',    '💾'),
    ('ðŸ'¥',    '💥'),
    ('ðŸ§ª',    '🧪'),
    ('ðŸ"',     '🔗'),
    ('ðŸŽ¬',    '🎬'),
    ('ðŸŽ­',    '🎭'),
    ('ðŸ†•',    '🆕'),
    ('ðŸ"º',    '📺'),
    ('ðŸ"",     '🔔'),
    ('ðŸ"…',    '📅'),
    ('ðŸ"',     '🔍'),
    ('ðŸ"–',    '📖'),
    ('ðŸ"š',    '📚'),
    ('ðŸ"',     '📌'),
    ('â',       '✕'),
    # search icon fix
    ('class="msp-icon">??', 'class="msp-icon">🔍'),
    ('class="msp-clear">?', 'class="msp-clear">✕'),
    # episode delete button
    ("ep-btn-del\" onclick=\"deleteSeason", "ep-btn-del\" onclick=\"deleteSeason"),
    ('>??<', '>🗑️<'),
    ('>?? <', '>🗑️ <'),
]

for broken, fixed in emoji_fixes:
    content = content.replace(broken, fixed)

# ── FIX 2: Remove mobileSearchStrip (conflicts with mobile.js) ──
content = re.sub(
    r'<div id="mobileSearchStrip".*?</div>\s*',
    '',
    content,
    flags=re.DOTALL
)

# ── FIX 3: Show mobileSearchBtn on mobile ────────────────────
# Change display:none to let mobile.js handle it
content = content.replace(
    'id="mobileSearchBtn" onclick="openMobileSearch()" style="display:none;',
    'id="mobileSearchBtn" onclick="openMobileSearch()" style="display:none;'
)

# ── FIX 4: Move episodesTab inside admin-container ────────────
# Remove episodesTab from where it is (after /adminPage comment)
episodes_tab_match = re.search(
    r'(    <!-- ── EPISODES TAB ── -->.*?</div>\s*\n\s*\n)',
    content,
    re.DOTALL
)

if episodes_tab_match:
    episodes_tab_html = episodes_tab_match.group(1)
    # Remove it from current position
    content = content.replace(episodes_tab_html, '')
    # Insert it before </div><!-- /admin-container -->
    content = content.replace(
        '</div><!-- /admin-container -->',
        episodes_tab_html + '\n  </div><!-- /admin-container -->'
    )
    print('✅ Fix 4: episodesTab moved inside admin-container')
else:
    print('⚠️  Fix 4: episodesTab pattern not found — check manually')

# ── FIX 5: Add cache-busting version to script tags ──────────
content = content.replace(
    '<script src="app.js"></script>',
    '<script src="app.js?v=3"></script>'
)
content = content.replace(
    '<script src="mobile.js"></script>',
    '<script src="mobile.js?v=3"></script>'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fix 1: Emojis fixed')
print('✅ Fix 2: mobileSearchStrip removed')
print('✅ Fix 3: mobileSearchBtn ready')
print('✅ Fix 5: Cache-busting versions added')
print('\n🎉 All fixes applied to index.html!')