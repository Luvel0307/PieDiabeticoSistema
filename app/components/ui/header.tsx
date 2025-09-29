
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'evaluacion', label: 'Nueva Evaluación' },
    { id: 'historial', label: 'Historial' },
    { id: 'pacientes', label: 'Pacientes' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo y título */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/logo_colegio.png"
                  alt="Colegio México"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="bg-secondary/20 p-2 rounded-lg">
                <div className="relative w-8 h-8">
                  <Image
                    src="/foot-icon.png"
                    alt="Pie sano"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                Sistema de Evaluación de Pie Diabético
              </h1>
              <p className="text-sm text-muted-foreground">
                Análisis inteligente con lógica difusa
              </p>
              <p className="text-xs text-muted-foreground">
                Desarrollado en colaboración con el Colegio México
              </p>
            </div>
          </div>

          {/* Botón menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-muted"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Navegación desktop */}
        <nav className="hidden md:flex space-x-1 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Navegación móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-md font-medium text-left transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
