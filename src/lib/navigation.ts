import { isValidElement, type ReactNode } from 'react';
import { source } from './source';

export type GuideNavigationItem = {
  title: string;
  href: string;
  description?: string;
};

export type GuideNavigationGroup = {
  title: string;
  items: GuideNavigationItem[];
};

export function toPlainText(value: ReactNode, fallback = ''): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map((item) => toPlainText(item)).join('');
  if (isValidElement<{ children?: ReactNode }>(value)) return toPlainText(value.props.children, fallback);
  return fallback;
}

export function getGuideNavigation(): GuideNavigationGroup[] {
  const groups: GuideNavigationGroup[] = [{ title: 'Visão geral', items: [] }];

  for (const node of source.getPageTree().children) {
    if (node.type === 'separator') {
      groups.push({ title: toPlainText(node.name, 'Guias'), items: [] });
      continue;
    }

    if (node.type === 'page') {
      groups.at(-1)!.items.push({
        title: toPlainText(node.name, node.url),
        href: node.url,
        description: toPlainText(node.description, ''),
      });
    }
  }

  return groups.filter((group) => group.items.length > 0);
}

export function getGuideNeighbours(href: string, groups = getGuideNavigation()) {
  const items = groups.flatMap((group) => group.items);
  const index = items.findIndex((item) => item.href === href);
  if (index < 0) return {};
  return { previous: items[index - 1], next: items[index + 1] };
}
