'use client'

import * as React from 'react'
import { Upload, X, FileIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

import { cn } from './utils'

export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  progress: number
  status: FileUploadStatus
  error?: string
  url?: string
}

export interface FileUploadProps {
  /** Accepted MIME types (e.g. "image/*,.pdf"). */
  accept?: string
  /** Maximum file size in bytes. */
  maxSize?: number
  /** Allow multiple files. */
  multiple?: boolean
  /** Currently tracked files. */
  files?: UploadedFile[]
  /** Called when files are dropped or selected. Returns raw File objects. */
  onFilesAdded?: (files: File[]) => void
  /** Called when a file is removed from the list. */
  onRemove?: (fileId: string) => void
  disabled?: boolean
  className?: string
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * FileUpload — drag-and-drop file upload zone with per-file progress
 * indicators and error states. Designed to integrate with R2 signed URLs.
 */
export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  { accept, maxSize, multiple = true, files = [], onFilesAdded, onRemove, disabled, className },
  ref,
) {
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return
    const arr = Array.from(fileList)
    const valid = maxSize ? arr.filter((f) => f.size <= maxSize) : arr
    onFilesAdded?.(valid)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    processFiles(e.dataTransfer.files)
  }

  return (
    <div ref={ref} className={cn('w-full space-y-3', className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={cn(
          'border-border-strong bg-bg-elevated flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragActive && 'border-forge-orange bg-forge-orange/5',
          !disabled && 'hover:border-forge-orange/60 cursor-pointer',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <Upload
          className={cn('h-8 w-8', dragActive ? 'text-forge-orange' : 'text-text-secondary')}
        />
        <p className="text-text-primary text-sm font-medium">
          Drop files here or <span className="text-forge-orange">browse</span>
        </p>
        {(accept || maxSize) && (
          <p className="text-text-secondary text-xs">
            {accept && `Accepted: ${accept}`}
            {accept && maxSize && ' · '}
            {maxSize && `Max ${formatBytes(maxSize)}`}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="border-border-strong bg-bg-surface flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <FileIcon className="text-text-secondary h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate text-sm">{file.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-text-secondary text-xs">{formatBytes(file.size)}</span>
                  {file.status === 'uploading' && (
                    <div className="bg-bg-elevated h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-forge-orange h-full rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  {file.status === 'error' && (
                    <span className="text-error flex items-center gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {file.error ?? 'Upload failed'}
                    </span>
                  )}
                </div>
              </div>
              {file.status === 'success' && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  className="text-text-secondary hover:text-text-primary rounded p-0.5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})
