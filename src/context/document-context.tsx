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

        setLoading(true);
        setError(null);
        try {
            // Default to selected company if no filters provided and not admin/super-admin
            const defaultFilters = !filters && selectedCompany?._id ? { companyId: selectedCompany._id } : filters;
            const response = await documentService.listDocuments(defaultFilters);
            setDocuments(response.documents);
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
        setLoading(true);
        try {
            await documentService.uploadDocument(data);
            toast.success("Document uploaded successfully");
            refreshAll(true);
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to upload document";
            toast.error(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            await documentService.deleteDocument(id);
            toast.success("Document deleted");
            setDocuments(prev => prev.filter(doc => doc._id !== id));
        } catch (err: any) {
            toast.error("Failed to delete document");
        }
    };

    const updateDocument = async (id: string, data: any) => {
        try {
            await documentService.updateDocument(id, data);
            toast.success("Document updated");
            refreshAll(true);
        } catch (err: any) {
            toast.error("Failed to update document");
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
    }, [user?._id, isAuthenticated, selectedCompany?._id, refreshAll]);

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
                refreshAll
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
