// src/services/documentService.ts
import api from '@/lib/api';

export interface Document {
    _id: string;
    name: string;
    url: string;
    publicId: string;
    folder: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string | { _id: string; name: string; email: string };
    company?: string | { _id: string; name: string };
    client?: string;
    relatedCompliance?: string;
    description?: string;
    createdAt: string;
    formattedSize?: string;
    fileExtension?: string;
    status?: 'uploading' | 'error' | 'active';
}

export interface UploadDocumentData {
    file: File;
    name?: string;
    companyId?: string;
    clientId?: string;
    relatedComplianceId?: string;
    folder?: string;
    description?: string;
}

export const documentService = {
    // Upload document
    async uploadDocument(data: UploadDocumentData): Promise<{ document: Document; message: string }> {
        const formData = new FormData();
        formData.append('file', data.file);
        if (data.name) formData.append('name', data.name);
        if (data.companyId) formData.append('companyId', data.companyId);
        if (data.clientId) formData.append('clientId', data.clientId);
        if (data.relatedComplianceId) formData.append('relatedComplianceId', data.relatedComplianceId);
        if (data.folder) formData.append('folder', data.folder);
        if (data.description) formData.append('description', data.description);

        const { data: response } = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    },

    // List documents
    async listDocuments(filters?: { companyId?: string; clientId?: string; folder?: string; page?: number; limit?: number }): Promise<{ documents: Document[]; totalPages?: number; currentPage?: number; totalDocs?: number; message: string }> {
        const { data: response } = await api.get('/documents', { params: filters });
        return {
            documents: response.documents,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            totalDocs: response.count,
            message: response.message
        };
    },

    // Get document by ID
    async getDocumentById(id: string): Promise<{ document: Document; message: string }> {
        const { data: response } = await api.get(`/documents/${id}`);
        return response;
    },

    // Update document
    async updateDocument(id: string, updateData: Partial<UploadDocumentData>): Promise<{ document: Document; message: string }> {
        const { data: response } = await api.patch(`/documents/${id}`, updateData);
        return response;
    },

    // Delete document
    async deleteDocument(id: string): Promise<{ message: string }> {
        const { data: response } = await api.delete(`/documents/${id}`);
        return response;
    },

    // Get unique folders
    async getFolders(): Promise<{ folders: string[]; message: string }> {
        const { data: response } = await api.get('/documents/folders');
        return response;
    },
};
