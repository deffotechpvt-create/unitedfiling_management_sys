"use client"

import { useState, useEffect } from "react"
import { Search, FolderClosed, Upload, ChevronRight, Plus, FileText, File, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RecommendationBanner } from "@/components/documents/recommendation-banner"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDocument } from "@/context/document-context"
import { useCompany } from "@/context/company-context"
import { RoleGuard } from "@/components/layout/RoleGuard"
import { ROLES, isUser } from "@/lib/roles"

export default function DocumentsPage() {
    const { user } = useAuth()
    const { selectedCompany } = useCompany()
    const {
        documents,
        folders,
        uploadDocument,
        deleteDocument,
    } = useDocument()
    const { updateOnboardingTask } = useAuth()

    useEffect(() => {
        if (user?.onboardingTasks && !user.onboardingTasks.exploreDocuments) {
            updateOnboardingTask('exploreDocuments');
        }
    }, [updateOnboardingTask, user?.onboardingTasks]);

    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [documentName, setDocumentName] = useState("")
    const [newFolderName, setNewFolderName] = useState("")
    const [folderError, setFolderError] = useState("")
    const [isCreatingNewFolderInUpload, setIsCreatingNewFolderInUpload] = useState(false)
    const [newUploadFolderName, setNewUploadFolderName] = useState("")
    const [searchQuery, setSearchQuery] = useState("")

    const canManageFolders = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role as any || "");

    const handleCreateFolder = () => {
        if (!newFolderName || newFolderName.trim().length < 2) {
            setFolderError("Folder name must be at least 2 characters");
            return;
        }

        if (newFolderName.length > 50) {
            setFolderError("Folder name must not exceed 50 characters");
            return;
        }

        const folderExists = rootFolders.some(f => f.name.toLowerCase() === newFolderName.trim().toLowerCase());
        if (folderExists) {
            setFolderError("A folder with this name already exists");
            return;
        }

        // Folders are dynamic based on document existence.
        // Opening upload dialog with pre-filled folder name.
        setCurrentFolderId(newFolderName.trim());
        setIsFolderDialogOpen(false);
        setIsUploadOpen(true);
        toast.info(`Folder name set to "${newFolderName.trim()}". Upload a document to create it.`);
    }

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url, { mode: "cors" })
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = blobUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(blobUrl)
            toast.success("Download started")
        } catch {
            // Fallback: open in new tab so user can save manually
            window.open(url, "_blank")
            toast.info("Opened in new tab — use browser save if needed")
        }
    }

    const handleUpload = async () => {
        if (!uploadFile) return

        const success = await uploadDocument({
            file: uploadFile,
            name: documentName || uploadFile.name,
            companyId: selectedCompany?._id,
            folder: isCreatingNewFolderInUpload ? newUploadFolderName.trim() : (currentFolderId || "General")
        })

        if (success) {
            setIsUploadOpen(false)
            setUploadFile(null)
            setDocumentName("")
            setIsCreatingNewFolderInUpload(false)
            setNewUploadFolderName("")
        }
    }

    // Map folders from context to rootFolders format
    const rootFolders = [
        { id: "General", name: "General Documents", type: "system" },
        ...folders.filter(f => f !== "General").map(f => ({ id: f, name: f, type: "user" }))
    ]

    const displayFolders = rootFolders.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const currentFolder = rootFolders.find(f => f.id === currentFolderId)

    // Filter documents for current folder and search query
    const folderDocuments = documents.filter(doc => {
        const matchesFolder = doc.folder === currentFolderId
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFolder && matchesSearch
    })

    // Search results for all documents (when searching at root)
    const allMatchingDocuments = searchQuery ? documents.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) : []

    // Header for Breadcrumbs
    const renderHeader = () => {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <span
                    className={cn("cursor-pointer hover:text-slate-900", currentFolderId && "text-slate-500")}
                    onClick={() => setCurrentFolderId(null)}
                >
                    Documents
                </span>
                {currentFolder && (
                    <>
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-medium text-slate-900">{currentFolder.name}</span>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-8 h-full flex flex-col p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
                <div className="flex items-center gap-4">
                    <div className="relative w-[300px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={`Search in '${currentFolder ? currentFolder.name : 'Documents'}'`}
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Recommendations - Only show on root */}
            {!currentFolderId && <RecommendationBanner />}

            {/* Content Tabs / Folder View */}
            <Tabs defaultValue="documents" className="w-full h-full flex flex-col">
                {!currentFolderId && (
                    <div className="flex items-center border-b mb-6 shrink-0">
                        <TabsList className="bg-transparent p-0 h-auto">
                            <TabsTrigger
                                value="documents"
                                className="rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
                            >
                                Documents
                            </TabsTrigger>
                            <TabsTrigger
                                value="generator"
                                className="rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none flex items-center gap-2"
                            >
                                Legal doc generator
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                )}

                <TabsContent value="documents" className="flex-1 space-y-6">
                    {/* Breadcrumbs */}
                    {currentFolderId && renderHeader()}

                    {!currentFolderId ? (
                        // Root View
                        <>
                                <p className="text-slate-500">
                                    Select a folder to view your compliance documents, bills, and related files
                                </p>

                                {canManageFolders && (
                                    <div className="flex justify-end mb-4">
                                        <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                                                    <Plus className="h-4 w-4" /> Create Folder
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Create New Folder</DialogTitle>
                                                    <DialogDescription>
                                                        Enter a name for the new folder. You'll be prompted to upload a document to initialize it.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="folderName">Folder Name</Label>
                                                        <Input
                                                            id="folderName"
                                                            placeholder="e.g. Invoices 2024"
                                                            value={newFolderName}
                                                            onChange={(e) => {
                                                                setNewFolderName(e.target.value);
                                                                setFolderError("");
                                                            }}
                                                            className={cn(folderError && "border-red-500")}
                                                        />
                                                        {folderError && <p className="text-xs text-red-500">{folderError}</p>}
                                                    </div>
                                                </div>
                                                <Button onClick={handleCreateFolder}>Create</Button>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {displayFolders.map((folder) => (
                                        <Card
                                            key={folder.id}
                                            className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-none shadow-sm"
                                            onClick={() => {
                                                setCurrentFolderId(folder.id)
                                                setSearchQuery("") // Clear search when entering folder
                                            }}
                                        >
                                            <div className="p-8 flex flex-col items-center justify-center gap-4 text-center h-[220px]">
                                                <div className="h-20 w-24 bg-slate-900 rounded-lg relative flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                                    <FolderClosed className="h-10 w-10 text-white/90" fill="currentColor" />
                                                </div>
                                                <span className="font-medium text-slate-700 mt-2">
                                                    {folder.name}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {searchQuery && allMatchingDocuments.length > 0 && (
                                    <div className="mt-8 space-y-4">
                                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Matching Files across all folders</h3>
                                        <div className="grid gap-2">
                                            {allMatchingDocuments.map((doc) => (
                                                <div key={doc._id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                In {doc.folder || 'General'} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.url, doc.name)} className="gap-1.5">
                                                            <Download className="h-4 w-4" /> Download
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                        // Folder View
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">{currentFolder?.name}</h3>
                                {user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN ? (
                                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                                                <Upload className="h-4 w-4" /> Upload Document
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Upload Document</DialogTitle>
                                                <DialogDescription>
                                                    Upload a document to the <strong>{currentFolder?.name || currentFolderId || "General"}</strong> folder.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Select 
                                                        value={isCreatingNewFolderInUpload ? "NEW" : (currentFolderId || "General")} 
                                                        onValueChange={(val) => {
                                                            if (val === "NEW") {
                                                                setIsCreatingNewFolderInUpload(true);
                                                            } else {
                                                                setIsCreatingNewFolderInUpload(false);
                                                                setCurrentFolderId(val);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger id="uploadFolder">
                                                            <SelectValue placeholder="Select folder" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {rootFolders.map((f) => (
                                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                            ))}
                                                            <SelectItem value="NEW" className="text-blue-600 font-medium">+ Create New Folder...</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {isCreatingNewFolderInUpload && (
                                                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                                        <Label htmlFor="newUploadFolder">New Folder Name</Label>
                                                        <Input
                                                            id="newUploadFolder"
                                                            placeholder="e.g. Tax Documents"
                                                            value={newUploadFolderName}
                                                            onChange={(e) => setNewUploadFolderName(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                )}
                                                <div className="grid gap-2">
                                                    <Label htmlFor="docName">Document Name (Optional)</Label>
                                                    <Input
                                                        id="docName"
                                                        placeholder="Enter custom name"
                                                        value={documentName}
                                                        onChange={(e) => setDocumentName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="file">File</Label>
                                                    <Input
                                                        id="file"
                                                        type="file"
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setUploadFile(e.target.files[0])
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={handleUpload} disabled={!uploadFile}>Upload</Button>
                                        </DialogContent>
                                    </Dialog>
                                ) : null}
                            </div>

                            {folderDocuments.length > 0 ? (
                                <div className="grid gap-2">
                                    {folderDocuments.map((doc) => (
                                        <div key={doc._id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Uploaded by {typeof doc.uploadedBy === 'object' ? doc.uploadedBy.name : 'User'} on {new Date(doc.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.url, doc.name)} className="gap-1.5">
                                                    <Download className="h-4 w-4" /> Download
                                                </Button>
                                                <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => deleteDocument(doc._id)}>
                                                    Delete
                                                </Button>
                                                </RoleGuard>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4 border-2 border-dashed rounded-lg bg-slate-50">
                                    <p className="text-lg font-medium text-slate-900">No documents yet</p>
                                    <p className="text-slate-500">
                                        {isUser(user?.role) 
                                            ? "Documents uploaded by your compliance expert will appear here." 
                                            : "Upload a document to get started."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                </TabsContent>

                <TabsContent value="generator">
                    <div className="p-12 text-center border-2 border-dashed rounded-lg bg-slate-50">
                        <h3 className="text-lg font-medium text-slate-900">Legal Doc Generator</h3>
                        <p className="text-slate-500">Coming soon...</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
