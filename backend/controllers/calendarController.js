// controllers/calendarController.js
const CalendarEvent = require('../models/CalendarEvent');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const constants = require('../config/constants');
const Client = require('../models/Client');
const statusHelper = require('../utils/statusHelper');

// ✅ Normalize DB status → 3 frontend statuses (no UI changes needed)
const normalizeStatusForFrontend = (status) => {
  const STATUS_MAP = {
    'pending': 'pending',
    'overdue': 'overdue',
    'delayed': 'overdue',
    'completed': 'completed',
    'in_progress': 'pending',
    'needs_action': 'pending',
    'waiting_for_client': 'pending',
    'payment_done': 'pending', // Still pending final filing
    'filing_done': 'completed',
  };
  return STATUS_MAP[status] || 'pending';
};

// ✅ Keep original status but add displayStatus for frontend categorization (Tabs)
const normalizeEvents = (events) =>
  events.map(e => {
    const doc = (e.toObject ? e.toObject() : e);
    return {
      ...doc,
      status: doc.status, // Actual granular status
      displayStatus: normalizeStatusForFrontend(doc.status), // Simplified: pending, overdue, completed
    };
  });

/**
 * @desc    Get all calendar events for logged-in client (USER role)
 * @route   GET /api/calendar
 * @access  Private (USER only)
 */
exports.getClientCalendar = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ userId: req.user._id });
  if (!client) {
    throw new ApiError(400, 'Client profile not linked to this account');
  }
  const clientId = client._id;

  const { status, serviceType, year } = req.query;
  const filter = { client: clientId };

  // ✅ If frontend filters by status, reverse-map to DB statuses
  if (status) {
    if (status === 'overdue') {
      filter.status = { $in: ['overdue', 'delayed'] };
    } else if (status === 'pending') {
      filter.status = { $in: ['pending', 'in_progress', 'needs_action', 'waiting_for_client'] };
    } else {
      filter.status = status;
    }
  }

  if (serviceType) filter.serviceType = serviceType;
  if (year) {
    filter.deadlineDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const events = await CalendarEvent.find(filter).select('-__v').sort({ deadlineDate: 1 });

  return res.status(200).json(
    new ApiResponse(200, {
      message: 'Calendar events fetched successfully',
      count: events.length,
      events: normalizeEvents(events), // ✅ normalize before sending
    })
  );
});

/**
 * @desc    Get upcoming compliance deadlines for logged-in client (next 30 days)
 * @route   GET /api/calendar/upcoming
 * @access  Private (USER only)
 */
exports.getUpcomingDeadlines = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ userId: req.user._id });
  if (!client) {
    throw new ApiError(400, 'Client profile not linked to this account');
  }
  const clientId = client._id;

  const days = parseInt(req.query.days) || 30;
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);

  const events = await CalendarEvent.find({
    client: clientId,
    deadlineDate: { $gte: now, $lte: future },
    status: { $in: ['pending', 'in_progress', 'needs_action', 'waiting_for_client'] }, // ✅ all pending-like
  }).select('-__v').sort({ deadlineDate: 1 });

  return res.status(200).json(
    new ApiResponse(200, {
      message: `Upcoming deadlines for next ${days} days fetched successfully`,
      count: events.length,
      events: normalizeEvents(events), // ✅ normalize before sending
    })
  );
});

/**
 * @desc    Update compliance event status
 * @route   PUT /api/calendar/:id/status
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
exports.updateEventStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    'pending',
    'completed',
    'overdue',
    'in_progress',
    'needs_action',
    'waiting_for_client',
    'delayed',
    'payment_done',
    'filing_done',
  ];

  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
  }

  const event = await CalendarEvent.findById(id);
  if (!event) {
    throw new ApiError(404, 'Calendar event not found');
  }

  // ✅ ADMIN Scoping: only expert or creator can update
  if (req.user.role === constants.ROLES.ADMIN) {
    const isAssignee = event.assignedTo?.toString() === req.user._id.toString();
    const isCreator = event.createdBy?.toString() === req.user._id.toString();
    if (!isAssignee && !isCreator) {
      throw new ApiError(403, 'Unauthorized: This calendar event is managed by another admin.');
    }
  }

  // Security: Forward-only logic
  statusHelper.checkTransition(event.status, status, 'status');

  event.status = status;
  if (status === 'completed') {
    event.completedDate = new Date();
  } else {
    event.completedDate = null;
  }

  // ✅ Explicitly set sync flag to false for manual updates
  event._syncedFromCompliance = false;

  await event.save();

  return res.status(200).json(
    new ApiResponse(200, {
      message: 'Event status updated successfully',
      event: {
        ...event.toObject(),
        status: event.status,
        displayStatus: normalizeStatusForFrontend(event.status),
      },
    })
  );
});

/**
 * @desc    Get all calendar events for a specific client (Admin view)
 * @route   GET /api/calendar/client/:clientId
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
exports.getClientCalendarByAdmin = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const { status, serviceType, year } = req.query;

  const filter = { 
    client: clientId,
    // ✅ ADMIN Scoping: only show their own tasks even when viewing specific client
    ...(req.user.role === constants.ROLES.ADMIN ? {
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    } : {})
  };

  if (status) {
    if (status === 'overdue') {
      filter.status = { $in: ['overdue', 'delayed'] };
    } else if (status === 'pending') {
      filter.status = { $in: ['pending', 'in_progress', 'needs_action', 'waiting_for_client'] };
    } else {
      filter.status = status;
    }
  }

  if (serviceType) filter.serviceType = serviceType;
  if (year) {
    filter.deadlineDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const events = await CalendarEvent.find(filter)
    .populate('client', 'name companyName email')
    .populate('company', 'name')
    .select('-__v')
    .sort({ deadlineDate: 1 });

  return res.status(200).json(
    new ApiResponse(200, {
      message: 'Client calendar fetched successfully',
      count: events.length,
      events: normalizeEvents(events), // ✅ normalize before sending
    })
  );
});

/**
 * @desc    Get ALL events for ADMIN/SUPER_ADMIN across all clients
 * @route   GET /api/calendar/admin
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
exports.getAdminCalendar = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;

  let clientIds = [];

  if (role === 'SUPER_ADMIN') {
    const clients = await Client.find({}).select('_id');
    clientIds = clients.map(c => c._id);
  } else if (role === 'ADMIN') {
    const clients = await Client.find({ assignedAdmin: userId }).select('_id');
    clientIds = clients.map(c => c._id);
  } else {
    throw new ApiError(403, 'Not authorized');
  }

  const { status, serviceType, year } = req.query;
  const filter = { 
    client: { $in: clientIds },
    // ✅ ADMIN Scoping: strictly only show their own workload
    ...(role === constants.ROLES.ADMIN ? {
      $or: [
        { assignedTo: userId },
        { createdBy: userId }
      ]
    } : {})
  };

  if (status) {
    if (status === 'overdue') {
      filter.status = { $in: ['overdue', 'delayed'] };
    } else if (status === 'pending') {
      filter.status = { $in: ['pending', 'in_progress', 'needs_action', 'waiting_for_client'] };
    } else {
      filter.status = status;
    }
  }

  if (serviceType) filter.serviceType = serviceType;
  if (year) {
    filter.deadlineDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`),
    };
  }

  const events = await CalendarEvent.find(filter)
    .populate('client', 'name companyName')
    .populate('company', 'name')
    .select('-__v')
    .sort({ deadlineDate: 1 });

  return res.status(200).json(
    new ApiResponse(200, {
      success: true,
      message: 'Admin calendar events fetched successfully',
      count: events.length,
      events: normalizeEvents(events), // ✅ normalize before sending
    })
  );
});
