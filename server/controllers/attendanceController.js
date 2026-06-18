const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Attendance Controllers
exports.markAttendance = async (req, res) => {
  try {
    const { date, records, type } = req.body; // records: [{studentId, status}]
    const facultyId = req.user.id;
    const faculty = await User.findById(facultyId);

    const operations = records.map(record => ({
      updateOne: {
        filter: { studentId: record.studentId, date: new Date(date), type: type || 'DAILY' },
        update: {
          $set: {
            studentId: record.studentId,
            department: faculty.department,
            markedById: facultyId,
            date: new Date(date),
            status: record.status,
            type: type || 'DAILY'
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    // Calculate shorts and send notifications
    // Simple mock logic for notification threshold
    for (const record of records) {
      if (record.status === 'ABSENT') {
        const student = await User.findById(record.studentId);
        if (student) {
          // Notify student if absent
          await Notification.create({
            recipient: student._id,
            title: 'Attendance Marked Absent',
            message: `You were marked absent on ${new Date(date).toDateString()}.`,
            type: 'SYSTEM',
            read: false
          });
        }
      }
    }

    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.role === 'STUDENT' ? req.user.id : req.params.studentId;
    
    // Total working days logic: Count distinct dates in the department or across student's logs
    const totalLogs = await Attendance.countDocuments({ studentId });
    const presentLogs = await Attendance.countDocuments({ studentId, status: 'PRESENT' });
    const leaveLogs = await Attendance.countDocuments({ studentId, status: 'LEAVE' });

    // Assuming every log entry is a working day
    const workingDays = totalLogs > 0 ? totalLogs : 1; 
    const effectivePresent = presentLogs + leaveLogs; // Leaves are credited
    const percentage = ((effectivePresent / workingDays) * 100).toFixed(2);

    const logs = await Attendance.find({ studentId }).sort({ date: -1 }).limit(30);

    res.status(200).json({
      percentage,
      totalWorkingDays: totalLogs,
      presentDays: presentLogs,
      leaveDays: leaveLogs,
      absentDays: totalLogs - effectivePresent,
      recentLogs: logs
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDepartmentStats = async (req, res) => {
  try {
    const department = req.user.department;
    
    // Aggregation logic could be complex. For now, fetch all students in dept and calculate
    const students = await User.find({ department, role: 'STUDENT' }).select('name profile');
    
    const stats = await Promise.all(students.map(async (student) => {
      const totalLogs = await Attendance.countDocuments({ studentId: student._id });
      const presentLogs = await Attendance.countDocuments({ studentId: student._id, status: 'PRESENT' });
      const leaveLogs = await Attendance.countDocuments({ studentId: student._id, status: 'LEAVE' });
      
      const workingDays = totalLogs > 0 ? totalLogs : 1; 
      const effectivePresent = presentLogs + leaveLogs;
      const percentage = ((effectivePresent / workingDays) * 100).toFixed(2);

      return {
        id: student._id,
        name: student.name,
        enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
        program: student.profile?.program || 'N/A',
        percentage: parseFloat(percentage),
      };
    }));

    // Identify defaulters
    const defaulters = stats.filter(s => s.percentage < 75 && s.percentage > 0);

    res.status(200).json({
      totalStudents: students.length,
      defaulters,
      stats
    });

  } catch (error) {
    console.error('Error fetching dept stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave Controllers
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, totalDays, reason, documentUrl } = req.body;
    const student = await User.findById(req.user.id);

    let supervisorId = null;
    if (student.profile?.preferredGuideId) {
      supervisorId = student.profile.preferredGuideId;
    } else {
      // Find HOD as fallback
      const hod = await User.findOne({ department: student.department, role: 'HOD' });
      if (hod) supervisorId = hod._id;
    }

    const leave = await LeaveRequest.create({
      studentId: student._id,
      department: student.department,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      reason,
      documentUrl,
      status: supervisorId ? 'PENDING_SUPERVISOR' : 'PENDING_HOD',
      currentAssigneeId: supervisorId,
      auditLog: [{
        action: 'SUBMITTED',
        actorId: student._id,
        actorName: student.name,
        remarks: 'Leave application submitted.'
      }]
    });

    if (supervisorId) {
      await Notification.create({
        recipient: supervisorId,
        title: 'New Leave Request',
        message: `${student.name} has applied for ${totalDays} days of ${leaveType} leave.`,
        type: 'ACTION_REQUIRED',
        read: false
      });
    }

    res.status(201).json(leave);
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ currentAssigneeId: req.user.id }).populate('studentId', 'name profile');
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.actionLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: RECOMMEND, APPROVE, REJECT
    const actor = await User.findById(req.user.id);
    
    const leave = await LeaveRequest.findById(id).populate('studentId');
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    if (action === 'RECOMMEND' && actor.role === 'FACULTY') {
      const hod = await User.findOne({ department: leave.department, role: 'HOD' });
      leave.status = 'PENDING_HOD';
      leave.currentAssigneeId = hod ? hod._id : null;
      leave.auditLog.push({ action: 'RECOMMENDED', actorId: actor._id, actorName: actor.name, remarks });
      
      if (hod) {
        await Notification.create({
          recipient: hod._id,
          title: 'Leave Recommended',
          message: `${actor.name} recommended ${leave.studentId.name}'s leave request.`,
          type: 'ACTION_REQUIRED',
          read: false
        });
      }
    } else if (action === 'APPROVE' && actor.role === 'HOD') {
      leave.status = 'APPROVED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({ action: 'APPROVED', actorId: actor._id, actorName: actor.name, remarks });
      
      await Notification.create({
        recipient: leave.studentId._id,
        title: 'Leave Approved',
        message: `Your ${leave.leaveType} leave request has been approved by HOD.`,
        type: 'SUCCESS',
        read: false
      });

      // Credit attendance records automatically for these dates
      // Simplified: Just insert LEAVE records for the date range
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const operations = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        operations.push({
          updateOne: {
            filter: { studentId: leave.studentId._id, date: new Date(dt), type: 'DAILY' },
            update: {
              $set: {
                studentId: leave.studentId._id,
                department: leave.department,
                markedById: actor._id, // System/HOD
                date: new Date(dt),
                status: 'LEAVE',
                type: 'DAILY',
                remarks: `Auto-credited via approved ${leave.leaveType} leave.`
              }
            },
            upsert: true
          }
        });
      }
      if(operations.length > 0) {
         await Attendance.bulkWrite(operations);
      }

    } else if (action === 'REJECT') {
      leave.status = 'REJECTED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({ action: 'REJECTED', actorId: actor._id, actorName: actor.name, remarks });
      
      await Notification.create({
        recipient: leave.studentId._id,
        title: 'Leave Rejected',
        message: `Your ${leave.leaveType} leave request was rejected.`,
        type: 'ERROR',
        read: false
      });
    }

    await leave.save();
    res.status(200).json(leave);
  } catch (error) {
    console.error('Error actioning leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
