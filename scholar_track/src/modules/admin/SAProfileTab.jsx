import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../config";

const SAProfileTab = () => {
  const { user, updateProfile, uploadAvatar, fetchMe } =
    useContext(AuthContext);
  const toast = useToast();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setPhoneNumber(user.profile.phoneNumber || "");
      setEmail(user.profile.email || "");
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    const res = await uploadAvatar(file);
    setAvatarLoading(false);
    if (res.success) {
      toast.success("Profile picture updated!");
    } else {
      toast.error(res.message || "Avatar upload failed");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (phoneNumber) {
      const cleaned = phoneNumber.trim().replace(/[\s\-()]/g, "");
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleaned)) {
        toast.error("Please enter a valid 10-digit Indian phone number.");
        setLoading(false);
        return;
      }
    }

    const res = await updateProfile({ phoneNumber, email });
    setLoading(false);
    if (res.success) {
      toast.success("Profile credentials updated!");
    } else {
      toast.error(res.message || "Failed to update profile");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="welcome-banner mb-lg">
        <div className="welcome-tag">ACCOUNT</div>
        <h2 className="welcome-title">My Credentials</h2>
        <p className="welcome-subtitle">
          Super Admin profile and security configuration.
        </p>
      </div>

      <div className="glass-panel p-xl" style={{ textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          {user?.avatarUrl ? (
            <img
              src={`${API_BASE_URL}${user.avatarUrl}`}
              alt="Avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid var(--color-primary)",
                margin: "0 auto 16px",
                display: "block",
                background: "#1e293b",
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--color-success-light), var(--color-success))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#fff",
                margin: "0 auto 16px",
                border: "3px solid var(--color-primary)",
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
          )}
          <h3
            style={{
              margin: "0 0 4px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Master Credentials
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginBottom: 12,
            }}
          >
            ScholarHub root authority configuration
          </p>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--color-sidebar)",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {avatarLoading ? "Uploading..." : "📷 Change Picture"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              disabled={avatarLoading}
            />
          </label>
        </div>

        <form onSubmit={handleUpdate} style={{ textAlign: "left" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "var(--color-surface-elevated)",
                padding: 14,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Master Username
              </span>
              <strong
                style={{ fontSize: "1rem", color: "var(--text-primary)" }}
              >
                admin
              </strong>
            </div>
            <div
              style={{
                background: "var(--color-surface-elevated)",
                padding: 14,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Master Role
              </span>
              <strong
                style={{ fontSize: "1rem", color: "var(--color-success)" }}
              >
                SUPER_ADMIN (ROOT)
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Phone Number (Indian Format)</label>
              <input
                type="text"
                className="form-input"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Updating..." : "Save Profile Credentials"}
            </button>
          </div>

          <div
            style={{
              background: "#fef2f2",
              padding: 14,
              borderRadius: "var(--radius-sm)",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: "0.82rem",
              marginTop: 16,
              lineHeight: 1.5,
            }}
          >
            <strong>🔒 Security Notice:</strong> Super Admin password is
            auto-seeded to{" "}
            <code
              style={{
                background: "#fee2e2",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              password
            </code>{" "}
            on every server connection bootstrap. You do not need to perform
            manual registration checks for this node.
          </div>
        </form>
      </div>
    </div>
  );
};

export default SAProfileTab;
