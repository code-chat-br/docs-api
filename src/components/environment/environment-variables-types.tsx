import type { ReactNode } from 'react';

export type EnvironmentVariableType = 'string' | 'integer' | 'boolean' | 'number' | 'duration' | 'url' | 'json' | 'enum';

export type EnvironmentVariableValue = string | number | boolean;

export type EnvironmentDescriptionNode = string | { code: string };

export type EnvironmentDescriptionParagraph = readonly EnvironmentDescriptionNode[];

export type EnvironmentVariable = {
  name: string;
  slug: string;
  category: string;
  required: boolean;
  type: EnvironmentVariableType;
  defaultValue?: EnvironmentVariableValue;
  example?: EnvironmentVariableValue;
  description: readonly EnvironmentDescriptionParagraph[];
  allowedValues?: readonly EnvironmentVariableValue[];
  unit?: string;
};

export function environmentValueToString(value: EnvironmentVariableValue) {
  return String(value);
}

export function environmentDescriptionToText(description: readonly EnvironmentDescriptionParagraph[]) {
  return description
    .map((paragraph) => paragraph.map((node) => (typeof node === 'string' ? node : node.code)).join(''))
    .join(' ');
}

export function renderEnvironmentDescription(description: readonly EnvironmentDescriptionParagraph[]): ReactNode {
  return description.map((paragraph, paragraphIndex) => (
    <p key={paragraphIndex}>
      {paragraph.map((node, nodeIndex) =>
        typeof node === 'string' ? node : <code key={`${node.code}-${nodeIndex}`}>{node.code}</code>,
      )}
    </p>
  ));
}
