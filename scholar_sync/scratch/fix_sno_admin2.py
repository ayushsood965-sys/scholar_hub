filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 8a: Change Requests thead (uses 'Request Type' and different indentation)
idx = content.find('sortedRequests.map')
thead_start = content.rfind('<thead>', 0, idx)
thead_end = content.find('</thead>', thead_start) + len('</thead>')
old_thead = content[thead_start:thead_end]

new_thead = old_thead.replace(
    "<th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>",
    "<th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', width: '40px' }}>S.No.</th>\n                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>",
    1
)
content = content[:thead_start] + new_thead + content[thead_end:]
print("Fix 8a done")

# Fix 9a: Defaulters header - find the paginatedData.map(d => ( and its header
idx = content.find('{paginatedData.map((d, idx) => (')
# Go back to find the file-header div
header_start = content.rfind('<div className="file-header"', 0, idx)
header_end = content.find('</div>', header_start) + len('</div>')
old_header = content[header_start:header_end]

if 'S.No.' not in old_header:
    new_header = old_header.replace(
        '<div style={{ flex: 1.5 }}>Scholar Name</div>',
        '<div style={{ flex: 0.5 }}>S.No.</div>\n                <div style={{ flex: 1.5 }}>Scholar Name</div>',
        1
    )
    content = content[:header_start] + new_header + content[header_end:]
    print("Fix 9a done")
else:
    print("Fix 9a: S.No. already present")

# Fix 10: Theses list table
idx = content.find('filteredTheses.map')
if idx >= 0:
    thead_start = content.rfind('<thead>', 0, idx)
    thead_end = content.find('</thead>', thead_start) + len('</thead>')
    old_thead = content[thead_start:thead_end]
    if 'S.No.' not in old_thead:
        new_thead = old_thead.replace(
            "<th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>",
            "<th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', width: '40px' }}>S.No.</th>\n              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>",
            1
        )
        content = content[:thead_start] + new_thead + content[thead_end:]
        print("Fix 10a done")
    else:
        print("Fix 10a: already done")
    
    # Fix 10b: Theses rows
    old_row = "filteredTheses.map((t, idx) => ("
    if old_row in content:
        print("Fix 10b: map already has idx")
    else:
        # Need to add idx
        old_map = "filteredTheses.map(t => ("
        new_map = "filteredTheses.map((t, idx) => ("
        if old_map in content:
            content = content.replace(old_map, new_map, 1)
            print("Fix 10b map updated")
        else:
            print("Fix 10b: map not found")
else:
    print("Fix 10: filteredTheses.map not found")

# Fix 11b: Meeting card S.No.
# Find the meeting card and add S.No. badge
idx = content.find('{paginatedData.map((meeting, idx) => {')
if idx >= 0:
    # Find the meeting title h4
    title_idx = content.find('{meeting.title}', idx)
    if title_idx >= 0:
        # Find the div before meeting.title
        div_start = content.rfind('<div style={{', idx, title_idx)
        # Insert S.No. badge before the flex div
        badge = """                    <div style={{ position: 'absolute', top: 8, right: 12, background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)' }}>{(currentPage - 1) * pageSize + idx + 1}</div>\n"""
        content = content[:div_start] + badge + content[div_start:]
        print("Fix 11b done")
    else:
        print("Fix 11b: meeting.title not found")
else:
    print("Fix 11b: meeting map not found")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nDone! File size: {len(content)} bytes")
