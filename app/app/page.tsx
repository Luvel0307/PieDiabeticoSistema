
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/ui/header';
import EvaluacionForm from '@/components/evaluacion-form';
import HistorialView from '@/components/historial-view';
import PacientesView from '@/components/pacientes-view';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('evaluacion');

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'evaluacion' && <EvaluacionForm />}
        {activeTab === 'historial' && <HistorialView />}
        {activeTab === 'pacientes' && <PacientesView />}
      </main>
    </div>
  );
}
