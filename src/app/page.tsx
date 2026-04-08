'use client';
import { useState, useEffect } from 'react';
import type { Project, ContentItem, StrategyIdea } from '@/types';
import Stepper from '@/components/Stepper';
import Phase1Setup from '@/components/phases/Phase1_Setup';
import Phase2Strategy from '@/components/phases/Phase2_Strategy';
import Phase3Images from '@/components/phases/Phase3_Images';
import Phase4Captions from '@/components/phases/Phase4_Captions';
import Phase5Voice from '@/components/phases/Phase5_Voice';
import Phase6Video from '@/components/phases/Phase5_Video';
import Phase7Editor from '@/components/phases/Phase6_Editor';
import Phase8Export from '@/components/phases/Phase7_Export';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [ideas, setIdeas] = useState<StrategyIdea[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectList, setShowProjectList] = useState(false);

  // Credits laden
  useEffect(() => {
    fetch('/api/poll-task?taskId=credits_check')
      .then(r => r.json())
      .then(d => { if (typeof d.credits === 'number') setCredits(d.credits); })
      .catch(() => {});
  }, []);

  // Projekte laden
  useEffect(() => {
    fetch('/api/project').then(r => r.json()).then(d => setProjects(d.projects || []));
  }, []);

  const completeStep = (step: number) => {
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
    setCurrentStep(step + 1);
  };

  const handleProjectCreated = (p: Project) => {
    setProject(p);
    setProjects(prev => { const idx = prev.findIndex(x => x.id === p.id); return idx >= 0 ? prev.map((x, i) => i === idx ? p : x) : [...prev, p]; });
    completeStep(1);
  };

  const handleStrategyDone = (activeIdeas: StrategyIdea[]) => {
    setIdeas(activeIdeas);
    completeStep(2);
  };

  const handleImagesDone = (newItems: ContentItem[]) => {
    setItems(newItems);
    completeStep(3);
  };

  const handleCaptionsDone = (newItems: ContentItem[]) => {
    setItems(newItems);
    completeStep(4);
  };

  const handleVoiceDone = (newItems: ContentItem[]) => {
    setItems(newItems);
    completeStep(5);
  };

  const handleVideosDone = (newItems: ContentItem[]) => {
    setItems(newItems);
    completeStep(6);
  };

  const handleEditorDone = () => completeStep(7);

  const handleRestart = () => {
    setCurrentStep(1); setCompletedSteps([]); setProject(null);
    setIdeas([]); setItems([]); setShowProjectList(false);
  };

  const loadProject = (p: Project) => {
    setProject(p); setShowProjectList(false);
    setCompletedSteps([1]); setCurrentStep(2);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="border-b border-[#2d2d44] bg-[#1a1a2e]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1 className="text-lg font-bold leading-none">
                <span className="text-[#a855f7]">KI Content Fabrik</span>
                <span className="text-[#f1f5f9]"> — Social Media Creator</span>
              </h1>
              {project && <p className="text-xs text-[#94a3b8] mt-0.5">📋 {project.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {credits !== null && (
              <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full border border-purple-700/40">
                💎 {credits} Credits
              </span>
            )}
            <button onClick={() => setShowProjectList(s => !s)}
              className="btn btn-ghost btn-sm text-xs">📂 Projekte</button>
            <button onClick={handleRestart} className="btn btn-ghost btn-sm text-xs">+ Neu</button>
          </div>
        </div>
      </header>

      {/* Projekt-Liste Dropdown */}
      {showProjectList && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">📂 Gespeicherte Projekte</h3>
            {projects.length === 0
              ? <p className="text-sm text-[#94a3b8]">Noch keine Projekte vorhanden.</p>
              : <div className="space-y-2">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-[#0f0f1a] rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-[#94a3b8]">{new Date(p.createdAt).toLocaleDateString('de-DE')} · {p.platforms.join(', ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadProject(p)} className="btn btn-primary btn-sm text-xs">Öffnen</button>
                        <button onClick={async () => {
                          await fetch('/api/project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: p.id }) });
                          setProjects(prev => prev.filter(x => x.id !== p.id));
                        }} className="btn btn-danger btn-sm text-xs">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="max-w-7xl mx-auto px-4">
        <Stepper currentStep={currentStep} onStepClick={setCurrentStep} completedSteps={completedSteps} />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {currentStep === 1 && (
          <Phase1Setup existingProject={project} onProjectCreated={handleProjectCreated} />
        )}
        {currentStep === 2 && project && (
          <Phase2Strategy project={project} onDone={handleStrategyDone} onBack={() => setCurrentStep(1)} />
        )}
        {currentStep === 3 && project && (
          <Phase3Images project={project} ideas={ideas} onDone={handleImagesDone} onBack={() => setCurrentStep(2)} />
        )}
        {currentStep === 4 && project && (
          <Phase4Captions project={project} items={items} onDone={handleCaptionsDone} onBack={() => setCurrentStep(3)} />
        )}
        {currentStep === 5 && project && (
          <Phase5Voice project={project} items={items} onDone={handleVoiceDone} onBack={() => setCurrentStep(4)} />
        )}
        {currentStep === 6 && project && (
          <Phase6Video project={project} items={items} onDone={handleVideosDone} onBack={() => setCurrentStep(5)} />
        )}
        {currentStep === 7 && project && (
          <Phase7Editor project={project} items={items} onDone={handleEditorDone} onBack={() => setCurrentStep(6)} />
        )}
        {currentStep === 8 && project && (
          <Phase8Export project={project} items={items} onRestart={handleRestart} onBack={() => setCurrentStep(7)} />
        )}
        {!project && currentStep !== 1 && (
          <div className="text-center py-20">
            <p className="text-[#94a3b8] mb-4">Bitte zuerst ein Projekt anlegen.</p>
            <button onClick={() => setCurrentStep(1)} className="btn btn-primary">← Zurück zu Schritt 1</button>
          </div>
        )}
      </main>
    </div>
  );
}
