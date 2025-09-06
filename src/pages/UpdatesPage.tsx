import React from 'react';
import { ClosedIssuesDisplay } from '../components/feedback/ClosedIssuesDisplay';
import PublicLayout from '../components/layout/PublicLayout';

export default function UpdatesPage() {
  return (
    <PublicLayout title="Texas Tailgaters - Updates">
      <ClosedIssuesDisplay />
    </PublicLayout>
  );
}