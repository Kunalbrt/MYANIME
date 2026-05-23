#!/usr/bin/env python3
import re
import os
import shutil
from datetime import datetime

def fix_cp1252(s):
    try:
        return s.encode('cp1252').decode('utf-8')
    except Exception:
        return s

def fix_file(fname):
    if not os.path.exists(fname):
        print('  SKIP    ' + fname + ' (not found)')
        return
    with open(fname, 'r', encoding='utf-8', errors='replace') as f:
        original = f.read()
    fixed = re.sub(r'[^\x00-\x7F]+', lambda m: fix_cp1252(m.group(0)), original)
    if fixed == original:
        print('  OK      ' + fname + ' - nothing to fix')
    else:
        backup = fname + '.bak2_' + datetime.now().strftime('%H%M%S')
        shutil.copy2(fname, backup)
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(fixed)
        changed = sum(1 for a, b in zip(original, fixed) if a != b)
        print('  FIXED   ' + fname + ' - ~' + str(changed) + ' chars corrected (backup: ' + backup + ')')

FILES = ['app.js', 'mobile.js', 'back.js', 'index.html']
print('--- fix2.py (cp1252 round) ---')
for fname in FILES:
    fix_file(fname)
print('--- done ---')