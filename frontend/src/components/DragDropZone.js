import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, FileX } from 'lucide-react';

function DragDropZone({ onFileSelect, preview, className = '', children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setDragError('Please drop an image file');
      return false;
    }
    
    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setDragError('File size must be less than 100MB');
      return false;
    }
    
    return true;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragError(null);

    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      if (validateFile(file)) {
        // Create a synthetic event to match the file input onChange format
        const syntheticEvent = {
          target: {
            files: [file]
          }
        };
        onFileSelect(syntheticEvent);
      }
    }
  }, [onFileSelect]);

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      onFileSelect(e);
    }
  };

  const baseClasses = `
    relative border-2 border-dashed rounded-lg p-8 text-center 
    transition-all duration-200 cursor-pointer
    ${isDragging 
      ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
      : dragError
      ? 'border-red-500 bg-red-50'
      : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
    }
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('dropzone-file-input').click()}
    >
      {/* Invisible overlay when dragging */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
          <div className="text-center">
            <Upload className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
            <p className="mt-2 text-lg font-semibold text-blue-600">Drop image here</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {dragError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
          <div className="text-center">
            <FileX className="mx-auto h-16 w-16 text-red-600" />
            <p className="mt-2 text-lg font-semibold text-red-600">{dragError}</p>
            <p className="text-sm text-red-500 mt-1">Click to select a different file</p>
          </div>
        </div>
      )}

      {/* Content */}
      {children || (
        preview ? (
          <div>
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-64 mx-auto rounded shadow-md"
            />
            <p className="mt-4 text-sm text-gray-600">
              Click or drag to replace image
            </p>
          </div>
        ) : (
          <div>
            {isDragging ? (
              <Upload className="mx-auto h-16 w-16 text-blue-600 animate-pulse" />
            ) : (
              <ImageIcon className="mx-auto h-16 w-16 text-gray-400" />
            )}
            <p className="mt-4 text-lg text-gray-700 font-medium">
              Drag & drop an image here
            </p>
            <p className="mt-2 text-sm text-gray-500">
              or click to browse files
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Supports: JPG, PNG, GIF, WebP (max 100MB)
            </p>
          </div>
        )
      )}

      <input
        id="dropzone-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

export default DragDropZone;