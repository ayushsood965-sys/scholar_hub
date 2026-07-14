import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  ShieldAlert,
} from "lucide-react";
import useApi from "../../hooks/useApi";
import { useToast } from "../../context/ToastContext";
import DataTable from "../../components/ui/DataTable";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const FacultyMasterTab = () => {
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    department: "",
    subRole: "SUPERVISOR",
  });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, dRes] = await Promise.all([
        api.get("/auth/all-users"),
        api.get("/departments"),
      ]);
      const allUsers = Array.isArray(uRes.data) ? uRes.data : [];
      const allDepts = Array.isArray(dRes.data) ? dRes.data : [];
      setUsers(
        allUsers.filter((u) => u.role === "FACULTY" && u.subRole !== "HOD"),
      );
      setDepts(allDepts);
    } catch (err) {
      toast.error("Failed to load faculty directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department &&
        u.department.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleToggleActive = async (id) => {
    try {
      await api.put(`/auth/users/${id}/active`);
      toast.success("Account status updated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error toggling status");
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/auth/users/${id}/verify`);
      toast.success("Faculty account verified");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error verifying account");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this faculty account?")) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success("Faculty account deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting account");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/create-user", {
        ...form,
        role: "FACULTY",
        subRole: "SUPERVISOR",
      });
      toast.success("Faculty supervisor created");
      setShowCreateModal(false);
      setForm({
        name: "",
        username: "",
        password: "",
        department: "",
        subRole: "SUPERVISOR",
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating faculty");
    }
  };

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div>
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">FACULTY MASTER</div>
        <h2 className="welcome-title">Faculty Supervisor Management</h2>
        <p className="welcome-subtitle">
          Create, verify, and manage faculty supervisor accounts across all
          departments.
        </p>
      </div>

      <div className="glass-panel p-xl">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              background: "var(--color-surface-elevated)",
              padding: "8px 16px",
              borderRadius: "var(--radius)",
              flex: 1,
              maxWidth: 360,
            }}
          >
            <Search size={16} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                background: "none",
                outline: "none",
                width: "100%",
                fontSize: "0.85rem",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> Add Supervisor
          </button>
        </div>

        <DataTable
          columns={[
            {
              header: "Name / Email",
              accessor: (row) => (
                <div>
                  <div
                    style={{ fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    {row.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      alignItems: "flex-start",
                      marginTop: "2px"
                    }}
                  >
                    <span>{row.username}</span>
                    <span style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "1px 5px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      background: row.isEmailVerified ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: row.isEmailVerified ? "#10B981" : "#EF4444",
                      border: `1px solid ${row.isEmailVerified ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                    }}>
                      {row.isEmailVerified ? "Email Verified" : "Email Unverified"}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              header: "Department",
              accessor: (row) => (
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {row.department || "—"}
                </span>
              ),
            },
            {
              header: "Sub-Role",
              accessor: (row) => (
                <span className="badge badge-secondary">
                  {row.subRole || "SUPERVISOR"}
                </span>
              ),
            },
            {
              header: "Verification",
              accessor: (row) => (
                <span
                  className={`badge ${row.isVerified ? "badge-success" : "badge-warning"}`}
                >
                  {row.isVerified ? "Verified" : "Unverified"}
                </span>
              ),
            },
            {
              header: "Status",
              accessor: (row) => (
                <span
                  className={`badge ${row.isActive ? "badge-success" : "badge-danger"}`}
                >
                  {row.isActive ? "Active" : "Disabled"}
                </span>
              ),
            },
            {
              header: "Actions",
              accessor: (row) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className={`btn btn-sm ${row.isActive ? "btn-danger" : "btn-success"}`}
                    onClick={() => handleToggleActive(row._id)}
                    title={row.isActive ? "Disable" : "Enable"}
                  >
                    {row.isActive ? (
                      <UserX size={14} />
                    ) : (
                      <UserCheck size={14} />
                    )}
                    {row.isActive ? "Disable" : "Enable"}
                  </button>
                  {!row.isVerified && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        if (row.isEmailVerified === false) return;
                        handleVerify(row._id);
                      }}
                      disabled={row.isEmailVerified === false}
                      title={row.isEmailVerified ? "Verify" : "Email must be verified first"}
                      style={{
                        cursor: row.isEmailVerified ? "pointer" : "not-allowed",
                        opacity: row.isEmailVerified ? 1 : 0.6,
                        background: row.isEmailVerified ? "var(--primary-color)" : "#9CA3AF",
                        borderColor: row.isEmailVerified ? "var(--primary-color)" : "#9CA3AF"
                      }}
                    >
                      <ShieldAlert size={14} /> Verify
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(row._id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No faculty supervisor accounts found."
        />
      </div>

      {/* Create Faculty Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-content glass-modal"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 20 }}
            >
              Add Faculty Supervisor
            </h3>
            <form
              onSubmit={handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Dr. Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Email / Username *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g., janesmith@uni.edu"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="form-label">Academic Department *</label>
                <select
                  className="form-input"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  required
                >
                  <option value="">Select...</option>
                  {depts.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyMasterTab;
