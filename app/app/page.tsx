
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/header';
import EvaluacionForm from '@/components/evaluacion-form';
import HistorialView from '@/components/historial-view';
import PacientesView from '@/components/pacientes-view';
import ErrorBoundary from '@/components/error-boundary';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('evaluacion');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <ErrorBoundary>
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
        </ErrorBoundary>
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorBoundary>
            {activeTab === 'evaluacion' && <EvaluacionForm />}
            {activeTab === 'historial' && <HistorialView />}
            {activeTab === 'pacientes' && <PacientesView />}
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}
