const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const constants = require('../config/constants');

const { SUPER_ADMIN, ADMIN } = constants.ROLES;

// All compliance routes require authentication
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// READ ROUTES — All authenticated roles
// Controller enforces per-role data scoping internally
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/compliances
// SUPER_ADMIN=all, ADMIN=assigned-client companies, USER=member companies
router.get('/', complianceController.getAllCompliances);

// GET /api/compliances/stats
// Same scoping as getAllCompliances
router.get('/stats', complianceController.getComplianceStats);

// GET /api/compliances/export
router.get('/export', checkRole(SUPER_ADMIN, ADMIN), complianceController.exportCompliances);

// GET /api/compliances/templates
// ADMIN and SUPER_ADMIN only — USERs have no use for template management
router.get('/templates', checkRole(SUPER_ADMIN, ADMIN), complianceController.getTemplates);

// ─────────────────────────────────────────────────────────────────────────────
// WRITE ROUTES — ADMIN / SUPER_ADMIN only
// USERs cannot create, update status, change stage, or assign compliance
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/compliances
// Assign a compliance task to a company (ADMIN must own the client)
router.post('/', checkRole(SUPER_ADMIN, ADMIN), complianceController.createCompliance);

// POST /api/compliances/templates
// Global template creation — SUPER_ADMIN only
router.post('/templates', checkRole(SUPER_ADMIN), complianceController.createTemplate);

// PUT /api/compliances/templates/:id
// Update template — SUPER_ADMIN only
router.put('/templates/:id', checkRole(SUPER_ADMIN), complianceController.updateTemplate);

// DELETE /api/compliances/templates/:id
// Delete template — SUPER_ADMIN only
router.delete('/templates/:id', checkRole(SUPER_ADMIN), complianceController.deleteTemplate);


// PATCH /api/compliances/:id
// Update status, stage, or expert assignment — ADMIN/SUPER_ADMIN only
// USER cannot reach this route — blocked at route layer
// ADMIN is further scoped by controller (assigned-client companies only)
router.patch('/:id', checkRole(SUPER_ADMIN, ADMIN), complianceController.updateCompliance);


// PATCH /api/compliances/:id/attachments
router.patch('/:id/attachments', complianceController.addAttachment);

// DELETE /api/compliances/bulk
// Bulk delete compliances — SUPER_ADMIN only
router.delete('/bulk', checkRole(SUPER_ADMIN), complianceController.bulkDeleteCompliances);

module.exports = router;
