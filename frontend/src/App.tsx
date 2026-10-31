import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { TopHeader } from './components/TopHeader';
import { FaultModal } from './components/FaultModal';
import { LoginModal } from './components/LoginModal';

import { CommandCenterView } from './views/CommandCenterView';
import { MonitoringView } from './views/MonitoringView';
import { ServiceInventoryView } from './views/ServiceInventoryView';
import { AnomalyIntelligenceView } from './views/AnomalyIntelligenceView';
import { FailurePredictionView } from './views/FailurePredictionView';
import { RootCauseAnalysisView } from './views/RootCauseAnalysisView';
import { IncidentManagementView } from './views/IncidentManagementView';
import { RecoveryIntelligenceView } from './views/RecoveryIntelligenceView';
import { RecoverySandboxView } from './views/RecoverySandboxView';
import { RecoveryVerificationView } from './views/RecoveryVerificationView';
import { AlertsView } from './views/AlertsView';
import { AnalyticsView } from './views/AnalyticsView';
import { AssistantView } from './views/AssistantView';
import { AuditLogsView } from './views/AuditLogsView';
import { AdministrationView } from './views/AdministrationView';
import { SettingsView } from './views/SettingsView';

import { api } from './services/api';
import {
  DashboardOverview,
  MetricSample,
  ServiceItem,
  IncidentItem,
  AnomalyItem,
  PredictionItem,
  RecoveryPlaybookItem,
  AlertItem,
  User
} from './types';

export function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [faultModalOpen, setFaultModalOpen] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Core Data States
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [metrics, setMetrics] = useState<MetricSample[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [dependencies, setDependencies] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [playbooks, setPlaybooks] = useState<RecoveryPlaybookItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedPlanForSandbox, setSelectedPlanForSandbox] = useState<number>(1);

  // Load User from LocalStorage or API
  useEffect(() => {
    const cachedUser = localStorage.getItem('phoenix_user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        console.error(e);
      }
    }
    api.getMe().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  // Polling data fetcher
  const refreshAllData = useCallback(async () => {
    try {
      const [ov, met, svcs, incs, anoms, preds, pbs, als, deps] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getMetrics(60).catch(() => []),
        api.getServices().catch(() => []),
        api.getIncidents('all', 'all', 'all', 50).catch(() => []),
        api.getAnomalies(50, false).catch(() => []),
        api.getPredictions(20).catch(() => []),
        api.getPlaybooks().catch(() => []),
        api.getAlerts().catch(() => []),
        api.getServiceDependencies().catch(() => ({ nodes: [], edges: [] }))
      ]);

      if (ov) setOverview(ov);
      if (met) setMetrics(met);
      if (svcs) setServices(svcs);
      if (incs) setIncidents(incs);
      if (anoms) setAnomalies(anoms);
      if (preds) setPredictions(preds);
      if (pbs) setPlaybooks(pbs);
      if (als) setAlerts(als);
      if (deps) setDependencies(deps);
    } catch (e) {
      console.error('Error refreshing data:', e);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 3000);
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // WebSocket Live Push Integration
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'telemetry_tick' && data.latest_metric) {
              setMetrics(prev => [...prev.slice(-59), {
                id: Date.now(),
                timestamp: data.timestamp,
                service: data.latest_metric.service,
                cpu: data.latest_metric.cpu,
                memory: data.latest_metric.memory,
                disk: data.latest_metric.disk,
                network: 25.0,
                latency: data.latest_metric.latency,
                availability: data.latest_metric.availability,
                error_rate: 0.01,
                throughput: 380.0,
                is_simulated: true
              }]);
            }
          } catch (err) {
            console.error('WS Parse Error', err);
          }
        };
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 5000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleNavigateToRCA = (incidentId: number) => {
    setCurrentView('rca');
  };

  const handleNavigateToRecovery = (incidentId: number) => {
    setCurrentView('recovery');
  };

  const handleNavigateToSandbox = (planId: number) => {
    setSelectedPlanForSandbox(planId);
    setCurrentView('sandbox');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar Navigation */}
      <Navigation
        currentView={currentView}
        onSelectView={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        openIncidentsCount={overview?.counts.open_incidents || 0}
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          onOpenFaultModal={() => setFaultModalOpen(true)}
          onOpenLogin={() => setLoginModalOpen(true)}
          onLogout={handleLogout}
          currentUser={currentUser}
          alerts={alerts}
          activeFault={overview?.active_fault || null}
          onRefresh={refreshAllData}
        />

        {/* View Content Body */}
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {currentView === 'dashboard' && (
            <CommandCenterView
              overview={overview}
              metrics={metrics}
              onNavigate={setCurrentView}
              onSimulateFault={() => setFaultModalOpen(true)}
            />
          )}

          {currentView === 'monitoring' && (
            <MonitoringView
              metrics={metrics}
              services={services}
              hostMetrics={overview?.host_metrics || {}}
            />
          )}

          {currentView === 'services' && (
            <ServiceInventoryView
              services={services}
              dependencies={dependencies}
              onRefresh={refreshAllData}
            />
          )}

          {currentView === 'anomalies' && (
            <AnomalyIntelligenceView
              anomalies={anomalies}
              onNavigateIncident={handleNavigateToRCA}
            />
          )}

          {currentView === 'predictions' && (
            <FailurePredictionView
              prediction={predictions.length > 0 ? predictions[0] : null}
              history={predictions}
            />
          )}

          {currentView === 'rca' && (
            <RootCauseAnalysisView
              incidents={incidents}
              onFormulatePlan={handleNavigateToRecovery}
            />
          )}

          {currentView === 'incidents' && (
            <IncidentManagementView
              incidents={incidents}
              onRefresh={refreshAllData}
              onFormulatePlan={handleNavigateToRecovery}
              onNavigateRCA={handleNavigateToRCA}
            />
          )}

          {currentView === 'recovery' && (
            <RecoveryIntelligenceView
              playbooks={playbooks}
              incidents={incidents}
              onRefresh={refreshAllData}
              onNavigateSandbox={handleNavigateToSandbox}
            />
          )}

          {currentView === 'sandbox' && (
            <RecoverySandboxView
              initialPlanId={selectedPlanForSandbox}
            />
          )}

          {currentView === 'verification' && (
            <RecoveryVerificationView />
          )}

          {currentView === 'alerts' && (
            <AlertsView
              alerts={alerts}
              onRefresh={refreshAllData}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'assistant' && (
            <AssistantView />
          )}

          {currentView === 'audit' && (
            <AuditLogsView />
          )}

          {currentView === 'admin' && (
            <AdministrationView
              onSimulateFault={() => setFaultModalOpen(true)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Fault Injection Chaos Modal */}
      <FaultModal
        isOpen={faultModalOpen}
        onClose={() => setFaultModalOpen(false)}
        activeFault={overview?.active_fault || null}
        onFaultUpdated={refreshAllData}
      />

      {/* Login Authentication Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshAllData();
        }}
      />
    </div>
  );
}

export default App;
