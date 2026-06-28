filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\FacultyDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add currentPage, pageSize to remaining useGridControl calls
content = content.replace(
    "const { paginatedData, renderGridControls } = useGridControl(\n    items,",
    "const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(\n    items,"
)
content = content.replace(
    "const { paginatedData, renderGridControls } = useGridControl(\n    defaulters,",
    "const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(\n    defaulters,"
)
content = content.replace(
    """const { paginatedData, renderGridControls } = useGridControl(
    meetings,
    ['scholarId.name', 'department', 'reason""",
    """const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(
    meetings,
    ['scholarId.name', 'department', 'reason"""
)

# 2. Pending Reviews Queue (line ~4005) - file-list header
old_header = """<div className="file-header">
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 2 }}>Document Name</div>
                <div style={{ flex: 1 }}>Category</div>
                <div style={{ flex: 1.5 }}>Submitted Date</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map(i => ("""
new_header = """<div className="file-header">
                <div style={{ flex: 0.5 }}>S.No.</div>
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 2 }}>Document Name</div>
                <div style={{ flex: 1 }}>Category</div>
                <div style={{ flex: 1.5 }}>Submitted Date</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map((i, idx) => ("""
content = content.replace(old_header, new_header, 1)

# Add S.No. cell to review row
old_row = """<div key={i._id} className="file-item">
                  <div style={{ flex: 1.5, fontWeight: 700 }}>{i.scholarName}</div>"""
new_row = """<div key={i._id} className="file-item">
                  <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div style={{ flex: 1.5, fontWeight: 700 }}>{i.scholarName}</div>"""
content = content.replace(old_row, new_row, 1)

# 3. Defaulters (line ~4101)
old_def = """<div className="file-header">
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 1.5 }}>Enrollment Number</div>
                <div style={{ flex: 1.5 }}>Milestone</div>
                <div style={{ flex: 1.5 }}>Due Date</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map(d => ("""
new_def = """<div className="file-header">
                <div style={{ flex: 0.5 }}>S.No.</div>
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 1.5 }}>Enrollment Number</div>
                <div style={{ flex: 1.5 }}>Milestone</div>
                <div style={{ flex: 1.5 }}>Due Date</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map((d, idx) => ("""
content = content.replace(old_def, new_def, 1)

# Add S.No. to defaulters row
old_def_row = """<div key={d._id} className="file-item">
                  <div style={{ flex: 1.5, fontWeight: 700 }}>{d.scholarName}</div>"""
new_def_row = """<div key={d._id} className="file-item">
                  <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div style={{ flex: 1.5, fontWeight: 700 }}>{d.scholarName}</div>"""
content = content.replace(old_def_row, new_def_row, 1)

# 4. Meetings (line ~4219) - add idx to map
old_mt = '{paginatedData.map((meeting) => {'
new_mt = '{paginatedData.map((meeting, idx) => {'
content = content.replace(old_mt, new_mt, 1)

# Add position: relative and S.No. badge to meeting card
old_mt_card = """              <div
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
              >"""
new_mt_card = """              <div
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
                <div style={{ position: 'absolute', top: 8, right: 12, background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)', zIndex: 1 }}>{(currentPage - 1) * pageSize + idx + 1}</div>"""
content = content.replace(old_mt_card, new_mt_card, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Done! File size: {len(content)}")
