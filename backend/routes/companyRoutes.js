const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleCheckMiddleware');
const constants = require('../config/constants');

const { SUPER_ADMIN, ADMIN } = constants.ROLES;

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICS  (must be declared before /:id routes to avoid conflict)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/companies/stats/overview
// Access: SUPER_ADMIN (all), ADMIN (their assigned clients only — enforced in controller)
router.get(
    '/stats/overview',
    protect,
    checkRole(SUPER_ADMIN, ADMIN),
    companyController.getCompanyStats
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY CRUD
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/companies  — All roles: controller scopes by role (SUPER_ADMIN=all, ADMIN=assigned clients, USER=member companies)
// POST /api/companies  — All roles: USER→own client auto-assigned; ADMIN→must own client; SUPER_ADMIN→any
router.route('/')
    .get(protect, companyController.getAllCompanies)
    .post(protect, companyController.createCompany);

// GET    /api/companies/:id — All roles: controller enforces member check (USER) and client scope (ADMIN)
// PUT    /api/companies/:id — All roles reach controller: SUPER_ADMIN=any, ADMIN=assigned clients only,
//                            USER=OWNER only. Controller returns 403 if scope violated.
//                            NOTE: checkRole is intentionally absent here so USER OWNERs can update their company.
// DELETE /api/companies/:id — SUPER_ADMIN and ADMIN only (route-level hard block for USER)
//                            Controller further restricts ADMIN to their assigned-client companies.
router.route('/:id')
    .get(protect, companyController.getCompanyById)
    .put(protect, companyController.updateCompany)
    .delete(protect, checkRole(SUPER_ADMIN, ADMIN), companyController.deleteCompany);

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER MANAGEMENT  (SUPER_ADMIN and ADMIN only — USER cannot manage members)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/companies/:id/members/addable-users
router.get(
    '/:id/members/addable-users',
    protect,
    checkRole(SUPER_ADMIN, ADMIN),
    companyController.getAddableUsers
);

// POST /api/companies/:id/members
router.post(
    '/:id/members',
    protect,
    checkRole(SUPER_ADMIN, ADMIN),
    companyController.addMember
);

// DELETE /api/companies/:id/members/:userId
router.delete(
    '/:id/members/:userId',
    protect,
    checkRole(SUPER_ADMIN, ADMIN),
    companyController.removeMember
);

// PATCH /api/companies/:id/members/:userId/role
router.patch(
    '/:id/members/:userId/role',
    protect,
    checkRole(SUPER_ADMIN, ADMIN),
    companyController.updateMemberRole
);

module.exports = router;
