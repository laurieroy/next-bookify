"use client";

import { Loader2 } from "lucide-react";

export function LoadingOverlay() {
  return (
    <div className="loading-wrapper">
      <div className="loading-shadow-wrapper">
        <div className="loading-shadow bg-white">
          <Loader2 className="loading-animation h-12 w-12 text-[var(--color-brand)]" />
          <div className="space-y-2 text-center">
            <h2 className="loading-title">Preparing your book</h2>
            <div className="loading-progress">
              <div className="loading-progress-item">
                <span className="loading-progress-status" />
                <span>Uploading files</span>
              </div>
              <div className="loading-progress-item">
                <span className="loading-progress-status" />
                <span>Extracting content</span>
              </div>
              <div className="loading-progress-item">
                <span className="loading-progress-status" />
                <span>Configuring narration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
