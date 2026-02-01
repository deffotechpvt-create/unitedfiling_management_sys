"use client"

import { useState } from "react"
import { Document } from "@/types"
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronDown, Folder, File as FileIcon, Download, Eye, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FileSystemItemProps {
    item: Document
    level?: number
    onView: (item: Document) => void
}

export function FileSystemItem({ item, level = 0, onView }: FileSystemItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    const hasChildren = item.type === "folder" && item.children && item.children.length > 0

    const toggleOpen = () => {
        if (item.type === "folder") {
            setIsOpen(!isOpen)
        }
    }

    return (
        <div>
            <div
                className={cn(
                    "flex items-center py-2 px-2 hover:bg-slate-50 cursor-pointer rounded-md transition-colors",
                    level > 0 && "ml-4"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={toggleOpen}
            >
                <div className="mr-2 h-4 w-4 shrink-0 text-slate-400">
                    {item.type === "folder" && (
                        hasChildren ? (
                            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        ) : <div className="w-4" />
                    )}
                </div>

                <div className="mr-3 h-5 w-5 shrink-0">
                    {item.type === "folder" ? (
                        <Folder className={cn("h-5 w-5", isOpen ? "text-blue-500" : "text-blue-400")} fill="currentColor" />
                    ) : (
                        <FileIcon className="h-5 w-5 text-slate-400" />
                    )}
                </div>

                <div className="flex-1 truncate">
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    {item.type === "file" && (
                        <span className="ml-2 text-xs text-slate-400">{item.size} • {new Date(item.updatedAt).toLocaleDateString()}</span>
                    )}
                </div>

                {item.type === "file" && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => onView(item)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {isOpen && item.children && (
                <div>
                    {item.children.map((child) => (
                        <FileSystemItem key={child.id} item={child} level={level + 1} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    )
}

interface PDFViewerProps {
    file: Document | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PDFViewer({ file, open, onOpenChange }: PDFViewerProps) {
    if (!file) return null
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{file.name}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 bg-slate-100 rounded-md border flex items-center justify-center p-8">
                    <div className="text-center">
                        <FileIcon className="h-24 w-24 text-slate-300 mx-auto mb-4" />
                        <p className="text-muted-foreground">Preview not available in mock mode.</p>
                        <p className="text-xs text-slate-400">({file.name})</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
