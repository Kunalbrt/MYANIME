f = open('app.js', 'r', encoding='utf-8')
lines = f.readlines()
f.close()

# Find deleteAnime
print("=== deleteAnime ===")
for i, line in enumerate(lines):
    if 'deleteAnime' in line and 'function' in line:
        for j in range(i, min(len(lines), i+12)):
            print(repr(lines[j]))
        break

# Find fetchAnimeFromBackend
print("\n=== fetchAnimeFromBackend ===")
for i, line in enumerate(lines):
    if 'async function fetchAnimeFromBackend' in line:
        for j in range(i, min(len(lines), i+30)):
            print(str(j+1) + ': ' + lines[j].rstrip())
        break