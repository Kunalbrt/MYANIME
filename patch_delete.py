f = open('app.js', 'r', encoding='utf-8')
lines = f.readlines()
f.close()

# Find the function
start = None
for i, line in enumerate(lines):
    if line.strip() == 'function deleteAnime(id) {':
        start = i
        break

if start is None:
    print('ERROR: Could not find deleteAnime function')
    exit(1)

print(f'Found at line {start + 1}')

# The function is exactly 8 lines long
end = start + 8

# Safety check
print('Replacing:')
for i in range(start, end):
    print(' ', repr(lines[i]))

replacement = [
    'async function deleteAnime(id) {\n',
    '  const anime = animeLibrary.find(a => a.id === id);\n',
    '  if (!anime || !confirm(`Delete "${anime.title}"?`)) return;\n',
    '  try {\n',
    '    await fetch(`${API}/admin/anime/${id}`, {\n',
    "      method: 'DELETE',\n",
    '      headers: { Authorization: `Bearer ${getToken()}` }\n',
    '    });\n',
    '  } catch(err) {\n',
    "    console.log('Backend delete failed:', err.message);\n",
    '  }\n',
    '  animeLibrary = animeLibrary.filter(a => a.id !== id);\n',
    '  myList       = myList.filter(m => m.id !== id);\n',
    '  saveToStorage(); renderAll();\n',
    '  showToast(`\U0001f5d1\ufe0f "${anime.title}" deleted.`);\n',
    '}\n',
]

new_lines = lines[:start] + replacement + lines[end:]

f = open('app.js', 'w', encoding='utf-8')
f.writelines(new_lines)
f.close()

print('done!')
