// Canonical navigation tree for Help → Documentation (Settings > Workspace ...)

export type HelpNode = {
  title: string;
  href: string;            // absolute route, e.g. "/help/docs/settings/workspace"
  keywords?: string[];     // optional search terms
  children?: HelpNode[];
};

export const HELP_TREE: HelpNode[] = [
  {
    title: "Settings",
    href: "/help/docs/settings",
    children: [
      {
        title: "Workspace",
        href: "/help/docs/settings/workspace",
        keywords: ["organization", "org", "tenant", "account"],
        children: [
          {
            title: "Regions",
            href: "/help/docs/settings/workspace/regions",
            keywords: ["data residency", "US", "EU"]
          },
          {
            title: "Default Locale",
            href: "/help/docs/settings/workspace/locale",
            keywords: ["language", "date format", "number format"]
          },
          {
            title: "Primary Domain",
            href: "/help/docs/settings/workspace/domains",
            keywords: ["hostname", "custom domain", "dns"]
          },
          {
            title: "Members",
            href: "/help/docs/settings/workspace/members",
            keywords: ["users", "team", "access"],
            children: [
              {
                title: "Roles",
                href: "/help/docs/settings/workspace/members/roles",
                keywords: ["permissions", "admin", "viewer"]
              },
              {
                title: "Invitations",
                href: "/help/docs/settings/workspace/members/invitations",
                keywords: ["invite", "pending", "email"]
              }
            ]
          }
        ]
      },
      // add these when pages exist (safe to leave in or remove)
      { title: "Appearance", href: "/help/docs/settings/appearance", keywords: ["themes", "logo", "brand"] },
      { title: "Sidebar",    href: "/help/docs/settings/sidebar",    keywords: ["navigation", "groups", "shortcuts"] },
      { title: "Branding",   href: "/help/docs/settings/branding",   keywords: ["colors", "identity"] }
    ]
  }
];

/** Flatten the tree for search/autocomplete */
export type FlatItem = { title: string; href: string; keywords?: string[] };
export function makeFlatIndex(nodes: HelpNode[] = HELP_TREE): FlatItem[] {
  const out: FlatItem[] = [];
  const walk = (n: HelpNode) => {
    out.push({ title: n.title, href: n.href, keywords: n.keywords });
    n.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}
