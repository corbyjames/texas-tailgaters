import React, { useEffect, useState } from 'react';
import { AlertCircle, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import headlineService, { Headline } from '../services/headlineService';

const HeadlineBanner: React.FC = () => {
  const [headline, setHeadline] = useState<Headline | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Subscribe to headline changes
    const unsubscribe = headlineService.subscribeToHeadline((newHeadline) => {
      setHeadline(newHeadline);
      // Reset dismissed state when headline changes
      if (newHeadline?.text !== headline?.text) {
        setIsDismissed(false);
      }
    });

    // Initial fetch
    headlineService.getActiveHeadline().then(setHeadline);

    return () => unsubscribe();
  }, [headline?.text]);

  if (!headline || !headline.isActive || isDismissed) {
    return null;
  }

  const getStyles = () => {
    switch (headline.type) {
      case 'alert':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: <AlertCircle className="w-5 h-5" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5" />,
        };
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="w-5 h-5" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`border-b ${styles.bg} ${styles.text}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {styles.icon}
            <p className="font-medium text-sm md:text-base">{headline.text}</p>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className={`p-1 rounded-lg hover:bg-white/50 transition-colors ${styles.text}`}
            aria-label="Dismiss headline"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeadlineBanner;