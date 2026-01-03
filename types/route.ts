/* ---------------- Status ---------------- */

export type RouteStatus = 'draft' | 'active' | 'paused';

/* ---------------- Trigger ---------------- */

export type RouteTrigger = {
  type: 'event';
  eventKey: string; // e.g. contact.created
};

/* ---------------- Action ---------------- */

export type RouteAction = {
  id: string;
  type: 'action';
  label: string; // UI label (Send Email, Webhook, etc.)
};

/* ---------------- Graph ---------------- */

export type RouteGraph = {
  trigger?: RouteTrigger;
  actions: RouteAction[];
};

/* ---------------- Route (MAIN) ---------------- */

export type Route = {
  id: string;
  name: string;
  status: RouteStatus;

  graph: RouteGraph;

  createdAt: string;
  updatedAt: string;
};
