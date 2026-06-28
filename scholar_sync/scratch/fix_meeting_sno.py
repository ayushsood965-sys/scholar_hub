filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 11b: Add position: relative to meeting card and add S.No. badge
old_card = """                  <div
                    key={meeting._id}
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      border: `1px solid var(--color-border, #E2E8F0)`,
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>"""

new_card = """                  <div
                    key={meeting._id}
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      border: `1px solid var(--color-border, #E2E8F0)`,
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 8, right: 12, background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)', zIndex: 1 }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>"""

if old_card in content:
    content = content.replace(old_card, new_card, 1)
    print("Fix 11b done")
else:
    print("Fix 11b FAILED")
    # Try to find what's different
    idx = content.find('key={meeting._id}')
    if idx >= 0:
        print(repr(content[idx:idx+300]))

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Done! File size: {len(content)}")
