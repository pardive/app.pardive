import type { MDXComponents } from 'mdx/types';

/**
 * MDX components mapping for Next.js App Router (RSC-safe).
 * Having this file present prevents Next from importing `@mdx-js/react`,
 * which avoids the "createContext only works in Client Components" error.
 *
 * Add custom shortcodes here later if you like (h1, code, a, etc).
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // Example:
    // h1: (props) => <h1 className="text-2xl font-semibold" {...props} />,
  };
}
