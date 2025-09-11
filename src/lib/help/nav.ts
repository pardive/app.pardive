export type DocItem = { title: string; href: string };
export type DocSection = { label: string; items: DocItem[] };

export const HELP_SECTIONS: DocSection[] = [
  {
    label: 'Getting started',
    items: [
      { title: 'Overview',     href: '/help/getting-started' },
      { title: 'Installation', href: '/help/installation' },
      { title: 'Usage',        href: '/help/usage' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Troubleshooting', href: '/help/troubleshooting' },
      { title: 'FAQs',            href: '/help/faqs' },
      { title: 'Support',         href: '/help/support' },
    ],
  },
];
