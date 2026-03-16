const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const checkRole = require('../middleware/roleCheckMiddleware');
const constants = require('../config/constants');
const { SUPER_ADMIN, ADMIN } = constants.ROLES;

// Apply protection to all document routes
router.use(protect);

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.listDocuments);
router.get('/folders', documentController.getFolders);
router.get('/:id', documentController.getDocumentById);
router.patch('/:id', checkRole(SUPER_ADMIN, ADMIN), documentController.updateDocument);
router.delete('/:id', checkRole(SUPER_ADMIN), documentController.deleteDocument);

module.exports = router;
