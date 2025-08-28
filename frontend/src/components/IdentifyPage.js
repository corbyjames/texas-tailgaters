import React, { useState } from 'react';
import { Upload, Camera, Loader2, MapPin, Check, X } from 'lucide-react';
import api from '../services/api';
import DragDropZone from './DragDropZone';
import IdentificationFeedback from './IdentificationFeedback';

function IdentifyPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [location, setLocation] = useState({ lat: '', lon: '' });
  const [saveImage, setSaveImage] = useState(true);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResults(null);
    }
  };

  const identifySpecies = async (retryFeedback = null) => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const locationData = {};
      if (location.lat) locationData.lat = parseFloat(location.lat);
      if (location.lon) locationData.lon = parseFloat(location.lon);
      if (retryFeedback) locationData.feedback = retryFeedback;

      const data = await api.identifySpecies(selectedFile, locationData, saveImage);
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      setResults({
        status: 'error',
        message: 'Failed to identify species. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedbackData) => {
    try {
      await api.submitFeedback({
        observation_id: results?.observation_id,
        prediction: feedbackData.prediction,
        feedback_type: feedbackData.type,
        message: feedbackData.message
      });
      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleCorrection = async (correctionData) => {
    try {
      await api.submitFeedback({
        observation_id: results?.observation_id,
        prediction: correctionData.original,
        feedback_type: 'correction',
        message: correctionData.feedback,
        corrected_species: correctionData.corrected
      });
      console.log('Correction submitted successfully');
      
      // Update local results to show the correction
      if (results?.predictions?.length > 0) {
        const updatedPredictions = [...results.predictions];
        updatedPredictions[0] = {
          ...correctionData.corrected,
          confidence: 1.0,
          corrected: true
        };
        setResults({ ...results, predictions: updatedPredictions });
      }
    } catch (error) {
      console.error('Error submitting correction:', error);
    }
  };

  const handleRetry = (feedback) => {
    identifySpecies(feedback);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          AI Species Identification
        </h2>
        <p className="text-gray-600">
          Upload a marine life photo to identify species using artificial intelligence
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Drag & Drop File Upload Area */}
        <DragDropZone 
          onFileSelect={handleFileSelect}
          preview={preview}
          className="mb-6"
        />

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Location (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Latitude"
                value={location.lat}
                onChange={(e) => setLocation({ ...location, lat: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.0001"
              />
              <input
                type="number"
                placeholder="Longitude"
                value={location.lon}
                onChange={(e) => setLocation({ ...location, lon: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.0001"
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={saveImage}
                onChange={(e) => setSaveImage(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Save image to gallery
              </span>
            </label>
          </div>
        </div>

        {/* Identify Button */}
        <button
          onClick={identifySpecies}
          disabled={!selectedFile || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Analyzing Image...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-5 w-5" />
              Identify Species
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Identification Results</h3>
          
          {results.status === 'error' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{results.message}</p>
            </div>
          ) : results.status === 'no_species_detected' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-700">{results.message}</p>
            </div>
          ) : results.predictions && results.predictions.length > 0 ? (
            <div className="space-y-4">
              {results.predictions.map((prediction, index) => (
                <div key={index}>
                  <div
                    className={`border rounded-lg p-4 ${
                      index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {prediction.common_name || prediction.scientific_name}
                          {prediction.corrected && (
                            <span className="ml-2 text-sm bg-green-500 text-white px-2 py-1 rounded">
                              Corrected
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 italic">
                          {prediction.scientific_name}
                        </p>
                        
                        {prediction.conservation_status && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Conservation Status:</span>{' '}
                            <span className={
                              prediction.conservation_status === 'Endangered' ? 'text-red-600' :
                              prediction.conservation_status === 'Vulnerable' ? 'text-orange-600' :
                              'text-green-600'
                            }>
                              {prediction.conservation_status}
                            </span>
                          </p>
                        )}
                        
                        {prediction.habitat && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Habitat:</span> {prediction.habitat}
                          </p>
                        )}
                        
                        {prediction.locations && prediction.locations.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Found in:</span>{' '}
                            {prediction.locations.join(', ')}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-4 text-right">
                        <p className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                          {(prediction.confidence * 100).toFixed(0)}%
                        </p>
                        <p className={`text-sm ${getConfidenceColor(prediction.confidence)}`}>
                          {getConfidenceLabel(prediction.confidence)} Confidence
                        </p>
                      </div>
                    </div>
                    
                    {/* Add feedback component for each prediction */}
                    {!prediction.corrected && (
                      <IdentificationFeedback
                        prediction={prediction}
                        isTopResult={index === 0}
                        onRetry={handleRetry}
                        onCorrect={handleCorrection}
                        onFeedback={handleFeedback}
                      />
                    )}
                  </div>
                </div>
              ))}
              
              {results.observation_id && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    Observation saved with ID: {results.observation_id}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No predictions available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default IdentifyPage;