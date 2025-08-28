import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Loader2, Trash2, Eye, MapPin, Calendar, Info, X, Download } from 'lucide-react';
import api from '../services/api';
import DragDropZone from './DragDropZone';
import FullPageDropZone from './FullPageDropZone';

function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null,
    preview: null,
    location: '',
    latitude: '',
    longitude: '',
    description: ''
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await api.listImages(50, 0);
      setImages(data.images || []);
    } catch (error) {
      console.error('Error loading images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadData({
        ...uploadData,
        file: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file) return;

    setUploading(true);
    try {
      const metadata = {
        location: uploadData.location,
        latitude: uploadData.latitude ? parseFloat(uploadData.latitude) : null,
        longitude: uploadData.longitude ? parseFloat(uploadData.longitude) : null,
        description: uploadData.description
      };

      await api.uploadImage(uploadData.file, metadata);
      
      // Reset upload modal
      setUploadModal(false);
      setUploadData({
        file: null,
        preview: null,
        location: '',
        latitude: '',
        longitude: '',
        description: ''
      });
      
      // Reload images
      await loadImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.deleteImage(imageId);
      await loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image');
    }
  };

  const loadImageDetails = async (imageId) => {
    try {
      const details = await api.getImage(imageId);
      setSelectedImage(details);
    } catch (error) {
      console.error('Error loading image details:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleQuickDrop = (file) => {
    // Set up the upload data and open modal
    setUploadData({
      ...uploadData,
      file: file,
      preview: URL.createObjectURL(file)
    });
    setUploadModal(true);
  };

  return (
    <>
      {/* Full page drop zone for quick uploads */}
      <FullPageDropZone 
        onFileDrop={handleQuickDrop}
        enabled={!uploadModal}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Image Gallery</h2>
          <p className="text-gray-600">Browse and manage marine life photos</p>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Image
        </button>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-100">
                {image.url ? (
                  <img
                    src={image.url}
                    alt={image.original_filename || 'Marine life'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {image.original_filename || image.filename}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(image.upload_date)}
                </p>
                {image.location_name && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {image.location_name}
                  </p>
                )}
              </div>

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => loadImageDetails(image.id)}
                  className="p-2 bg-white rounded-full mx-1 hover:bg-gray-100 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-5 h-5 text-gray-700" />
                </button>
                <a
                  href={image.url}
                  download={image.original_filename}
                  className="p-2 bg-white rounded-full mx-1 hover:bg-gray-100 transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </a>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-white rounded-full mx-1 hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No images uploaded yet</p>
          <button
            onClick={() => setUploadModal(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upload First Image
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Upload Marine Life Image</h3>
                <button
                  onClick={() => setUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drag & Drop File Upload */}
              <DragDropZone
                onFileSelect={handleFileSelect}
                preview={uploadData.preview}
                className="mb-4"
              />

              {/* Metadata Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadData.location}
                    onChange={(e) => setUploadData({ ...uploadData, location: e.target.value })}
                    placeholder="e.g., Great Barrier Reef"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude (Optional)
                    </label>
                    <input
                      type="number"
                      value={uploadData.latitude}
                      onChange={(e) => setUploadData({ ...uploadData, latitude: e.target.value })}
                      placeholder="-18.2871"
                      step="0.0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude (Optional)
                    </label>
                    <input
                      type="number"
                      value={uploadData.longitude}
                      onChange={(e) => setUploadData({ ...uploadData, longitude: e.target.value })}
                      placeholder="147.6992"
                      step="0.0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Describe what's in the image..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setUploadModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadData.file || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Image Details</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div>
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.original_filename}
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">File Information</h4>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Name:</span> {selectedImage.original_filename}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Size:</span> {formatFileSize(selectedImage.size)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Uploaded:</span> {formatDate(selectedImage.upload_date)}
                    </p>
                  </div>

                  {selectedImage.location_name && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Location</h4>
                      <p className="text-sm text-gray-600">{selectedImage.location_name}</p>
                      {selectedImage.latitude && selectedImage.longitude && (
                        <p className="text-sm text-gray-600">
                          Coordinates: {selectedImage.latitude}, {selectedImage.longitude}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedImage.description && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                      <p className="text-sm text-gray-600">{selectedImage.description}</p>
                    </div>
                  )}

                  {selectedImage.species && selectedImage.species.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Identified Species</h4>
                      {selectedImage.species.map((s, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {s.common_name} ({s.scientific_name})
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 flex gap-2">
                    <a
                      href={selectedImage.url}
                      download={selectedImage.original_filename}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                    <button
                      onClick={() => {
                        handleDelete(selectedImage.id);
                        setSelectedImage(null);
                      }}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default GalleryPage;