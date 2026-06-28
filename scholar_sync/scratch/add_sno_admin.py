import re

filepath = r'C:\Codee\scholar_hub\scholar_sync\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original_len = len(content)

# 1. Add currentPage, pageSize to ALL useGridControl destructurings
content = content.replace(
    'const { paginatedData, renderGridControls } = useGridControl(',
    'const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl('
)
print("Step 1 done: Added currentPage, pageSize to useGridControl destructurings")

# 2. ExternalEvaluation Scholar Registrations file-list (line ~1952)
old = '<div className="file-header"><div style={{ flex: 1.5 }}>Scholar</div><div style={{ flex: 1 }}>Dept</div><div style={{ flex: 2 }}>Title</div><div style={{ flex: 1.2 }}>Supervisor</div><div style={{ flex: 1 }}>Status</div><div style={{ flex: 1.4 }}>Action</div></div>'
new = '<div className="file-header"><div style={{ flex: 0.5 }}>S.No.</div><div style={{ flex: 1.5 }}>Scholar</div><div style={{ flex: 1 }}>Dept</div><div style={{ flex: 2 }}>Title</div><div style={{ flex: 1.2 }}>Supervisor</div><div style={{ flex: 1 }}>Status</div><div style={{ flex: 1.4 }}>Action</div></div>'
if old in content:
    content = content.replace(old, new, 1)
    print("Step 2a done: Scholar Registrations header")
else:
    print("Step 2a FAILED: header not found")

old = '{paginatedData.map(t => (\n                  <div key={t._id} className="file-item">\n                    <div style={{ flex: 1.5, display: \'flex\', flexDirection: \'column\', gap: 4 }}>'
new = '{paginatedData.map((t, idx) => (\n                  <div key={t._id} className="file-item">\n                    <div style={{ flex: 0.5, fontWeight: 600, color: \'#6B7280\' }}>{(currentPage - 1) * pageSize + idx + 1}</div>\n                    <div style={{ flex: 1.5, display: \'flex\', flexDirection: \'column\', gap: 4 }}>'
if old in content:
    content = content.replace(old, new, 1)
    print("Step 2b done: Scholar Registrations rows")
else:
    print("Step 2b FAILED: map not found")

# 3. ExternalEvaluation card grid (line ~2028)
old = """paginatedData.map(t => (
          <div key={t._id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.scholarId?.name}</div>"""
new = """paginatedData.map((t, idx) => (
          <div key={t._id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 8, right: 12, background: '#7C3AED', color: 'white', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{(currentPage - 1) * pageSize + idx + 1}</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.scholarId?.name}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 3 done: ExternalEvaluation card grid")
else:
    print("Step 3 FAILED")

# 4. ManageUsers (line ~2260-2270)
old = """<div className="file-header">
                <div style={{ flex: 2 }}>Name</div>
                <div style={{ flex: 1.5 }}>Email Address</div>
                <div style={{ flex: 1 }}>Role</div>
                <div style={{ flex: 1 }}>Profile</div>
                <div style={{ flex: 1 }}>Verification</div>
                <div style={{ flex: 1 }}>Status</div>
                <div style={{ flex: 2.2 }}>Action</div>
              </div>
              {paginatedData.map(u => ("""
new = """<div className="file-header">
                <div style={{ flex: 0.5 }}>S.No.</div>
                <div style={{ flex: 2 }}>Name</div>
                <div style={{ flex: 1.5 }}>Email Address</div>
                <div style={{ flex: 1 }}>Role</div>
                <div style={{ flex: 1 }}>Profile</div>
                <div style={{ flex: 1 }}>Verification</div>
                <div style={{ flex: 1 }}>Status</div>
                <div style={{ flex: 2.2 }}>Action</div>
              </div>
              {paginatedData.map((u, idx) => ("""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 4a done: ManageUsers header+map")
else:
    print("Step 4a FAILED")

old = """<div key={u._id} className="file-item" style={{ opacity: u.isActive ? 1 : 0.65 }}>
                  <div className="file-name" style={{ flex: 2, fontWeight: 600 }}>{u.name}</div>"""
new = """<div key={u._id} className="file-item" style={{ opacity: u.isActive ? 1 : 0.65 }}>
                  <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div className="file-name" style={{ flex: 2, fontWeight: 600 }}>{u.name}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 4b done: ManageUsers row S.No.")
else:
    print("Step 4b FAILED")

# 5. ManageFaculty
old = '<div className="file-header"><div style={{ flex: 2 }}>Name</div><div style={{ flex: 1.5 }}>Department</div><div style={{ flex: 1 }}>Sub-Role</div><div style={{ flex: 1.5 }}>Username</div></div>'
new = '<div className="file-header"><div style={{ flex: 0.5 }}>S.No.</div><div style={{ flex: 2 }}>Name</div><div style={{ flex: 1.5 }}>Department</div><div style={{ flex: 1 }}>Sub-Role</div><div style={{ flex: 1.5 }}>Username</div></div>'
if old in content:
    content = content.replace(old, new, 1)
    print("Step 5a done: ManageFaculty header")
else:
    print("Step 5a FAILED")

old = """{faculty.map(f => (
          <div key={f._id} className="file-item">
            <div className="file-name" style={{ flex: 2 }}>{f.name}</div>"""
new = """{faculty.map((f, idx) => (
          <div key={f._id} className="file-item">
            <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{idx + 1}</div>
            <div className="file-name" style={{ flex: 2 }}>{f.name}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 5b done: ManageFaculty rows")
else:
    print("Step 5b FAILED")

# 6. Research Outputs table
old = """<thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>"""
new = """<thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', width: '40px' }}>S.No.</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 6a done: Research Outputs thead")
else:
    print("Step 6a FAILED")

old = """{researchOutputs.map(r => (
                      <tr key={r._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{r.scholarName}</div>"""
new = """{researchOutputs.map((r, idx) => (
                      <tr key={r._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{r.scholarName}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 6b done: Research Outputs rows")
else:
    print("Step 6b FAILED")

# 7. RAC list (file-list style)
old = """<div style={{ flex: 1.8 }}>Scholar</div>
          <div style={{ flex: 0.8 }}>Session</div>
          <div style={{ flex: 1.2 }}>Date</div>
          <div style={{ flex: 1.5 }}>Report</div>
          <div style={{ flex: 1.2 }}>Status</div>
          <div style={{ flex: 2.2, textAlign: 'center' }}>Grading Actions</div>
        </div>
        {racs.map(r => ("""
new = """<div style={{ flex: 0.5 }}>S.No.</div>
          <div style={{ flex: 1.8 }}>Scholar</div>
          <div style={{ flex: 0.8 }}>Session</div>
          <div style={{ flex: 1.2 }}>Date</div>
          <div style={{ flex: 1.5 }}>Report</div>
          <div style={{ flex: 1.2 }}>Status</div>
          <div style={{ flex: 2.2, textAlign: 'center' }}>Grading Actions</div>
        </div>
        {racs.map((r, idx) => ("""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 7a done: RAC header+map")
else:
    print("Step 7a FAILED")

old = """<div key={r._id} className="file-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1.8 }}>"""
new = """<div key={r._id} className="file-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{idx + 1}</div>
              <div style={{ flex: 1.8 }}>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 7b done: RAC row S.No.")
else:
    print("Step 7b FAILED")

# 8. Change Requests table (sortedRequests)
old = """<thead>
              <tr>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Current Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proposed Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map(r => {"""
new = """<thead>
              <tr>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', width: '40px' }}>S.No.</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Current Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proposed Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map((r, idx) => {"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 8a done: Change Requests thead+map")
else:
    print("Step 8a FAILED")

# For the row, since it uses .map(r => { with a block body, we need to add idx to the first td
old = """<td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ fontWeight: 700 }}>{r.scholarId?.name}</div>"""
new = """<td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ fontWeight: 700 }}>{r.scholarId?.name}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 8b done: Change Requests row S.No.")
else:
    print("Step 8b FAILED")

# 9. Defaulters/Overdue list (paginatedData.map(d => ())
old = """<div style={{ flex: 1.5 }}>Scholar Name</div>
                <div style={{ flex: 1.2 }}>Enrollment</div>
                <div style={{ flex: 1 }}>Department</div>
                <div style={{ flex: 2 }}>Overdue Report</div>
                <div style={{ flex: 1.2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleSort('dueDate')}>
                  Due Date {sortField === 'dueDate' ? (sortAsc ? '▲' : '▼') : ''}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>Status</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map(d => ("""
new = """<div style={{ flex: 0.5 }}>S.No.</div>
                <div style={{ flex: 1.5 }}>Scholar Name</div>
                <div style={{ flex: 1.2 }}>Enrollment</div>
                <div style={{ flex: 1 }}>Department</div>
                <div style={{ flex: 2 }}>Overdue Report</div>
                <div style={{ flex: 1.2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleSort('dueDate')}>
                  Due Date {sortField === 'dueDate' ? (sortAsc ? '▲' : '▼') : ''}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>Status</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map((d, idx) => ("""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 9a done: Defaulters header+map")
else:
    print("Step 9a FAILED")

old = """<div key={d._id} className="file-item" style={{ padding: '14px 8px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                  <div style={{ flex: 1.5, fontWeight: 700, color: '#1E293B' }}>{d.scholarName}</div>"""
new = """<div key={d._id} className="file-item" style={{ padding: '14px 8px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                  <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div style={{ flex: 1.5, fontWeight: 700, color: '#1E293B' }}>{d.scholarName}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 9b done: Defaulters row S.No.")
else:
    print("Step 9b FAILED")

# 10. Theses list table (filteredTheses.map)
old = """<thead>
            <tr>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Department</th>"""
new = """<thead>
            <tr>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', width: '40px' }}>S.No.</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Department</th>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 10a done: Theses thead")
else:
    print("Step 10a FAILED")

old = """filteredTheses.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{t.scholarId?.name || 'N/A'}</div>"""
new = """filteredTheses.map((t, idx) => (
                <tr key={t._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{t.scholarId?.name || 'N/A'}</div>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 10b done: Theses rows")
else:
    print("Step 10b FAILED")

# 11. Meetings list
old = '{paginatedData.map((meeting) => {'
new = '{paginatedData.map((meeting, idx) => {'
if old in content:
    content = content.replace(old, new, 1)
    print("Step 11a done: Meetings map idx")
else:
    print("Step 11a FAILED")

# Add S.No. badge to meeting card - find the title and add badge before it
old = """                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
                          {meeting.title}
                        </h4>"""
new = """                    <div style={{ display: 'absolute', top: 8, right: 12, background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>
                          {meeting.title}
                        </h4>"""
if old in content:
    content = content.replace(old, new, 1)
    print("Step 11b done: Meeting card S.No.")
else:
    print("Step 11b FAILED")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nComplete! Original: {original_len} bytes, New: {len(content)} bytes")
