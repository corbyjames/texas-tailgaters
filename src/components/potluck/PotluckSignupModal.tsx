import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { PotluckItem } from '../../types/Game';
import PotluckService from '../../services/potluckService';
import { useAuth } from '../../hooks/useAuth';

interface PotluckSignupModalProps {
  item: PotluckItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PotluckSignupModal({ item, isOpen, onClose, onSuccess }: PotluckSignupModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const remainingNeeded = (item.quantityNeeded || 1) - (item.quantityBrought || 0);
  const isFull = remainingNeeded <= 0;
  const maxQuantity = Math.min(remainingNeeded, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to sign up for items');
      return;
    }

    if (isFull) {
      setError('This item is already fully assigned');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await PotluckService.assignPotluckItemWithQuantity({
        itemId: item.id,
        userId: user.id,
        userName: user.name || user.email?.split('@')[0] || 'Anonymous',
        quantity
      });

      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('potluckUpdate'));
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error signing up for item:', error);
      setError('Failed to sign up for this item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Sign Up to Bring Item
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Item Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-gray-500" />
            <span className="font-medium">{item.name}</span>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          
          {item.quantity && (
            <p className="text-sm text-gray-500">Serving info: {item.quantity}</p>
          )}

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Current Progress</span>
              <span className="font-medium">
                {item.quantityBrought || 0} / {item.quantityNeeded || 1} claimed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isFull ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ 
                  width: `${Math.min(100, ((item.quantityBrought || 0) / (item.quantityNeeded || 1)) * 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Current Assignments */}
          {item.assignments && item.assignments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Already signed up:</p>
              <div className="space-y-1">
                {item.assignments.map((assignment, idx) => (
                  <div key={idx} className="text-xs text-gray-600">
                    • {assignment.userName} - bringing {assignment.quantity}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        {!isFull ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many will you bring?
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={maxQuantity}
                  className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                  disabled={quantity >= maxQuantity}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {remainingNeeded > 1 
                  ? `Up to ${remainingNeeded} more needed`
                  : 'Only 1 more needed'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Signing up...' : `I'll bring ${quantity}`}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Item Fully Claimed</p>
              <p className="text-xs text-gray-600 mt-1">
                All {item.quantityNeeded} needed have been signed up for
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}