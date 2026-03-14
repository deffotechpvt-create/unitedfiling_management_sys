const Document = require('../models/Document');
const Company = require('../models/Company');
const Client = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const constants = require('../config/constants');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE HELPERS — shared scope resolution for consistent RBAC across functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns an array of client IDs that the ADMIN is authorized to access.
 * Uses direct DB query — never relies on denormalized fields.
 */
async function getAdminClientIds(adminId) {
    const clients = await Client.find({ assignedAdmin: adminId }).select('_id');
    return clients.map(c => c._id);
}

/**
 * Returns the single client ID associated with a USER.
 * Returns null if no client record found.
 */
async function getUserClientId(userId) {
    const client = await Client.findOne({ userId }).select('_id');
    return client ? client._id : null;
}

/**
 * Verifies that a document is accessible by the requesting user.
 * Throws ApiError(403) if access is denied.
 */
async function assertDocumentAccess(document, user) {
    const { role, _id: userId } = user;

    if (role === constants.ROLES.SUPER_ADMIN) {
        return; // SUPER_ADMIN has unrestricted access
    }

    if (role === constants.ROLES.ADMIN) {
        // ADMIN can access documents belonging to their assigned clients
        const adminClientIds = await getAdminClientIds(userId);
        const adminClientStrings = adminClientIds.map(id => id.toString());

        if (!document.client || !adminClientStrings.includes(document.client.toString())) {
            throw new ApiError(403, 'You do not have access to this document');
        }
        return;
    }

    if (role === constants.ROLES.USER) {
        // USER can only access documents linked to their own client record
        const clientId = await getUserClientId(userId);
        if (!clientId || !document.client || document.client.toString() !== clientId.toString()) {
            throw new ApiError(403, 'You do not have access to this document');
        }
        return;
    }

    throw new ApiError(403, 'Access denied');
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Upload a new document
 * @route   POST /api/documents/upload
 * @access  Private (All authenticated roles — scoped by role in controller)
 *
 * SUPER_ADMIN: can upload to any company/client
 * ADMIN: can upload to companies belonging to their assigned clients
 * USER: can upload to their own companies (where they are a member)
 */
exports.uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'Please upload a file');
    }

    const { name, companyId, clientId, relatedComplianceId, folder, description } = req.body;
    const { role, _id: userId } = req.user;

    let finalCompany = null;
    let finalClient = null;

    // ── RESOLVE COMPANY / CLIENT CONTEXT ─────────────────────────────────────
    if (companyId) {
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            throw new ApiError(400, 'Invalid company ID');
        }
        finalCompany = await Company.findById(companyId);
        if (!finalCompany) throw new ApiError(404, 'Company not found');
        finalClient = finalCompany.client;
    } else if (clientId) {
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
            throw new ApiError(400, 'Invalid client ID');
        }
        finalClient = clientId;
    }

    // ── ROLE-BASED UPLOAD AUTHORIZATION ──────────────────────────────────────
    if (role === constants.ROLES.USER) {
        // USER must be a member of the target company
        if (finalCompany) {
            const isMember = finalCompany.isMember ? finalCompany.isMember(userId) :
                finalCompany.members?.some(m => m.user.toString() === userId.toString());

            if (!isMember) {
                throw new ApiError(403, 'You are not a member of this company and cannot upload documents to it');
            }
        } else {
            // If no company provided, resolve the user's linked client
            const userClientId = await getUserClientId(userId);
            if (!userClientId) {
                throw new ApiError(403, 'No client record found for your account');
            }
            // Ensure provided clientId matches the user's own client
            if (finalClient && finalClient.toString() !== userClientId.toString()) {
                throw new ApiError(403, 'You can only upload documents to your own client record');
            }
            finalClient = userClientId;
        }
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN can only upload to companies belonging to their assigned clients
        if (finalCompany) {
            const adminClientIds = await getAdminClientIds(userId);
            const adminClientStrings = adminClientIds.map(id => id.toString());
            if (!finalCompany.client || !adminClientStrings.includes(finalCompany.client.toString())) {
                throw new ApiError(403, 'You can only upload documents for companies belonging to your assigned clients');
            }
        } else if (finalClient) {
            const adminClientIds = await getAdminClientIds(userId);
            const adminClientStrings = adminClientIds.map(id => id.toString());
            if (!adminClientStrings.includes(finalClient.toString())) {
                throw new ApiError(403, 'You can only upload documents to your assigned clients');
            }
        }
    }
    // SUPER_ADMIN — no additional checks

    // ── FILE UPLOAD ───────────────────────────────────────────────────────────
    const originalExt = req.file.originalname.includes('.')
        ? req.file.originalname.slice(req.file.originalname.lastIndexOf('.'))
        : '';

    let finalName = name || req.file.originalname;
    if (finalName && originalExt && !finalName.toLowerCase().endsWith(originalExt.toLowerCase())) {
        finalName += originalExt;
    }

    const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        finalName,
        req.file.mimetype,
        folder || 'general'
    );

    // ── PERSIST DOCUMENT RECORD ───────────────────────────────────────────────
    const document = await Document.create({
        name: finalName,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        folder: folder || 'General',
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
        company: finalCompany ? finalCompany._id : undefined,
        client: finalClient,
        relatedCompliance: relatedComplianceId || undefined,
        description: description || undefined,
    });

    if (relatedComplianceId) {
        await document.linkToCompliance(relatedComplianceId);
    }

    res.status(201).json(new ApiResponse(201, {
        document,
        message: 'Document uploaded successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    List all documents for current user/client/manager
 * @route   GET /api/documents
 * @access  Private (All roles — scoped by role)
 *
 * SECURITY: ?companyId and ?clientId query params are validated against
 * the user's scope and CANNOT override RBAC restrictions.
 */
exports.listDocuments = asyncHandler(async (req, res) => {
    const { companyId, clientId, folder } = req.query;
    const { role, _id: userId } = req.user;
    let query = {};

    // ── ROLE-BASED SCOPE (immutable base — query params cannot override this) ─
    if (role === constants.ROLES.SUPER_ADMIN) {
        // SUPER_ADMIN sees all documents; optional filters
        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
            query.company = companyId;
        } else if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
            query.client = clientId;
        }
    } else if (role === constants.ROLES.ADMIN) {
        const adminClientIds = await getAdminClientIds(userId);
        const adminClientStrings = adminClientIds.map(id => id.toString());

        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
            // Validate the company belongs to one of the admin's assigned clients
            const company = await Company.findById(companyId).select('client');
            if (!company || !company.client || !adminClientStrings.includes(company.client.toString())) {
                // Return empty — don't expose the existence of the company
                return res.status(200).json(new ApiResponse(200, {
                    documents: [], message: 'Documents retrieved successfully'
                }));
            }
            query.company = companyId;
        } else if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
            // Validate the client is among the admin's assigned clients
            if (!adminClientStrings.includes(clientId)) {
                return res.status(200).json(new ApiResponse(200, {
                    documents: [], message: 'Documents retrieved successfully'
                }));
            }
            query.client = clientId;
        } else {
            // No filter provided — return all documents for all assigned clients
            query.client = { $in: adminClientIds };
        }
    } else if (role === constants.ROLES.USER) {
        // USER can only see their own client's documents
        const userClientId = await getUserClientId(userId);
        if (!userClientId) {
            return res.status(200).json(new ApiResponse(200, {
                documents: [], message: 'No client record found'
            }));
        }

        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
            // Ensure the company belongs to the user's client
            const company = await Company.findById(companyId).select('client');
            if (!company || !company.client || company.client.toString() !== userClientId.toString()) {
                throw new ApiError(403, 'You do not have access to this company\'s documents');
            }
            query.company = companyId;
            query.client = userClientId; // Belt-and-suspenders
        } else {
            // No company filter — return all documents for user's client
            query.client = userClientId;
        }
        // USER cannot filter by arbitrary clientId — silently ignore that param
    } else {
        throw new ApiError(403, 'Access denied');
    }

    // ── ADDITIONAL NON-SCOPE FILTERS ──────────────────────────────────────────
    if (folder && typeof folder === 'string') {
        query.folder = folder;
    }

    const documents = await Document.find(query)
        .populate('uploadedBy', 'name email')
        .populate('company', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, {
        documents,
        message: 'Documents retrieved successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get document details by ID
 * @route   GET /api/documents/:id
 * @access  Private (all roles — scoped by assertDocumentAccess)
 */
exports.getDocumentById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ApiError(400, 'Invalid document ID');
    }

    const document = await Document.findById(req.params.id)
        .populate('uploadedBy', 'name email')
        .populate('company', 'name');

    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    // ── SCOPE CHECK — applies to USER and ADMIN (SUPER_ADMIN passes through) ─
    await assertDocumentAccess(document, req.user);

    res.status(200).json(new ApiResponse(200, {
        document,
        message: 'Document details retrieved'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Delete a document
 * @route   DELETE /api/documents/:id
 * @access  Private (SUPER_ADMIN=always, ADMIN=assigned clients only, USER=forbidden)
 *
 * USER is blocked at the route layer by checkRole(SUPER_ADMIN, ADMIN).
 * This controller provides defence-in-depth by explicitly rejecting USER.
 * ADMIN is scoped to documents belonging to their assigned clients.
 */
exports.deleteDocument = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;

    // Defence-in-depth: USER can NEVER delete documents — even if they uploaded them
    if (role === constants.ROLES.USER) {
        throw new ApiError(403, 'Users are not permitted to delete documents. Please contact your admin.');
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ApiError(400, 'Invalid document ID');
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    // ── ADMIN SCOPE CHECK ─────────────────────────────────────────────────────
    if (role === constants.ROLES.ADMIN) {
        const adminClientIds = await getAdminClientIds(userId);
        const adminClientStrings = adminClientIds.map(id => id.toString());

        if (!document.client || !adminClientStrings.includes(document.client.toString())) {
            throw new ApiError(403, 'You can only delete documents belonging to your assigned clients');
        }
    }
    // SUPER_ADMIN — no scope restriction

    // ── DELETE FROM CLOUDINARY + DB ───────────────────────────────────────────
    if (document.publicId) {
        await deleteFromCloudinary(document.publicId);
    }
    await document.deleteOne();

    res.status(200).json(new ApiResponse(200, {
        message: 'Document deleted successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update document metadata
 * @route   PATCH /api/documents/:id
 * @access  Private (SUPER_ADMIN=always, ADMIN=assigned clients only, USER=forbidden)
 *
 * USER is blocked at the route layer. ADMIN is scoped by controller.
 */
exports.updateDocument = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { name, folder, description, relatedComplianceId } = req.body;

    // Defence-in-depth: USER cannot update document metadata
    if (role === constants.ROLES.USER) {
        throw new ApiError(403, 'Users are not permitted to update document metadata');
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ApiError(400, 'Invalid document ID');
    }

    const document = await Document.findById(req.params.id);
    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    // ── ADMIN SCOPE CHECK ─────────────────────────────────────────────────────
    if (role === constants.ROLES.ADMIN) {
        const adminClientIds = await getAdminClientIds(userId);
        const adminClientStrings = adminClientIds.map(id => id.toString());

        if (!document.client || !adminClientStrings.includes(document.client.toString())) {
            throw new ApiError(403, 'You can only update documents belonging to your assigned clients');
        }
    }
    // SUPER_ADMIN — full access

    // ── APPLY UPDATES ─────────────────────────────────────────────────────────
    if (name && name.trim()) document.name = name.trim();
    if (folder && folder.trim()) document.folder = folder.trim();
    if (description !== undefined) document.description = description;
    if (relatedComplianceId && mongoose.Types.ObjectId.isValid(relatedComplianceId)) {
        document.relatedCompliance = relatedComplianceId;
    }

    await document.save();

    res.status(200).json(new ApiResponse(200, {
        document,
        message: 'Document updated successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all unique folders for user/client
 * @route   GET /api/documents/folders
 * @access  Private (all roles — scoped by role)
 */
exports.getFolders = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    let query = {};

    if (role === constants.ROLES.SUPER_ADMIN) {
        // SUPER_ADMIN sees all folders — no filter
    } else if (role === constants.ROLES.ADMIN) {
        const adminClientIds = await getAdminClientIds(userId);
        query.client = { $in: adminClientIds };
    } else if (role === constants.ROLES.USER) {
        const userClientId = await getUserClientId(userId);
        if (!userClientId) {
            return res.status(200).json(new ApiResponse(200, {
                folders: [], message: 'Folders retrieved successfully'
            }));
        }
        query.client = userClientId;
    } else {
        throw new ApiError(403, 'Access denied');
    }

    const folders = await Document.distinct('folder', query);

    res.status(200).json(new ApiResponse(200, {
        folders,
        message: 'Folders retrieved successfully'
    }));
});
