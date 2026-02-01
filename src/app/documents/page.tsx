"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenTool, Upload, FileUp } from "lucide-react"
import { ESignModal } from "@/components/documents/esign-modal"
import { FileSystemItem, PDFViewer } from "@/components/documents/file-explorer"
import { Document } from "@/types"
import { useAuth } from "@/context/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const MOCK_DOCS: Document = {
    id: "root",
    name: "United Fillings Documents",
    type: "folder",
    updatedAt: new Date().toISOString(),
    children: [
        {
            id: "comp1",
            name: "United Fillings Corp",
            type: "folder",
            updatedAt: new Date().toISOString(),
            children: [
                {
                    id: "2024",
                    name: "FY 2023-24",
                    type: "folder",
                    updatedAt: new Date().toISOString(),
                    children: [
                        {
                            id: "inc",
                            name: "Incorporation Documents",
                            type: "folder",
                            updatedAt: new Date().toISOString(),
                            children: [
                                { id: "f1", name: "Certificate of Incorporation.pdf", type: "file", size: "1.2 MB", updatedAt: new Date().toISOString() },
                                { id: "f2", name: "MOA & AOA.pdf", type: "file", size: "2.5 MB", updatedAt: new Date().toISOString() }
                            ]
                        },
                        {
                            id: "tax",
                            name: "Tax Filings",
                            type: "folder",
                            updatedAt: new Date().toISOString(),
                            children: [
                                { id: "f3", name: "GST Return Q1.pdf", type: "file", size: "500 KB", updatedAt: new Date().toISOString() }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

export default function DocumentsPage() {
    const { user } = useAuth()
    const [isSignModalOpen, setIsSignModalOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<Document | null>(null)
    const [pendingCount, setPendingCount] = useState(3)
    const [isUploadOpen, setIsUploadOpen] = useState(false)

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault()
        toast.success("Document uploaded successfully!")
        setIsUploadOpen(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Document Vault</h1>
                {user?.role === "ADMIN" && (
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Upload className="mr-2 h-4 w-4" /> Upload Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                                <DialogDescription>
                                    Upload a new document to the vault. Only admins can perform this action.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpload} className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input id="name" placeholder="Document Name" className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="file" className="text-right">
                                        File
                                    </Label>
                                    <Input id="file" type="file" className="col-span-3" required />
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button type="submit">Upload</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {pendingCount > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg text-blue-900">Action Required</CardTitle>
                        </div>
                        <CardDescription className="text-blue-700">
                            You have {pendingCount} documents waiting for Director's signature.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setIsSignModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            Review & Sign
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Files</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md p-4 min-h-[400px] bg-white">
                        <FileSystemItem item={MOCK_DOCS} onView={setSelectedFile} />
                    </div>
                </CardContent>
            </Card>

            <ESignModal
                open={isSignModalOpen}
                onOpenChange={setIsSignModalOpen}
                onComplete={() => setPendingCount(prev => Math.max(0, prev - 1))}
            />

            <PDFViewer
                file={selectedFile}
                open={!!selectedFile}
                onOpenChange={(open) => !open && setSelectedFile(null)}
            />
        </div>
    )
}
