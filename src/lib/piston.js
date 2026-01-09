const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const PISTON_RUNTIMES_URL = 'https://emkc.org/api/v2/piston/runtimes';

export function normalizePistonLanguage(language) {
  const l = String(language || '').toLowerCase();
  if (l === 'c++') return 'cpp';
  if (l === 'c#') return 'csharp';
  if (l === 'js') return 'javascript';
  if (l === 'ts') return 'typescript';
  return l;
}

export async function getRuntimes() {
  const res = await fetch(PISTON_RUNTIMES_URL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Runtimes API error (${res.status}) ${msg}`.trim());
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function executeCode({ language, source, stdin, signal }) {
  const res = await fetch(PISTON_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language,
      source,
      stdin: stdin ?? '',
    }),
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Execution API error (${res.status}) ${msg}`.trim());
  }

  const data = await res.json();

  const run = data?.run || {};
  return {
    stdout: run.stdout || '',
    stderr: run.stderr || '',
    code: typeof run.code === 'number' ? run.code : 0,
  };
}
