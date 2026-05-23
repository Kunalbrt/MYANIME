#!/usr/bin/env python3
"""
fix.py - Fixes mojibake (corrupted UTF-8 icons/emojis) in JS and HTML files.
Place this file in your project folder and run: python fix.py
"""

import re
import os
import shutil
from datetime import datetime

def fix_mojibake(s):
    """Re-encode latin-1 misread bytes back to proper UTF-8."""
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        return s  # already valid, leave untouched

def fix_file(fname):
    if not os.path.exists(fname):
        print(f'  SKIP    {fname} (not found)')
        return

    with open(fname, 'r', encoding='utf-8', errors='replace') as f:
        original = f.read()

    # Fix every run of non-ASCII characters
    fixed = re.sub(r'[^\x00-\x7F]+', lambda m: fix_mojibake(m.group(0)), original)

    if fixed == original:
        print(f'  OK      {fname} — nothing to fix ✓')
    else:
        # Make a backup before overwriting
        backup = f'{fname}.bak_{datetime.now().strftime("%H%M%S")}'
        shutil.copy2(fname, backup)

        with open(fname, 'w', encoding='utf-8') as f:
            f.write(fixed)

        # Count changed chars for report
        changed = sum(1 for a, b in zip(original, fixed) if a != b)
        print(f'  FIXED   {fname} — ~{changed} characters corrected ✓  (backup: {backup})')

# ── Files to process ──────────────────────────────────────────────────────────
FILES = ['app.js', 'mobile.js', 'back.js', 'index.html']

print()
print('═' * 52)
print('  fix.py — Unicode / Emoji Corruption Fixer')
print('═' * 52)
for fname in FILES:
    fix_file(fname)
print('─' * 52)
print('  All done.')
print('═' * 52)
print()