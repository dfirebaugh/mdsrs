import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';

import './ConfigEditor.css';
import { LoadConfig, SaveConfig } from '../../wailsjs/go/main/App';

interface ConfigEditorProps {
  initialContent?: string;
  children?: React.ReactNode;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ children, initialContent }) => {
  const [content, setContent] = useState<string>(initialContent || "");

  useEffect(() => {
    LoadConfig().then(config => {
      setContent(JSON.stringify(config, null, 2));
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        console.log(JSON.parse(content))
        SaveConfig(content);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [content]);

  const onChange = React.useCallback((value: React.SetStateAction<string>, viewUpdate: any) => {
    setContent(value);
  }, []);

  return (
    <CodeMirror
      className="config-editor"
      value={content}
      width="100%"
      height="100%"
      theme={tokyoNight}
      extensions={[json()]}
      onChange={onChange}
    />
  );
};


export default ConfigEditor;
