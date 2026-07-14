'use client';

import { Highlight, themes, type Language } from 'prism-react-renderer';
import { CopyButton } from './copy-button';

const languageMap: Record<string, Language> = {
  curl: 'bash',
  bash: 'bash',
  javascript: 'javascript',
  node: 'javascript',
  json: 'json',
  go: 'go',
  python: 'python',
  php: 'php',
  http: 'http',
};

export function CodeBlock({
  code,
  language = 'json',
  title,
  generated = false,
}: {
  code: string;
  language?: string;
  title?: string;
  generated?: boolean;
}) {
  return (
    <div className="code-block">
      <div className="code-block-toolbar">
        <span>{title || language}</span>
        {generated && <span className="generated-badge">gerado do schema</span>}
        <CopyButton value={code} />
      </div>
      <Highlight theme={themes.nightOwl} code={code.trimEnd()} language={languageMap[language.toLowerCase()] || 'text'}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={className} style={style} tabIndex={0}>
            {tokens.map((line, index) => (
              <div key={index} {...getLineProps({ line })}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
