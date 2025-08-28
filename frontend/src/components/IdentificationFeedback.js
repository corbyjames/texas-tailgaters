import React, { useState } from 'react';
import { 
  ThumbsUp, ThumbsDown, RefreshCw, Edit3, Check, X, 
  AlertCircle, MessageSquare, Search 
} from 'lucide-react';

function IdentificationFeedback({ 
  prediction, 
  onRetry, 
  onCorrect, 
  onFeedback,
  isTopResult = false 
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctionInput, setCorrectionInput] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleThumbsUp = () => {
    setFeedbackType('correct');
    onFeedback({
      type: 'correct',
      prediction: prediction,
      message: 'User confirmed identification is correct'
    });
  };

  const handleThumbsDown = () => {
    setFeedbackType('incorrect');
    setShowFeedback(true);
  };

  const handleCorrection = () => {
    setShowCorrection(true);
    setShowFeedback(false);
  };

  const searchSpecies = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/species/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching species:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const submitCorrection = (species = null) => {
    const correction = species || {
      common_name: correctionInput,
      scientific_name: null
    };

    onCorrect({
      original: prediction,
      corrected: correction,
      feedback: feedbackText || 'User provided correction'
    });

    // Reset states
    setShowCorrection(false);
    setShowFeedback(false);
    setCorrectionInput('');
    setFeedbackText('');
    setSearchResults([]);
  };

  const submitFeedback = () => {
    onFeedback({
      type: feedbackType,
      prediction: prediction,
      message: feedbackText,
      needsRetry: true
    });

    if (feedbackType === 'incorrect' && feedbackText) {
      onRetry(feedbackText);
    }

    setShowFeedback(false);
    setFeedbackText('');
  };

  return (
    <div className="mt-4 border-t pt-4">
      {/* Feedback buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Was this identification helpful?
        </div>
        <div className="flex items-center gap-2">
          {feedbackType === 'correct' ? (
            <span className="text-green-600 text-sm flex items-center">
              <Check className="w-4 h-4 mr-1" />
              Thanks for confirming!
            </span>
          ) : (
            <>
              <button
                onClick={handleThumbsUp}
                className="p-2 rounded-md hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
                title="Correct identification"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleThumbsDown}
                className="p-2 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                title="Incorrect identification"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
              <button
                onClick={handleCorrection}
                className="p-2 rounded-md hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                title="Provide correct species"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {isTopResult && (
                <button
                  onClick={() => onRetry()}
                  className="p-2 rounded-md hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-colors"
                  title="Try again"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Feedback form */}
      {showFeedback && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Help us improve our identification
              </p>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What species do you think this is? Any additional details?"
                className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submitFeedback}
                  className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm transition-colors"
                >
                  Submit & Retry
                </button>
                <button
                  onClick={handleCorrection}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
                >
                  Provide Correct Species
                </button>
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedbackText('');
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction form */}
      {showCorrection && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Search className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-2">
                What is the correct species?
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={correctionInput}
                  onChange={(e) => {
                    setCorrectionInput(e.target.value);
                    searchSpecies(e.target.value);
                  }}
                  placeholder="Type species name to search..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                
                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((species, idx) => (
                      <button
                        key={idx}
                        onClick={() => submitCorrection(species)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{species.common_name}</div>
                        <div className="text-xs text-gray-500 italic">{species.scientific_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Additional notes (optional)"
                className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => submitCorrection()}
                  disabled={!correctionInput}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm transition-colors"
                >
                  Submit Correction
                </button>
                <button
                  onClick={() => {
                    setShowCorrection(false);
                    setCorrectionInput('');
                    setSearchResults([]);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IdentificationFeedback;