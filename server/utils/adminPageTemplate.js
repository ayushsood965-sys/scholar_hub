const renderAdminPage = (type, error = '', successData = null) => {
  const isClear = type === 'clear';
  const isSeedUsers = type === 'seed-users';
  const title = isClear ? 'System Clean Portal' : isSeedUsers ? 'User Seeding Portal' : 'System Seeding Portal';
  const primaryColor = isClear ? '#ef4444' : isSeedUsers ? '#3b82f6' : '#10b981';
  const accentGradient = isClear 
    ? 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)' 
    : isSeedUsers
    ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)'
    : 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)';
  const shadowGlow = isClear 
    ? 'rgba(239, 68, 68, 0.25)' 
    : isSeedUsers
    ? 'rgba(59, 130, 246, 0.25)'
    : 'rgba(16, 185, 129, 0.25)';
  const description = isClear
    ? 'Deletes all records from the database and removes all uploaded PDF/DOCX files. This action resets the portal to a fresh state and is irreversible.'
    : isSeedUsers
    ? 'Seeds the database with 10 students, 5 faculties, and 1 HOD in each department (730+ users), complete with full historical milestones, RAC reviews, DRC meetings, and publications using sample.pdf.'
    : 'Seeds the database with the Super Administrator account.';

  let contentHtml = '';

  if (successData) {
    // Show beautiful success page
    contentHtml = `
      <div class="success-icon" style="background: ${primaryColor}20; color: ${primaryColor};">
        ${isClear ? '🧹' : isSeedUsers ? '👥' : '🌱'}
      </div>
      <h2>${isClear ? 'System Reset Complete!' : isSeedUsers ? 'User Seeding Complete!' : 'System Seeded Successfully!'}</h2>
      <p class="desc" style="margin-bottom: 24px;">The request was authorized and completed without errors.</p>
      
      <div class="results-box">
        <h3>Summary of Operations</h3>
        <ul>
          ${successData.records ? successData.records.map(r => `<li><span>${r.name}</span><strong>${r.count ? r.count : 0} ${isClear ? 'deleted' : 'created'}</strong></li>`).join('') : ''}
          ${successData.seeded ? successData.seeded.map(s => `<li><span>${s.name}</span><strong>${s.status}</strong></li>`).join('') : ''}
        </ul>
        
        ${successData.files && successData.files.length > 0 ? `
          <h3 style="margin-top: 20px;">Deleted Document Files (${successData.files.length})</h3>
          <div class="files-scroll">
            ${successData.files.map(f => `<div class="file-tag">📄 ${f}</div>`).join('')}
          </div>
        ` : ''}
      </div>

      <a href="/" class="btn" style="background: ${accentGradient}; text-align: center; text-decoration: none; display: block; margin-top: 24px; box-shadow: 0 4px 14px ${shadowGlow};">
        Return to Portal Home
      </a>
    `;
  } else {
    // Show password prompt form
    contentHtml = `
      <div class="success-icon" style="background: ${primaryColor}20; color: ${primaryColor};">
        ${isClear ? '⚠️' : isSeedUsers ? '🔑' : '⚙️'}
      </div>
      <h2>${title}</h2>
      <p class="desc">${description}</p>

      ${error ? `
        <div class="error-alert">
          <span>❌</span>
          <div style="flex: 1;">${error}</div>
        </div>
      ` : ''}

      <form method="POST" action="/${isClear ? 'clear-all' : isSeedUsers ? 'seed-users' : 'seed'}" id="action-form">
        <div class="input-group">
          <label for="password">Enter Security Password</label>
          <div style="position: relative;">
            <input type="password" name="password" id="password" placeholder="••••••••••••" required autocomplete="off" />
            <button type="button" class="toggle-password" id="toggle-pw-btn" onclick="togglePasswordVisibility()">Show</button>
          </div>
        </div>

        <button type="submit" class="btn" style="background: ${accentGradient}; box-shadow: 0 4px 14px ${shadowGlow};">
          ${isClear ? 'Execute Full Clean' : isSeedUsers ? 'Execute User Seeding' : 'Execute Seeding'}
        </button>
      </form>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} | ScholarSync Hub</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        body {
          background: linear-gradient(135deg, #0b0f19 0%, #161e31 100%);
          color: #f1f5f9;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-x: hidden;
        }

        /* Beautiful glowing orbs */
        .orb {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          z-index: -1;
          opacity: 0.15;
        }
        .orb-1 {
          top: 10%;
          left: 10%;
          background: ${primaryColor};
        }
        .orb-2 {
          bottom: 10%;
          right: 10%;
          background: #3b82f6;
        }

        .card {
          backdrop-filter: blur(16px) saturate(180%);
          background: rgba(30, 41, 59, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          border-radius: 24px;
          width: 100%;
          max-width: 500px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          align-self: flex-start;
          animation: float 3s ease-in-out infinite;
        }

        h2 {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .desc {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 32px;
          font-weight: 500;
        }

        .input-group {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
        }

        input[type="password"], input[type="text"] {
          width: 100%;
          padding: 16px;
          padding-right: 64px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        input[type="password"]:focus, input[type="text"]:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 4px ${primaryColor}15;
          background: rgba(15, 23, 42, 0.8);
        }

        .toggle-password {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.2s;
        }
        .toggle-password:hover {
          color: #ffffff;
        }

        .btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .btn:active {
          transform: translateY(0);
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 24px;
          color: #fca5a5;
          font-size: 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          font-weight: 500;
        }

        .results-box {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 8px;
        }

        .results-box h3 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .results-box ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .results-box li {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          padding-bottom: 6px;
        }

        .results-box li:last-child {
          border: none;
          padding: 0;
        }

        .results-box span {
          color: #cbd5e1;
        }

        .results-box strong {
          color: #ffffff;
          font-weight: 600;
        }

        .files-scroll {
          max-height: 120px;
          overflow-y: auto;
          margin-top: 10px;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .files-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .files-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .file-tag {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 6px 10px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @media (max-width: 480px) {
          .card {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>

      <div class="card">
        ${contentHtml}
      </div>

      <script>
        function togglePasswordVisibility() {
          var input = document.getElementById("password");
          var btn = document.getElementById("toggle-pw-btn");
          if (input.type === "password") {
            input.type = "text";
            btn.textContent = "Hide";
          } else {
            input.type = "password";
            btn.textContent = "Show";
          }
        }
      </script>
    </body>
    </html>
  `;
};

module.exports = { renderAdminPage };
