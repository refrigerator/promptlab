import React from 'react';

const OutputPanel: React.FC = () => {
  return (
    <div className="output-panel">
      <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>Output</h3>
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <div>Output panel</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>
          This panel will be used to render final outputs
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;