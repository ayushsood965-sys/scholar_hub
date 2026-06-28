filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix publications thead (line ~2986)
old_pub_thead = """<thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Paper Title</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Journal & Publisher</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>ISSN/DOI</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proofs</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Actio"""

new_pub_thead = """<thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', width: '40px' }}>S.No.</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Paper Title</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Journal & Publisher</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>ISSN/DOI</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proofs</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Actio"""

if old_pub_thead in content:
    content = content.replace(old_pub_thead, new_pub_thead, 1)
    print("Publications thead fixed")
else:
    print("Publications thead NOT FOUND")

# Fix publications map
old_pub_map = '{filteredPublications.map(p => ('
new_pub_map = '{filteredPublications.map((p, idx) => ('
if old_pub_map in content:
    content = content.replace(old_pub_map, new_pub_map, 1)
    print("Publications map fixed")
else:
    print("Publications map NOT FOUND or already fixed")

# Add S.No. td to publications row
old_pub_row = """<tr key={p._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}
                        <td style={{ padding: '14px 16px' }}>"""
new_pub_row = """<tr key={p._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 16px' }}>"""
if old_pub_row in content:
    content = content.replace(old_pub_row, new_pub_row, 1)
    print("Publications row S.No. added")
else:
    print("Publications row NOT FOUND")

# Also check research outputs thead (line ~3074) - it should already have S.No. from first script
# Let me verify
if content.find('researchOutputs.map((r, idx)') >= 0 or content.find('researchOutputs.map((r, idx)') >= 0:
    print("Research outputs map already has idx")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Done! File size: {len(content)}")
