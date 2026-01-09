import React from 'react';

export default function FlipOutput({ open, output, meta, busy }) {
  return (
    <div className={"flipStage" + (open ? ' flipOpen' : '')} aria-hidden={!open}>
      <div className="flipMonitor">
        <div className="flipTop">
          <div className="flipTitle">OUTPUT</div>
          <div className={"flipMeta" + (busy ? ' flipMetaBusy' : '')}>{meta}</div>
        </div>
        <pre className="flipOutput">{output}</pre>
      </div>
    </div>
  );
}
