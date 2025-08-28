import React, { useState, useEffect, useCallback } from 'react';
import { Upload } from 'lucide-react';

function FullPageDropZone({ onFileDrop, enabled = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show overlay if dragging files from outside
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragCounter(prev => prev + 1);
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);
    
    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate it's an image
      if (file.type.startsWith('image/')) {
        onFileDrop(file);
      }
    }
  }, [onFileDrop]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners to the whole document
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    // Cleanup
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [enabled, handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-blue-600 bg-opacity-90 pointer-events-auto">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="bg-white rounded-full p-8 mb-6 inline-block">
              <Upload className="h-20 w-20 text-blue-600 animate-bounce" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Drop your image here
            </h2>
            <p className="text-xl text-blue-100">
              Release to upload to gallery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FullPageDropZone;