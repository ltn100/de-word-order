import './EnglishPrompt.css';

interface EnglishPromptProps {
  sentence: string;
  level?: string;
}

export function EnglishPrompt({ sentence, level }: EnglishPromptProps) {
  return (
    <div className="english-prompt">
      <div className="prompt-header">
        <span className="prompt-label">Translate:</span>
        {level && <span className="prompt-level">{level}</span>}
      </div>
      <span className="prompt-sentence">{sentence}</span>
    </div>
  );
}
