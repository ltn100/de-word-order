import { useEffect, useRef } from 'react';
import type { ContextMenuOption } from '../types';
import { getGenderColor } from '../utils/conjugationUtils';
import './ContextMenu.css';

interface ArticleMatrixProps {
  matrix: Record<'m' | 'f' | 'n', [string, string, string]>;
  onSelect: (value: string) => void;
  baseForm?: string;  // For predicate adjectives (after sein/werden)
}

interface SimpleListProps {
  forms: string[];
  onSelect: (value: string) => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
  articleMatrix?: ArticleMatrixProps;
  simpleList?: SimpleListProps;
  readOnly?: boolean;
}

export function ContextMenu({ x, y, options, onClose, articleMatrix, simpleList, readOnly = false }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const handleOptionClick = (option: ContextMenuOption) => {
    option.action();
    onClose();
  };

  const handleMatrixSelect = (value: string) => {
    if (articleMatrix) {
      articleMatrix.onSelect(value);
      onClose();
    }
  };

  const handleSimpleListSelect = (value: string) => {
    if (simpleList) {
      simpleList.onSelect(value);
      onClose();
    }
  };

  const genders: Array<'m' | 'f' | 'n'> = ['m', 'f', 'n'];

  return (
    <div
      ref={menuRef}
      className={`context-menu ${readOnly ? 'read-only' : ''}`}
      style={{ left: x, top: y }}
    >
      {simpleList ? (
        <div className="simple-list">
          {simpleList.forms.map((form, index) => (
            <button
              key={`form-${index}`}
              className="context-menu-item"
              onClick={() => !readOnly && handleSimpleListSelect(form)}
              disabled={readOnly}
            >
              {form}
            </button>
          ))}
        </div>
      ) : articleMatrix ? (
        <div className="article-matrix">
          {articleMatrix.baseForm && (
            <div className="article-matrix-row base-form-row">
              <button
                className="article-matrix-cell base-form-cell"
                onClick={() => !readOnly && handleMatrixSelect(articleMatrix.baseForm!)}
                disabled={readOnly}
              >
                {articleMatrix.baseForm}
              </button>
            </div>
          )}
          {genders.map((gender) => (
            <div
              key={gender}
              className="article-matrix-row"
              style={{ backgroundColor: getGenderColor(gender) }}
            >
              {articleMatrix.matrix[gender].map((form, index) => (
                <button
                  key={`${gender}-${index}`}
                  className="article-matrix-cell"
                  onClick={() => !readOnly && handleMatrixSelect(form)}
                  disabled={readOnly}
                >
                  {form}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            className={`context-menu-item ${option.color ? 'has-color' : ''}`}
            style={option.color ? { backgroundColor: option.color } : undefined}
            onClick={() => !readOnly && handleOptionClick(option)}
            disabled={readOnly}
          >
            {option.label}
          </button>
        ))
      )}
    </div>
  );
}
