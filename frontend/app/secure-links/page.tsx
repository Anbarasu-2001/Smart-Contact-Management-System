'use client';

import React, { Suspense } from 'react';
import ShareGeneratorPage from '@/components/pages/ShareGeneratorPage';
import MySharedLinks from '@/components/contacts/MySharedLinks';

export default function SecureLinks() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
          <div className="glass-panel-strong p-6 mb-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">Secure Link Generator</h1>
              <p className="app-muted text-lg">Generate temporary private communication links.</p>
          </div>
          
          {/* Generate Link Card Section */}
          <ShareGeneratorPage />

          {/* Active Links Section */}
          <div className="mt-8">
              <MySharedLinks />
          </div>
      </div>
    </Suspense>
  );
}