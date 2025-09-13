import React from 'react';
import { X, ShoppingBag, Users, Clock, UserCheck, Package, AlertCircle } from 'lucide-react';
import { PotluckItem } from '../../types/Game';
import { RSVP } from '../../services/rsvpService';

interface StatsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'potluck' | 'assigned' | 'needed' | 'attending';
  title: string;
  items?: PotluckItem[];
  attendees?: string[];
  rsvps?: RSVP[];
  stats?: {
    totalItems: number;
    assignedItems: number;
    unassignedItems: number;
  };
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  main: { label: 'Main Dish', icon: '🍖', color: 'bg-red-100 text-red-800' },
  side: { label: 'Side Dish', icon: '🥗', color: 'bg-green-100 text-green-800' },
  appetizer: { label: 'Appetizer', icon: '🥨', color: 'bg-yellow-100 text-yellow-800' },
  dessert: { label: 'Dessert', icon: '🍰', color: 'bg-pink-100 text-pink-800' },
  drink: { label: 'Drinks', icon: '🥤', color: 'bg-blue-100 text-blue-800' },
  condiment: { label: 'Condiments', icon: '🧂', color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-800' },
};

export function StatsDetailModal({
  isOpen,
  onClose,
  type,
  title,
  items = [],
  attendees = [],
  rsvps = [],
  stats
}: StatsDetailModalProps) {
  if (!isOpen) return null;

  const renderPotluckItems = () => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No potluck items yet</p>
        </div>
      );
    }

    // Group items by category
    const itemsByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PotluckItem[]>);

    return (
      <div className="space-y-4">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => {
          const categoryInfo = CATEGORY_LABELS[category] || CATEGORY_LABELS.other;
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
                <span className="text-xs text-gray-500">({categoryItems.length})</span>
              </div>
              <div className="space-y-2">
                {categoryItems.map(item => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.quantity && (
                          <p className="text-xs text-gray-500 mt-1">Serving: {item.quantity}</p>
                        )}
                      </div>
                      {item.assignments && item.assignments.length > 0 && (
                        <div className="ml-4 text-right">
                          <p className="text-xs font-medium text-green-600">Assigned to:</p>
                          {item.assignments.map((assignment, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              {assignment.userName} ({assignment.quantity})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAssignedItems = () => {
    const assignedItems = items.filter(item => item.assignments && item.assignments.length > 0);
    
    if (assignedItems.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No items assigned yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {assignedItems.map(item => (
          <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {CATEGORY_LABELS[item.category]?.label || 'Other'}
                </p>
              </div>
              <div className="text-right">
                {item.assignments?.map((assignment, idx) => (
                  <div key={idx} className="mb-1">
                    <p className="text-sm font-medium text-green-700">
                      {assignment.userName}
                    </p>
                    <p className="text-xs text-gray-600">
                      Bringing {assignment.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {item.quantityNeeded > (item.quantityBrought || 0) && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-orange-600">
                  Still need {item.quantityNeeded - (item.quantityBrought || 0)} more
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderNeededItems = () => {
    const neededItems = items.filter(item => 
      !item.assignments || 
      item.assignments.length === 0 || 
      (item.quantityBrought || 0) < item.quantityNeeded
    );

    if (neededItems.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
          <p className="text-green-600">All items are covered!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {neededItems.map(item => {
          const stillNeeded = item.quantityNeeded - (item.quantityBrought || 0);
          const isPartiallyFilled = (item.quantityBrought || 0) > 0;

          return (
            <div key={item.id} className={`border rounded-lg p-4 ${
              isPartiallyFilled ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {CATEGORY_LABELS[item.category]?.label || 'Other'}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    isPartiallyFilled ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {stillNeeded}
                  </p>
                  <p className="text-xs text-gray-600">needed</p>
                  {isPartiallyFilled && (
                    <p className="text-xs text-green-600 mt-1">
                      {item.quantityBrought} assigned
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAttendees = () => {
    if (attendees.length === 0 && (!rsvps || rsvps.length === 0)) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No attendees yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to RSVP!</p>
        </div>
      );
    }

    // Combine unique attendees from potluck assignments and RSVPs
    const allAttendees = new Set<string>();
    
    // Add people who have signed up for items
    items.forEach(item => {
      item.assignments?.forEach(assignment => {
        // Filter out generic entries like "Multiple people"
        const name = assignment.userName;
        if (name && 
            name.toLowerCase() !== 'multiple people' && 
            name.toLowerCase() !== 'multiple' &&
            name.toLowerCase() !== 'anonymous') {
          allAttendees.add(name);
        }
      });
    });
    
    // Add people from attendees list
    attendees.forEach(name => {
      // Filter out generic entries
      if (name && 
          name.toLowerCase() !== 'multiple people' && 
          name.toLowerCase() !== 'multiple' &&
          name.toLowerCase() !== 'anonymous') {
        allAttendees.add(name);
      }
    });
    
    // Add people who have RSVP'd
    rsvps?.forEach(rsvp => {
      if (rsvp.status === 'yes') {
        const name = rsvp.userName || rsvp.userEmail;
        if (name && 
            name.toLowerCase() !== 'multiple people' && 
            name.toLowerCase() !== 'multiple' &&
            name.toLowerCase() !== 'anonymous') {
          allAttendees.add(name);
        }
      }
    });

    const attendeeList = Array.from(allAttendees).sort();

    return (
      <div>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total attending: <span className="font-bold text-gray-900">{attendeeList.length}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {attendeeList.map((name, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-purple-700">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700">{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getIcon = () => {
    switch (type) {
      case 'potluck': return <ShoppingBag className="w-5 h-5" />;
      case 'assigned': return <UserCheck className="w-5 h-5" />;
      case 'needed': return <Clock className="w-5 h-5" />;
      case 'attending': return <Users className="w-5 h-5" />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'potluck': return 'text-orange-500';
      case 'assigned': return 'text-green-600';
      case 'needed': return 'text-blue-600';
      case 'attending': return 'text-purple-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-xl sm:rounded-lg max-w-2xl w-full h-[90vh] sm:h-auto sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`${getIconColor()}`}>
              {getIcon()}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {type === 'potluck' && renderPotluckItems()}
          {type === 'assigned' && renderAssignedItems()}
          {type === 'needed' && renderNeededItems()}
          {type === 'attending' && renderAttendees()}
        </div>

        {/* Footer with summary */}
        {stats && (
          <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50">
            <div className="flex flex-wrap justify-between text-xs sm:text-sm gap-2">
              <span className="text-gray-600">
                Total Items: <span className="font-medium text-gray-900">{stats.totalItems}</span>
              </span>
              <span className="text-gray-600">
                Assigned: <span className="font-medium text-green-600">{stats.assignedItems}</span>
              </span>
              <span className="text-gray-600">
                Still Needed: <span className="font-medium text-orange-600">{stats.unassignedItems}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}