import { DocumentationShell } from '@/components/layout/documentation-shell';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { getGuideNavigation } from '@/lib/navigation';

export default async function ApiReferenceLayout({ children }: LayoutProps<'/api-reference'>) {
  const { spec, webhooks } = await loadApiReference();
  return (
    <DocumentationShell spec={spec} webhooks={webhooks} guideNavigation={getGuideNavigation()}>
      {children}
    </DocumentationShell>
  );
}
