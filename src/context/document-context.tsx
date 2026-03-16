"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { documentService, Document, UploadDocumentData } from "@/services/documentService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { useCompany } from "./company-context";

interface DocumentFilters {
    companyId?: string;
    clientId?: string;
    folder?: string;
}

interface DocumentContextType {
    documents: Document[];
    folders: string[];
    loading: boolean;
    error: string | null;
    fetchDocuments: (force?: boolean, filters?: DocumentFilters) => Promise<void>;
    fetchFolders: (force?: boolean) => Promise<void>;
    uploadDocument: (data: UploadDocumentData) => Promise<boolean>;
    deleteDocument: (id: string) => Promise<void>;
    updateDocument: (id: string, data: any) => Promise<void>;
    pagination: { page: number; limit: number; totalPages: number; totalCount: number };
    setPage: (page: number) => void;
    refreshAll: (force?: boolean) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const CACHE_DURATION = 45000; // 45 seconds

export function DocumentProvider({ children }: { children: React.ReactNode }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const { selectedCompany } = useCompany();
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });

    const setPage = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const lastFetchTime = useRef<{ documents: number; folders: number }>({ documents: 0, folders: 0 });
    const isFetching = useRef<{ documents: boolean; folders: boolean }>({ documents: false, folders: false });

    const fetchDocuments = useCallback(async (force: boolean = false, filters?: DocumentFilters) => {
        const now = Date.now();
        // Caching: Skip if not forced and within cache window, unless filters are provided
        if (!force && !filters && now - lastFetchTime.current.documents < CACHE_DURATION && documents.length > 0) {
            return;
        }

        if (isFetching.current.documents) return;
        isFetching.current.documents = true;

        // Only show global loading on absolute first load
        if (documents.length === 0 && !lastFetchTime.current.documents) {
            setLoading(true);
        }
        setError(null);
        try {
            // Default to selected company if no filters provided and not admin/super-admin
            const defaultFilters = {
                ...(!filters && selectedCompany?._id ? { companyId: selectedCompany._id } : filters),
                page: pagination.page,
                limit: pagination.limit
            };
            const response = await documentService.listDocuments(defaultFilters);
            setDocuments(response.documents);
            setPagination(prev => ({
                ...prev,
                totalPages: response.totalPages || 1,
                totalCount: response.totalDocs || 0
            }));
            lastFetchTime.current.documents = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch documents";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current.documents = false;
        }
    }, [selectedCompany?._id, documents.length]);

    const fetchFolders = useCallback(async (force: boolean = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTime.current.folders < CACHE_DURATION && folders.length > 0) {
            return;
        }

        if (isFetching.current.folders) return;
        isFetching.current.folders = true;

        try {
            const response = await documentService.getFolders();
            setFolders(response.folders);
            lastFetchTime.current.folders = Date.now();
        } catch (err: any) {
            console.error("Failed to fetch folders");
        } finally {
            isFetching.current.folders = false;
        }
    }, [folders.length]);

    const refreshAll = useCallback(async (force: boolean = true) => {
        await Promise.all([
            fetchDocuments(force),
            fetchFolders(force)
        ]);
    }, [fetchDocuments, fetchFolders]);

    const uploadDocument = async (data: UploadDocumentData) => {
        const tempId = `temp-${Date.now()}`;
        const tempDoc: Document = {
            _id: tempId,
            name: data.name || data.file.name,
            url: "",
            publicId: "",
            folder: data.folder || "General",
            fileSize: data.file.size,
            mimeType: data.file.type,
            uploadedBy: user?._id || "",
            createdAt: new Date().toISOString(),
            status: 'uploading'
        };

        setDocuments(prev => [tempDoc, ...prev]);

        try {
            await documentService.uploadDocument(data);
            toast.success("Uploaded");
            window.dispatchEvent(new CustomEvent('app:sync-data'));
            // Refresh to get actual doc with URL and ID
            fetchDocuments(true);
            return true;
        } catch (err: any) {
            setDocuments(prev => prev.filter(d => d._id !== tempId));
            const msg = err.response?.data?.message || "Failed to upload document";
            toast.error(msg);
            return false;
        }
    };

    const deleteDocument = async (id: string) => {
        const previousDocs = [...documents];
        
        // Optimistic delete
        setDocuments(prev => prev.filter(doc => doc._id !== id));

        try {
            await documentService.deleteDocument(id);
            window.dispatchEvent(new CustomEvent('app:sync-data'));
            toast.success("Deleted");
            // Background sync (doesn't trigger global loading if quiet)
            fetchFolders(true);
        } catch (err: any) {
            setDocuments(previousDocs);
            toast.error(err.response?.data?.message || "Failed to delete document");
        }
    };

    const updateDocument = async (id: string, data: any) => {
        const previousDocs = [...documents];
        
        // Optimistic update
        setDocuments(prev => prev.map(doc => doc._id === id ? { ...doc, ...data } : doc));

        try {
            await documentService.updateDocument(id, data);
            window.dispatchEvent(new CustomEvent('app:sync-data'));
            toast.success("Updated");
            // Sync metadata in background
            fetchFolders(true);
        } catch (err: any) {
            setDocuments(previousDocs);
            toast.error(err.response?.data?.message || "Failed to update document");
        }
    };

    // Centralized Effect
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setDocuments([]);
            setFolders([]);
            lastFetchTime.current = { documents: 0, folders: 0 };
            return;
        }

        // Only fetch if authenticated
        refreshAll(false);
    }, [user?._id, isAuthenticated, selectedCompany?._id, refreshAll, pagination.page]);

    // ✅ Listen for sync signals from other modules
    useEffect(() => {
        const handleSync = () => {
            if (!isAuthenticated) return;
            console.log("[Document] 🔄 Syncing data from broadcast...");
            refreshAll(true);
        };
        window.addEventListener('app:sync-data', handleSync);
        return () => window.removeEventListener('app:sync-data', handleSync);
    }, [isAuthenticated, refreshAll]);

    return (
        <DocumentContext.Provider
            value={{
                documents,
                folders,
                loading,
                error,
                fetchDocuments,
                fetchFolders,
                uploadDocument,
                deleteDocument,
                updateDocument,
                refreshAll,
                pagination,
                setPage
            }}
        >
            {children}
        </DocumentContext.Provider>
    );
}

export function useDocument() {
    const context = useContext(DocumentContext);
    if (context === undefined) {
        throw new Error("useDocument must be used within a DocumentProvider");
    }
    return context;
}
