import React, { useEffect, useMemo, useState } from 'react';
import MatrixBackground from './components/MatrixBackground.jsx';
import Terminal from './components/Terminal.jsx';

import pythonLocked from '../(Garcia) Python work?raw';
import javaLocked from '../(Garcia) Java work?raw';
import cppLocked from '../(Garcia) C++ Work?raw';

function loadInitialText(key, fallback) {
  try {
    const existing = localStorage.getItem(key);
    if (existing !== null) return existing;
  } catch {
    // ignore
  }
  return fallback;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('python');

  const [userLanguage, setUserLanguage] = useState('javascript');
  const [userCode, setUserCode] = useState(() => loadInitialText('ctc_user_code', ''));

  useEffect(() => {
    try {
      localStorage.setItem('ctc_user_code', userCode);
    } catch {
      // ignore
    }
  }, [userCode]);

  const footerLinks = useMemo(
    () => ({
      linkedin: 'https://www.linkedin.com/in/maximiliano-garcia642/',
      projects: 'https://maxgarcia642.github.io/',
    }),
    []
  );

  const matrixSeed = useMemo(() => {
    if (activeTab === 'python') return pythonLocked;
    if (activeTab === 'java') return javaLocked;
    if (activeTab === 'cpp') return cppLocked;
    return userCode;
  }, [activeTab, userCode]);

  return (
    <div className="appRoot">
      <MatrixBackground seedText={matrixSeed} />

      <div className="content">
        <header className="topBar">
          <div className="brand">
            <div className="brandTitle">Coding Terminal Collective</div>
            <div className="brandSubtitle">Interactive code terminal showcase</div>
          </div>
        </header>

        <main className="main">
          <Terminal
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            userLanguage={userLanguage}
            onChangeUserLanguage={setUserLanguage}
            userCode={userCode}
            onChangeUserCode={setUserCode}
          />
        </main>

        <footer className="footer">
          <div className="footerText">
            Any bugs you noticed when executing your code from which ever language you choose?{' '}
            <a className="link" href={footerLinks.linkedin} target="_blank" rel="noreferrer">
              Contact and Connect with Maximiliano Garcia
            </a>
            {' '}and feel free to check out my other{' '}
            <a className="link" href={footerLinks.projects} target="_blank" rel="noreferrer">
              projects
            </a>
            .
          </div>
        </footer>
      </div>
    </div>
  );
}
