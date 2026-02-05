const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const  checkRole  = require('../middleware/roleCheckMiddleware');
const constants = require('../config/constants');

const { SUPER_ADMIN, ADMIN, USER } = constants.ROLES;

// Statistics (before :id routes)
router.get(
    '/stats/overview',
    protect,
    checkRole([SUPER_ADMIN, ADMIN]),
    companyController.getCompanyStats
);

// Company CRUD
router.route('/')
    .get(protect, companyController.getAllCompanies) // All roles
    .post(protect, companyController.createCompany); // All roles

router.route('/:id')
    .get(protect, companyController.getCompanyById) // All roles (with access check)
    .put(protect, companyController.updateCompany) // SUPER_ADMIN, ADMIN, OWNER
    .delete(protect, checkRole([SUPER_ADMIN]), companyController.deleteCompany);

// Member Management
router.post(
    '/:id/members',
    protect,
    companyController.addMember
); // SUPER_ADMIN, ADMIN, OWNER

router.delete(
    '/:id/members/:userId',
    protect,
    companyController.removeMember
); // SUPER_ADMIN, ADMIN, OWNER

router.patch(
    '/:id/members/:userId/role',
    protect,
    companyController.updateMemberRole
); // SUPER_ADMIN, ADMIN, OWNER

module.exports = router;
