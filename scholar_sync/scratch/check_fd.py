filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\FacultyDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Check currentPage, pageSize are already in useGridControl destructuring
# Let me find all useGridControl calls in this file
import re
matches = list(re.finditer(r'const \{ [^}]+ \} = useGridControl\(', content))
for m in matches:
    line = content[:m.start()].count('\n') + 1
    end = content.find(')', m.start())
    print(f"Line {line}: {content[m.start():end+1][:120]}")

# Check if all have currentPage, pageSize
for m in matches:
    end = content.find(')', m.start())
    snippet = content[m.start():end+1]
    if 'currentPage' not in snippet:
        print(f"  MISSING currentPage at line {content[:m.start()].count(chr(10))+1}")
