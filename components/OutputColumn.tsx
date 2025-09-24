'use client';

export default function OutputColumn() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Output</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This column is reserved for future output rendering features
        </p>
      </div>
      
      <div className="flex-1 p-4">
        <div className="text-center text-muted-foreground">
          <p>Output column coming soon...</p>
          <p className="text-sm mt-2">
            This will be where you can render and work with the final chat outputs
          </p>
        </div>
      </div>
    </div>
  );
}