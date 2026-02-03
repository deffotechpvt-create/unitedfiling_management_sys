"use client"

import { useState, useEffect } from "react"
import { Search, FolderClosed, Upload, ChevronRight, Plus, FileText, File } from "lucide-react" // Added File
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RecommendationBanner } from "@/components/documents/recommendation-banner"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DocumentsPage() {
    const { user } = useAuth()
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [uploadFile, setUploadFile] = useState<File | null>(null)

    // Simple LocalStorage Persistence for Demo
    const [documents, setDocuments] = useState<{ id: string, name: string, date: string, uploader: string, folder: string }[]>([])

    useEffect(() => {
        const storedDocs = localStorage.getItem("shared_docs")
        if (storedDocs) {
            setDocuments(JSON.parse(storedDocs))
        }
    }, [])

    const handleUpload = () => {
        if (!uploadFile) return

        const newDoc = {
            id: Math.random().toString(36).substr(2, 9),
            name: uploadFile.name,
            date: new Date().toLocaleDateString(),
            uploader: user?.name || "Unknown",
            folder: currentFolderId || "united" // Default to current folder or United
        }

        const updatedDocs = [...documents, newDoc]
        setDocuments(updatedDocs)
        localStorage.setItem("shared_docs", JSON.stringify(updatedDocs))

        toast.success("Document uploaded successfully!")
        setIsUploadOpen(false)
        setUploadFile(null)
    }

    // Mock Root Folders
    const rootFolders = [
        { id: "united", name: "United Fillings Documents", type: "system" },
        { id: "my-docs", name: "My Documents", type: "user" },
        { id: "legal", name: "Legal Documents", type: "legal" }
    ]

    const currentFolder = rootFolders.find(f => f.id === currentFolderId)

    // Filter documents for current folder
    const folderDocuments = documents.filter(doc => doc.folder === currentFolderId)

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

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {rootFolders.map((folder) => (
                                    <Card
                                        key={folder.id}
                                        className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-none shadow-sm"
                                        onClick={() => setCurrentFolderId(folder.id)}
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
                        </>
                    ) : (
                        // Folder View
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">{currentFolder?.name}</h3>
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
                                                Upload a file to <strong>{currentFolder?.name}</strong>. Admins and clients with access will be able to see this.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
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
                            </div>

                            {folderDocuments.length > 0 ? (
                                <div className="grid gap-2">
                                    {folderDocuments.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">Uploaded by {doc.uploader} on {doc.date}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">Download</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[40vh] text-center space-y-4 border-2 border-dashed rounded-lg bg-slate-50">
                                    <p className="text-lg font-medium text-slate-900">No documents yet</p>
                                    <p className="text-slate-500">Upload a document to get started.</p>
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
