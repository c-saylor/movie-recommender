import React from 'react';
import '../styles/skeletonCard.scss';

export const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-poster" />
    <div className="skeleton-body">
      <div className="skeleton-line sk-title" />
      <div className="skeleton-line sk-rating" />
      <div className="skeleton-line sk-actions" />
    </div>
  </div>
);
