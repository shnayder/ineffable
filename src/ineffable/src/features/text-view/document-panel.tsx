import React, { createElement, useState } from 'react';
import { Annotation, Element, ElementKind } from './types';
import { Id } from '@/utils/nanoid';
import { docModel, useCurrentVersion, useElement } from './document-model';

interface TextPanelProps {
  sliderValue: Exclude<ElementKind, 'document'>;
  onSelect: (id: Id) => void;
  selected: Id | null;
  sampleText: string;
}

const DocumentPanel: React.FC<TextPanelProps> = ({ sliderValue, onSelect, selected, sampleText }) => {
  const currentVersion = useCurrentVersion();
  const rootId = currentVersion.rootId;
  const root = useElement(rootId);

  const [editingId, setEditingId] = useState<Id | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const selectForEdit = (id: Id) => {
    onSelect(id);
    setEditingId(id);
    setEditingValue(docModel.getElement(id)?.contents ?? '');
  };

  const commitEdit = () => {
    if (!editingId) return;
    docModel.updateElement(editingId, editingValue);
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  React.useEffect(() => {
    docModel.updateElement(rootId, sampleText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActiveLevel = (level: ElementKind) => sliderValue === level;

  const getAnnotationCountElement = (id: Id) => {
    const annotations: Annotation[] = [];
    if (annotations.length > 0) {
      return (
        <span className="inline-flex items-center justify-center text-xs font-semibold rounded-md bg-secondary-bg text-secondary-fg border border-secondary-border w-4 h-4 ml-1">
          {annotations.length}
        </span>
      );
    }
    return null;
  };

  const getClassName = (kind: ElementKind, id: Id) => {
    if (kind === 'paragraph') {
      if (!isActiveLevel('paragraph')) return 'my-2 p-2';
      return `my-2 p-2 ${selected === id ? 'border-2 border-yellow-400 rounded' : 'border-l-2 odd:border-neutral-fg-accent1 even:border-neutral-fg-accent2'}`;
    }
    if (kind === 'sentence') {
      if (!isActiveLevel('sentence')) return '';
      return selected === id
        ? 'border-2 border-yellow-400 rounded'
        : 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2';
    }
    if (kind === 'word') {
      if (!isActiveLevel('word')) return '';
      return selected === id
        ? 'border-2 border-yellow-400 rounded'
        : 'odd:border-b-2 odd:border-neutral-fg-accent1 even:border-b-1 even:border-neutral-fg-accent2';
    }
    return '';
  };


  interface DocumentElementProps {
    id: Id;
  }
  

  const DocumentElement: React.FC<DocumentElementProps> = ({ id }) => {
    const el = useElement(id);
    const isEditing = editingId === id;
    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    };

    const clickToEdit = () => {
      if (isActiveLevel(el.kind)) {
        selectForEdit(id);
      } else {
        onSelect(id);
      }
    };

    if (isEditing) {
      return (
        <input
          autoFocus
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={handleKey}
          className="border border-surface-border-base rounded px-1 w-full"
        />
      );
    }

    if (el.kind === 'word') {
      return (
        <span id={id} className={getClassName('word', id)} onClick={clickToEdit}>
          {el.contents}
          {isActiveLevel('word') && getAnnotationCountElement(id)}
        </span>
      );
    }

    if (el.kind === 'sentence') {
      return (
        <span id={id} className={getClassName('sentence', id)} onClick={clickToEdit}>
          {el.childrenIds.map((cid, idx) => (
            <React.Fragment key={cid}>
              <DocumentElement id={cid} />
              {idx < el.childrenIds.length - 1 && ' '}
            </React.Fragment>
          ))}
          {isActiveLevel('sentence') && getAnnotationCountElement(id)}
        </span>
      );
    }

    // paragraph
    return (
      <p id={id} className={getClassName('paragraph', id)} onClick={clickToEdit}>
        {el.childrenIds.map((cid, idx) => (
          <React.Fragment key={cid}>
            <DocumentElement id={cid} />
            {idx < el.childrenIds.length - 1 && ' '}
          </React.Fragment>
        ))}
        {isActiveLevel('paragraph') && getAnnotationCountElement(id)}
      </p>
    );
  };

  return (
    <div className="w-full mb-4 min-h-[120px] max-w-prose">
      {root.childrenIds.map((cid) => (
        <DocumentElement key={cid} id={cid} />
      ))}
    </div>
  );
};

export default DocumentPanel;
