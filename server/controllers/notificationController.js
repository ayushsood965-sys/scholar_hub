const Notification = require('../models/Notification');

const getWelcomeNotificationData = (user) => {
  let title = '🎉 Welcome to ScholarSync!';
  let message = `Welcome, ${user.name}! We are excited to have you on board. Please start by completing your doctoral profile details and thesis registration.`;
  let link = 'profile';

  if (user.role === 'FACULTY') {
    title = '🎉 Welcome to ScholarSync Guide Portal!';
    message = `Welcome, Prof. ${user.name}! We are excited to have you on board. Please start by completing your supervisor profile, including specialization area and office room details.`;
  } else if (user.role === 'HOD') {
    title = '🎉 Welcome to ScholarSync HOD Portal!';
    message = `Welcome, Dr. ${user.name}! As the Head of Department, please start by completing your profile details to verify your account and begin reviewing departmental registration requests.`;
  } else if (user.role === 'ADMIN') {
    title = '🎉 Welcome to ScholarSync Admin Console!';
    message = `Welcome, ${user.name}! We are excited to have you on board. Please start by completing your administrator profile details.`;
  } else if (user.role === 'SUPER_ADMIN') {
    title = '🎉 Welcome to ScholarSync Super Admin Panel!';
    message = `Welcome, ${user.name}! We are excited to have you on board. Please start by completing your super administrator profile details.`;
  }

  return { title, message, link };
};

exports.getWelcomeNotificationData = getWelcomeNotificationData;

// @desc    Get all notifications for logged-in user (personal + role scope)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    // Ensure the welcome notification exists and is role-appropriate
    const welcomeNotif = await Notification.findOne({ recipient: userId, type: 'WELCOME' });
    const expected = getWelcomeNotificationData(req.user);
    if (welcomeNotif) {
      if (welcomeNotif.title !== expected.title || welcomeNotif.message !== expected.message || welcomeNotif.link !== expected.link) {
        welcomeNotif.title = expected.title;
        welcomeNotif.message = expected.message;
        welcomeNotif.link = expected.link;
        await welcomeNotif.save();
      }
    } else {
      await Notification.create({
        recipient: userId,
        title: expected.title,
        message: expected.message,
        type: 'WELCOME',
        link: expected.link
      });
    }

    // Fetch personal notifications OR role-scoped notifications (optional dept-specific)
    const baseFilter = {
      $or: [
        { recipient: userId },
        {
          roleScope: userRole,
          $or: [{ department: null }, { department: userDept }]
        }
      ]
    };

    // Filter by source if provided (e.g., SCHOLAR_TRACK portals only show their own notifications)
    // Source filter applies to ALL notifications — both personal and role-scoped
    let filter;
    if (req.query.source) {
      filter = {
        $or: [
          { recipient: userId, source: req.query.source },
          {
            roleScope: userRole,
            $or: [{ department: null }, { department: userDept }],
            source: req.query.source
          }
        ]
      };
    } else {
      filter = baseFilter;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 });

    // Format output: add 'read' virtual boolean for client convenience
    const formatted = notifications.map(n => {
      let read = false;
      if (n.recipient) {
        read = n.isRead;
      } else {
        read = n.isReadBy.includes(userId);
      }
      return {
        _id: n._id,
        recipient: n.recipient,
        roleScope: n.roleScope,
        department: n.department,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        createdAt: n.createdAt,
        read
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving notifications', error: error.message });
  }
};

// @desc    Mark specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notif = await Notification.findById(notificationId);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notif.recipient) {
      // Personal notification
      if (notif.recipient.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Unauthorized action' });
      }
      notif.isRead = true;
    } else {
      // Group/role-scoped notification
      if (!notif.isReadBy.includes(userId)) {
        notif.isReadBy.push(userId);
      }
    }

    await notif.save();
    res.json({ message: 'Notification marked as read', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
};

// @desc    Mark all notifications as read for the user
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userDept = req.user.department;

    // 1. Update all personal notifications to isRead = true
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // 2. For group/role-scoped notifications, add user to isReadBy array
    const unreadGroupNotifs = await Notification.find({
      recipient: null,
      roleScope: userRole,
      $or: [{ department: null }, { department: userDept }],
      isReadBy: { $ne: userId }
    });

    for (const notif of unreadGroupNotifs) {
      notif.isReadBy.push(userId);
      await notif.save();
    }

    res.json({ message: 'All notifications marked as read', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
};

// @desc    Internal helper to create notifications on system actions
exports.createNotification = async ({ recipient, roleScope, department, title, message, type, link, source }) => {
  try {
    // Avoid duplicate welcome notifications for the same recipient
    if (type === 'WELCOME' && recipient) {
      const exists = await Notification.findOne({ recipient, type: 'WELCOME' });
      if (exists) {
        if (exists.message !== message || exists.link !== link || exists.title !== title) {
          exists.title = title;
          exists.message = message;
          exists.link = link;
          await exists.save();
        }
        return exists;
      }
    }

    const newNotification = await Notification.create({
      recipient: recipient || null,
      roleScope: roleScope || null,
      department: department || null,
      title,
      message,
      type: type || 'INFO',
      link: link || '',
      source: source || 'SCHOLAR_SYNC'
    });

    return newNotification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};
