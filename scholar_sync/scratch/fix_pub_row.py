filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix publications row - the tr is on separate line
old = """filteredPublications.map((p, idx) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{p.scholarName}</div>"""

new = """filteredPublications.map((p, idx) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{p.scholarName}</div>"""

if old in content:
    content = content.replace(old, new, 1)
    print("Publications row S.No. added")
else:
    print("FAILED")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Done! Size: {len(content)}")
