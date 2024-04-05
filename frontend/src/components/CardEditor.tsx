import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';

import './CardEditor.css';

interface CardEditorProps {
  initialContent?: string;
  onSave?: (newContent: string) => void;
  children?: React.ReactNode;
}

const CardEditor: React.FC<CardEditorProps> = ({ children, initialContent, onSave }) => {
  const [content, setContent] = useState<string>(initialContent || "");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        console.log(content)
        if (onSave) onSave(content);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [content]);

  const onChange = React.useCallback((value: React.SetStateAction<string>, viewUpdate: any) => {
    console.log("value:", value);
    setContent(value);
  }, []);

  return (
    <CodeMirror
      className="card-editor"
      value={content}
      width="100%"
      height="100%"
      theme={tokyoNight}
      extensions={[markdown()]}
      onChange={onChange}
    />
  );
};

export default CardEditor;
