import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { ColorLegend } from './components/ColorLegend';
import { ThemeToggle } from './components/ThemeToggle';
import { sentenceService } from './services/SentenceService';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const [totalSentences, setTotalSentences] = useState(0);

  // Initialize theme on app load
  useTheme();

  useEffect(() => {
    const loadTotal = async () => {
      const sentences = await sentenceService.getSentences('A1.2');
      setTotalSentences(sentences.length);
    };
    loadTotal();
  }, []);

  return (
    <div className="app">
      <ThemeToggle />

      <header className="app-header">
        <h1>German Word Order Practice</h1>
        <p className="app-subtitle">Build sentences by arranging words in the correct order</p>
      </header>

      <main className="app-main">
        <GameBoard totalSentences={totalSentences} />
      </main>

      <ColorLegend />
    </div>
  );
}

export default App;
