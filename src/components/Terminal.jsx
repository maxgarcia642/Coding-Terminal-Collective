import React, { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import FlipOutput from './FlipOutput.jsx';
import { executeCode, getRuntimes, normalizePistonLanguage } from '../lib/piston.js';

import pythonLocked from '../../(Garcia) Python work?raw';
import javaLocked from '../../(Garcia) Java work?raw';
import cppLocked from '../../(Garcia) C++ Work?raw';

function stripBOM(text) {
  if (text && text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

const TAB_ORDER = [
  { id: 'python', label: 'PYTHON (LOCKED)' },
  { id: 'java', label: 'JAVA (LOCKED)' },
  { id: 'cpp', label: 'C++ (LOCKED + CALC SUITE)' },
  { id: 'user', label: 'USER (EDIT + RUN)' },
];

const DEFAULT_LANG_OPTIONS = [
  { id: 'javascript', label: 'javascript' },
  { id: 'python', label: 'python' },
  { id: 'java', label: 'java' },
  { id: 'cpp', label: 'cpp' },
  { id: 'typescript', label: 'typescript' },
];

function defaultStdinForTab(tab) {
  if (tab === 'python') {
    return '7\n1\nADD\n2\n\n0\n';
  }
  if (tab === 'java') {
    return '6\n\n0\n';
  }
  if (tab === 'cpp') {
    return '1\n10\n50\n3\n';
  }
  return '';
}

function loadStdin(tab) {
  try {
    const existing = localStorage.getItem(`ctc_stdin_${tab}`);
    if (existing !== null) return existing;
  } catch {
    // ignore
  }
  return defaultStdinForTab(tab);
}

export default function Terminal({
  activeTab,
  onChangeTab,
  userLanguage,
  onChangeUserLanguage,
  userCode,
  onChangeUserCode,
}) {
  const pythonCode = useMemo(() => stripBOM(pythonLocked), []);
  const javaCode = useMemo(() => stripBOM(javaLocked), []);
  const cppCode = useMemo(() => stripBOM(cppLocked), []);

  const [loadingRuntimes, setLoadingRuntimes] = useState(false);
  const [runtimeError, setRuntimeError] = useState('');
  const [runtimeOptions, setRuntimeOptions] = useState(DEFAULT_LANG_OPTIONS);

  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [outputMeta, setOutputMeta] = useState('');
  const [flipOpen, setFlipOpen] = useState(false);

  const [stdinMap, setStdinMap] = useState(() => ({
    python: loadStdin('python'),
    java: loadStdin('java'),
    cpp: loadStdin('cpp'),
    user: loadStdin('user'),
  }));

  const abortRef = useRef(null);

  const readOnly = activeTab !== 'user';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingRuntimes(true);
      setRuntimeError('');
      try {
        const runtimes = await getRuntimes();
        const byLang = new Map();
        for (const r of runtimes || []) {
          if (!r || !r.language) continue;
          if (!byLang.has(r.language)) byLang.set(r.language, true);
        }
        const options = Array.from(byLang.keys())
          .map((lang) => ({ id: lang, label: lang }))
          .sort((a, b) => a.label.localeCompare(b.label));
        if (!mounted) return;
        setRuntimeOptions(options.length ? options : DEFAULT_LANG_OPTIONS);
      } catch (e) {
        if (!mounted) return;
        setRuntimeError(e instanceof Error ? e.message : String(e));
        setRuntimeOptions(DEFAULT_LANG_OPTIONS);
      } finally {
        if (mounted) setLoadingRuntimes(false);
      }
    };

    if (activeTab === 'user') load();

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const editorValue = useMemo(() => {
    if (activeTab === 'python') return pythonCode;
    if (activeTab === 'java') return javaCode;
    if (activeTab === 'cpp') return cppCode;
    return userCode;
  }, [activeTab, pythonCode, javaCode, cppCode, userCode]);

  const editorExtensions = useMemo(() => {
    if (activeTab === 'python') return [python()];
    if (activeTab === 'java') return [java()];
    if (activeTab === 'cpp') return [cpp()];
    return [];
  }, [activeTab]);

  const effectiveLanguage = useMemo(() => {
    if (activeTab === 'python') return 'python';
    if (activeTab === 'java') return 'java';
    if (activeTab === 'cpp') return 'cpp';
    return userLanguage;
  }, [activeTab, userLanguage]);

  const onUpload = async (file) => {
    const text = await file.text();
    onChangeUserCode(text);
  };

  useEffect(() => {
    try {
      for (const [k, v] of Object.entries(stdinMap)) {
        localStorage.setItem(`ctc_stdin_${k}`, v ?? '');
      }
    } catch {
      // ignore
    }
  }, [stdinMap]);

  const onClickExecute = async () => {
    setOutput('');
    setOutputMeta('');
    setFlipOpen(true);
    setIsExecuting(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const language = normalizePistonLanguage(effectiveLanguage);
    const stdin = stdinMap[activeTab] ?? '';

    try {
      const result = await executeCode({
        language,
        source: editorValue,
        stdin,
        signal: controller.signal,
      });

      const out = [result.stdout, result.stderr].filter(Boolean).join('\n');
      setOutput(out || '(no output)');
      setOutputMeta(`Language: ${language} | Exit: ${result.code}`);
    } catch (e) {
      setOutput(e instanceof Error ? e.message : String(e));
      setOutputMeta('Execution failed');
    } finally {
      setIsExecuting(false);
      window.setTimeout(() => {
        setFlipOpen(false);
      }, 1400);
    }
  };

  return (
    <div className="terminalStage">
      <FlipOutput open={flipOpen} output={output} meta={outputMeta} busy={isExecuting} />

      <div className="triangleShell">
        <div className="terminalHeader">
          <div className="tabs">
            {TAB_ORDER.map((t) => (
              <button
                key={t.id}
                type="button"
                className={"tab" + (activeTab === t.id ? ' tabActive' : '')}
                onClick={() => onChangeTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="actions">
            {activeTab === 'user' ? (
              <div className="userControls">
                <label className="selectWrap">
                  <span className="selectLabel">LANG</span>
                  <select
                    className="select"
                    value={userLanguage}
                    onChange={(e) => onChangeUserLanguage(e.target.value)}
                  >
                    {runtimeOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="uploadBtn">
                  UPLOAD
                  <input
                    type="file"
                    className="uploadInput"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="lockedTag">READ ONLY</div>
            )}

            <button
              type="button"
              className={"executeBtn" + (isExecuting ? ' executeBusy' : '')}
              onClick={onClickExecute}
              disabled={isExecuting || (activeTab === 'user' && loadingRuntimes)}
            >
              {isExecuting ? 'EXECUTING…' : 'EXECUTE'}
            </button>
          </div>
        </div>

        <div className="triangleBody" role="region" aria-label="Terminal code editor">
          <div className="triangleInner">
            <div className="statusLine">
              {readOnly ? (
                <span className="status">Locked source loaded from repository</span>
              ) : (
                <span className={"status" + (runtimeError ? ' statusError' : '')}>
                  {runtimeError
                    ? runtimeError
                    : loadingRuntimes
                      ? 'Loading languages…'
                      : 'Paste, upload, edit, then execute'}
                </span>
              )}
            </div>

            <div className="editorWrap">
              <CodeMirror
                value={editorValue}
                height="420px"
                theme={oneDark}
                extensions={editorExtensions}
                editable={!readOnly}
                onChange={(val) => {
                  if (activeTab === 'user') onChangeUserCode(val);
                }}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  foldGutter: true,
                }}
              />
            </div>

            <div className="stdinWrap">
              <div className="stdinHeader">
                <div className="stdinTitle">INPUT (STDIN)</div>
                <div className="stdinHint">Used by menu-driven programs (choices, values, Enter prompts)</div>
              </div>
              <textarea
                className="stdinArea"
                value={stdinMap[activeTab] ?? ''}
                onChange={(e) => {
                  const next = e.target.value;
                  setStdinMap((prev) => ({ ...prev, [activeTab]: next }));
                }}
                placeholder="Type input that the program will read from stdin…"
              />
            </div>
          </div>
        </div>

        <div className="triangleGlow" aria-hidden="true" />
      </div>
    </div>
  );
}
