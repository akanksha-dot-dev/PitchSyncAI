/**
 * PitchSync AI — Type Definitions
 * @module types
 */

export interface AccessibilityOptions {
  wheelchair: boolean;
  visualImpairment: boolean;
  hearingImpairment: boolean;
  lowSensory: boolean;
}

export interface DigitalTicket {
  id: string;
  competition: string;
  match: string;
  venue: string;
  date: string;
  time: string;
  gate: string;
  section: string;
  row: string;
  seat: string;
  barcode: string;
}

export interface UserProfile {
  name: string;
  accessibility: AccessibilityOptions;
  ticket: DigitalTicket | null;
  savedRoutes: string[];
}

export interface RouteStep {
  step: number;
  instruction: string;
  distance: string;
  time: string;
  accessible?: boolean;
  icon?: string;
}

export interface RoutePayload {
  type: 'route';
  accessible: boolean;
  steps: RouteStep[];
  totalTime: string;
  totalDistance: string;
}

export interface TransitSchedule {
  id: string;
  mode: 'metro' | 'bus' | 'shuttle' | 'rideshare';
  line: string;
  destination: string;
  departure: string;
  delay: number;
  accessible: boolean;
  capacity: number;
  surge?: boolean;
}

export interface TransitPayload {
  type: 'transit';
  schedules: TransitSchedule[];
}

export interface TicketPayload {
  type: 'ticket';
  ticket: DigitalTicket;
}

export type RichPayload = RoutePayload | TransitPayload | TicketPayload;

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  richData?: RichPayload;
  timestamp: number;
  intent?: string;
  confidence?: number;
  type?: 'text' | 'route' | 'transit' | 'ticket' | 'error' | 'disambiguation';
}

export interface CrowdZoneData {
  zoneId: string;
  zoneName: string;
  density: number;
  trend: 'rising' | 'falling' | 'stable';
  count: number;
  capacity: number;
  timestamp: number;
}

export interface OpsAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  zone: string;
  timestamp: number;
  resolved: boolean;
  acknowledged: boolean;
}

export interface ResourceAllocation {
  total: number;
  deployed: Record<string, number>;
}

export interface ResourceMap {
  security: ResourceAllocation;
  medical: ResourceAllocation;
  crowdControl: ResourceAllocation;
  accessibility: ResourceAllocation;
}

export interface AppState {
  appMode: 'fan' | 'ops';
  language: string;
  chatHistory: ChatMessage[];
  isTyping: boolean;
  quickReplies: string[];
  crowdData: Record<string, CrowdZoneData>;
  transitSchedules: TransitSchedule[];
  userProfile: UserProfile;
  opsAlerts: OpsAlert[];
  resources: ResourceMap;
  wizardOpen: boolean;
  wizardData: object | null;
  sidebarOpen: boolean;
  selectedZone: string | null;
  mapView: 'density' | 'wayfinding' | 'accessibility';
  isOnline: boolean;
  lastSync: number | null;
}

export interface ValidationCheckResult {
  accessibilityConflict: boolean;
  accessibilityDetail: string;
  transitConflict: boolean;
  estimatedFlow: number;
  transitCapacity: number;
  overallStatus: 'done' | 'warning' | 'error';
  density: number;
  zoneName: string;
}

export interface GenAIResponse {
  text: string;
  intent: string;
  confidence: number;
  type: string;
  richData?: RichPayload;
  contextUsage?: object;
}
