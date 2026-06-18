const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';

async function logIn(username, password) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { username, password });
    console.log(`[AUTH] Logged in as ${username}. Role: ${res.data.role}, SubRole: ${res.data.subRole || 'N/A'}`);
    return res.data.token;
  } catch (err) {
    console.error(`[AUTH] Failed to log in as ${username}:`, err.response?.data?.message || err.message);
    throw err;
  }
}

async function runVerification() {
  console.log('=== Starting Final Submission & Degree Award Lifecycle Verification ===');

  try {
    // 1. Log in as Student
    const studentToken = await logIn('pawansharma1@gmail.com', 'password');
    
    // Get student thesis and final submission milestone
    const myThesisRes = await axios.get(`${BASE_URL}/thesis/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const { thesis, milestones } = myThesisRes.data;
    console.log(`[STUDENT] Current thesis status: ${thesis.status}`);
    
    const finalMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
    if (!finalMilestone) {
      throw new Error('FINAL_SUBMISSION milestone not found for scholar!');
    }
    console.log(`[STUDENT] Found final submission milestone: ID: ${finalMilestone._id}, Status: ${finalMilestone.status}`);

    // 2. Submit Final Thesis Document
    console.log('[STUDENT] Uploading final bound thesis PDF...');
    const form = new FormData();
    form.append('document', fs.createReadStream('c:/Codee/scholar_sync/sample/sample.pdf'));
    
    const submitRes = await axios.post(`${BASE_URL}/milestones/${finalMilestone._id}/submit`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${studentToken}`
      }
    });
    console.log(`[STUDENT] Submission result status: ${submitRes.data.status}`);

    // Check thesis status
    const postSubmitThesisRes = await axios.get(`${BASE_URL}/thesis/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log(`[STUDENT] Thesis status after upload: ${postSubmitThesisRes.data.thesis.status}`);
    if (postSubmitThesisRes.data.thesis.status !== 'THESIS_SUBMITTED') {
      throw new Error(`Expected thesis status to be THESIS_SUBMITTED but got ${postSubmitThesisRes.data.thesis.status}`);
    }

    // 3. Log in as Supervisor
    const supervisorToken = await logIn('sanjay.sen.fors.faculty2@gmail.com', 'password');
    console.log('[SUPERVISOR] Signing off on the final thesis...');
    
    const supApproveRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/final-approve`, {}, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    console.log(`[SUPERVISOR] Thesis status after supervisor sign-off: ${supApproveRes.data.status}`);
    if (supApproveRes.data.status !== 'PENDING_HOD') {
      throw new Error(`Expected thesis status to be PENDING_HOD but got ${supApproveRes.data.status}`);
    }

    // 4. Verify Student Dashboard is read-only (e.g. upload new report/document should be blocked)
    console.log('[STUDENT] Verifying read-only mode restricts new uploads...');
    const otherMilestone = milestones.find(m => m.type === '6_MONTH_REPORT');
    if (otherMilestone) {
      console.log(`[STUDENT] Attempting to submit report for milestone ${otherMilestone._id} while locked...`);
      const testForm = new FormData();
      testForm.append('document', fs.createReadStream('c:/Codee/scholar_sync/sample/sample.pdf'));
      try {
        await axios.post(`${BASE_URL}/milestones/${otherMilestone._id}/submit`, testForm, {
          headers: {
            ...testForm.getHeaders(),
            Authorization: `Bearer ${studentToken}`
          }
        });
        throw new Error('Expected upload to be blocked during PENDING_HOD status, but it succeeded!');
      } catch (err) {
        console.log(`[STUDENT] Blocked successfully! Status: ${err.response?.status}, Message: ${err.response?.data?.message}`);
        if (err.response?.status !== 403) {
          throw new Error(`Expected status 403 when blocked but got ${err.response?.status}`);
        }
      }
    } else {
      console.log('[STUDENT] No 6_MONTH_REPORT milestone found to test lockout, skipping backend lockout check.');
    }

    // 5. Log in as HOD
    const hodToken = await logIn('mahinderkumar@gmail.com', 'password');
    console.log('[HOD] Giving final HOD sign-off on the thesis...');
    
    const hodApproveRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/final-approve-hod`, {}, {
      headers: { Authorization: `Bearer={}` , Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] Thesis status after HOD sign-off: ${hodApproveRes.data.status}`);
    if (hodApproveRes.data.status !== 'SUBMITTED') {
      throw new Error(`Expected thesis status to be SUBMITTED but got ${hodApproveRes.data.status}`);
    }

    // 6. Log external examiner dispatch details
    console.log('[HOD] Logging dispatch details for external examiners...');
    const dispatchDate = new Date().toISOString().substring(0, 10);
    const dispatchRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/dispatch`, {
      dispatchDate,
      dispatchMethod: 'Speed Post',
      dispatchTrackingNumber: 'HPU-TEST-12345'
    }, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] Dispatch logged. Dispatch Date: ${dispatchRes.data.dispatchDate}`);

    // 7. Log external evaluation outcome
    console.log('[HOD] Logging external evaluation outcome...');
    const evalRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/external-evaluation`, {
      status: 'SUCCESSFUL',
      remarks: 'Positive evaluation reports received from both external examiners.'
    }, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] External evaluation status: ${evalRes.data.externalEvaluationStatus}`);
    if (evalRes.data.externalEvaluationStatus !== 'SUCCESSFUL') {
      throw new Error(`Expected external evaluation status to be SUCCESSFUL but got ${evalRes.data.externalEvaluationStatus}`);
    }

    // 8. Schedule Viva-Voce defense
    console.log('[HOD] Scheduling Viva-Voce oral defense...');
    const vivaDate = new Date(Date.now() + 86400000).toISOString().substring(0, 10); // Tomorrow
    const scheduleVivaRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/schedule-viva`, {
      vivaDate,
      vivaTime: '11:30 AM',
      vivaVenue: 'Department Boardroom',
      vivaPanel: 'Prof. G. C. Sharma (External), Dr. Sanjay Sen (Supervisor)'
    }, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] Viva scheduled. Status: ${scheduleVivaRes.data.vivaStatus}, Date: ${scheduleVivaRes.data.vivaDate}`);
    if (scheduleVivaRes.data.vivaStatus !== 'SCHEDULED') {
      throw new Error(`Expected viva status to be SCHEDULED but got ${scheduleVivaRes.data.vivaStatus}`);
    }

    // 9. Record Viva-Voce outcome
    console.log('[HOD] Recording Viva-Voce defense outcome as SUCCESSFUL...');
    const recordVivaRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/record-viva`, {
      vivaStatus: 'SUCCESSFUL',
      remarks: 'Candidate successfully defended the thesis and answered all questions satisfactorily.'
    }, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] Viva outcome recorded. Status: ${recordVivaRes.data.vivaStatus}`);
    if (recordVivaRes.data.vivaStatus !== 'SUCCESSFUL') {
      throw new Error(`Expected viva status to be SUCCESSFUL but got ${recordVivaRes.data.vivaStatus}`);
    }

    // 10. Audit eligibility checklist
    console.log('[HOD] Fetching degree award eligibility details...');
    const eligibilityRes = await axios.get(`${BASE_URL}/thesis/${thesis._id}/eligibility`, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] Eligibility result: Eligible? ${eligibilityRes.data.eligible}`);
    console.log('[HOD] Checklist details:');
    eligibilityRes.data.checklist.forEach(item => {
      console.log(` - [${item.status ? 'X' : ' '}] ${item.name}: ${item.details}`);
    });

    // 11. Award Ph.D. Degree
    console.log('[HOD] Authorizing final Ph.D. Degree Award...');
    const awardRes = await axios.put(`${BASE_URL}/thesis/${thesis._id}/award`, {
      note: 'Officially awarded Ph.D. degree after successful viva-voce defense. Ref: Notification No. HPU/PhD/2026/102.'
    }, {
      headers: { Authorization: `Bearer ${hodToken}` }
    });
    console.log(`[HOD] Thesis status after awarding degree: ${awardRes.data.status}`);
    if (awardRes.data.status !== 'AWARDED') {
      throw new Error(`Expected thesis status to be AWARDED but got ${awardRes.data.status}`);
    }

    console.log('\n✅ Verification Script Completed successfully! All lifecycle stages are verified and work flawlessly.');
  } catch (err) {
    console.error('\n❌ Verification failed with error:', err.response?.data?.message || err.message);
    process.exit(1);
  }
}

runVerification();
