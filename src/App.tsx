/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  ChevronRight, 
  History, 
  Cpu, 
  User, 
  AlertCircle,
  CheckCircle2,
  Hash,
  Terminal
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Utils ---

/**
 * Generates all possible N-digit numbers (allowing repeated digits).
 */
function generateAllPossibilities(length: number): string[] {
  const possibilities: string[] = [];
  const max = Math.pow(10, length) - 1;
  for (let i = 0; i <= max; i++) {
    const s = i.toString().padStart(length, '0');
    possibilities.push(s);
  }
  return possibilities;
}

/**
 * Calculates Hits (A) and Blows (B) correctly even with repeated digits.
 */
function getScore(guess: string, target: string, length: number): { hits: number; blows: number } {
  let hits = 0;
  let blows = 0;
  const targetUsed = new Array(length).fill(false);
  const guessUsed = new Array(length).fill(false);

  // First pass: Count Hits (A)
  for (let i = 0; i < length; i++) {
    if (guess[i] === target[i]) {
      hits++;
      targetUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: Count Blows (B)
  for (let i = 0; i < length; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < length; j++) {
      if (!targetUsed[j] && guess[i] === target[j]) {
        blows++;
        targetUsed[j] = true;
        break;
      }
    }
  }

  return { hits, blows };
}

// --- Components ---

export default function App() {
  const [mode, setMode] = useState<'ai-guesses' | 'user-guesses' | null>(null);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'won'>('setup');
  const [digitLength, setDigitLength] = useState<number>(4);
  
  // AI Guesses Your Number state
  const [possibilities, setPossibilities] = useState<string[]>([]);
  const [aiGuess, setAiGuess] = useState<string>('');
  const [history, setHistory] = useState<{ guess: string; hits: number }[]>([]);
  const [possibilitiesHistory, setPossibilitiesHistory] = useState<string[][]>([]);
  
  // User Guesses AI Number state
  const [secretNumber, setSecretNumber] = useState<string>('');
  const [userGuess, setUserGuess] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize
  const resetGame = useCallback(() => {
    setMode(null);
    setGameState('setup');
    setPossibilities([]);
    setHistory([]);
    setPossibilitiesHistory([]);
    setUserGuess('');
    setError(null);
    setAiGuess('');
  }, []);

  const startGame = useCallback((selectedMode: 'ai-guesses' | 'user-guesses') => {
    setMode(selectedMode);
    setGameState('playing');
    setHistory([]);
    setPossibilitiesHistory([]);
    setAiGuess('');
    setUserGuess('');
    setError(null);
    
    const all = generateAllPossibilities(digitLength);
    
    if (selectedMode === 'ai-guesses') {
      setPossibilities(all);
    } else {
      setSecretNumber(all[Math.floor(Math.random() * all.length)]);
    }
  }, [digitLength]);

  // No longer need to call resetGame on mount as initial state is already correct

  const undoLastMove = useCallback(() => {
    if (history.length === 0 || possibilitiesHistory.length === 0) return;
    
    const [lastPossibilities, ...remainingPossibilitiesHistory] = possibilitiesHistory;
    const [lastHistoryEntry, ...remainingHistory] = history;
    
    setPossibilities(lastPossibilities);
    setPossibilitiesHistory(remainingPossibilitiesHistory);
    setHistory(remainingHistory);
    setAiGuess(lastHistoryEntry.guess);
    setError(null);
    setGameState('playing');
  }, [history, possibilitiesHistory]);

  // AI Logic: Make a guess
  const makeAiGuess = useCallback(() => {
    if (possibilities.length === 0) return;
    // Simple strategy: pick a random one from remaining possibilities
    // Or pick the first one. For simplicity, pick the first one.
    const nextGuess = possibilities[0];
    setAiGuess(nextGuess);
  }, [possibilities]);

  useEffect(() => {
    if (mode === 'ai-guesses' && gameState === 'playing' && history.length === 0) {
      makeAiGuess();
    }
  }, [mode, gameState, history, makeAiGuess]);

  const [isThinking, setIsThinking] = useState(false);

  // Handle user feedback for AI guess
  const handleAiFeedback = async (hits: number) => {
    setIsThinking(true);
    setError(null);
    
    // Small delay for "thinking" effect
    await new Promise(resolve => setTimeout(resolve, 600));

    const newPossibilities = possibilities.filter(p => {
      const score = getScore(aiGuess, p, digitLength);
      return score.hits === hits;
    });
    
    if (newPossibilities.length === 0) {
      setError("反馈不一致。没有符合条件的数字。请检查你的输入。");
      setIsThinking(false);
      return;
    }

    const newHistory = [{ guess: aiGuess, hits }, ...history];
    setHistory(newHistory);
    setPossibilitiesHistory([possibilities, ...possibilitiesHistory]);
    setPossibilities(newPossibilities);

    if (hits === digitLength) {
      setGameState('won');
    } else {
      // Pick next guess: for simplicity, pick the first one
      const nextGuess = newPossibilities[0];
      setAiGuess(nextGuess);
    }
    
    setIsThinking(false);
  };

  // Handle user's guess
  const handleUserGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (userGuess.length !== digitLength) {
      setError(`请输入 ${digitLength} 位数字。`);
      return;
    }
    setError(null);
    const { hits } = getScore(userGuess, secretNumber, digitLength);
    
    const newHistory = [{ guess: userGuess, hits }, ...history];
    setHistory(newHistory);
    setUserGuess('');

    if (hits === digitLength) {
      setGameState('won');
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">数字猜谜 AI</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">逻辑推理引擎 v1.0.4</p>
          </div>
        </div>
        {mode && (
          <div className="flex gap-2">
            {mode === 'ai-guesses' && history.length > 0 && gameState !== 'setup' && (
              <button 
                onClick={undoLastMove}
                className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors uppercase text-xs font-bold tracking-widest"
              >
                <RotateCcw className="w-4 h-4" />
                撤销
              </button>
            )}
            <button 
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors uppercase text-xs font-bold tracking-widest"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Mode Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-[#141414] p-6 bg-white/50 space-y-4">
            <h2 className="font-serif italic text-lg border-b border-[#141414] pb-2">配置</h2>
            
            {/* Digit Length Selection */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest opacity-50 font-mono">数字长度</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map(len => (
                  <button
                    key={len}
                    disabled={gameState !== 'setup'}
                    onClick={() => setDigitLength(len)}
                    className={cn(
                      "py-2 border border-[#141414] font-mono text-sm transition-all",
                      digitLength === len ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-white bg-white/30",
                      gameState !== 'setup' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-[10px] uppercase tracking-widest opacity-50 font-mono">操作模式</label>
              <button 
                onClick={() => startGame('ai-guesses')}
                className={cn(
                  "w-full flex items-center justify-between p-4 border border-[#141414] transition-all group",
                  mode === 'ai-guesses' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-white bg-white/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-tight">AI 猜你的数字</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", mode === 'ai-guesses' ? "translate-x-1" : "group-hover:translate-x-1")} />
              </button>
              <button 
                onClick={() => startGame('user-guesses')}
                className={cn(
                  "w-full flex items-center justify-between p-4 border border-[#141414] transition-all group",
                  mode === 'user-guesses' ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-white bg-white/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-tight">你猜 AI 的数字</span>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", mode === 'user-guesses' ? "translate-x-1" : "group-hover:translate-x-1")} />
              </button>
            </div>
          </div>

          {/* Stats / Info */}
          {mode && (
            <div className="border border-[#141414] p-6 bg-white/50 space-y-4 font-mono text-xs">
              <h2 className="font-serif italic text-lg border-b border-[#141414] pb-2 font-sans">系统状态</h2>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                  <span className="opacity-50 uppercase">可能性</span>
                  <span className="font-bold">{mode === 'ai-guesses' ? possibilities.length : '????'}</span>
                </div>
                <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                  <span className="opacity-50 uppercase">尝试次数</span>
                  <span className="font-bold">{history.length}</span>
                </div>
                <div className="flex justify-between border-b border-[#141414]/10 pb-1">
                  <span className="opacity-50 uppercase">游戏状态</span>
                  <span className={cn("font-bold uppercase", gameState === 'won' ? "text-green-600" : "text-blue-600")}>
                    {gameState === 'won' ? '胜利' : gameState === 'playing' ? '进行中' : '设置中'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-8 space-y-8">
          {!mode ? (
            <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-[#141414]/20 rounded-lg p-12 text-center space-y-6">
              <Hash className="w-16 h-16 opacity-20" />
              <div className="max-w-md">
                <h3 className="text-2xl font-serif italic mb-2">准备好开始了吗？</h3>
                <p className="text-sm opacity-60">在侧边栏配置数字长度并选择模式开始游戏。AI 使用逻辑排除算法，以最少的步数破解你的秘密数字。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Guess / Input */}
              <AnimatePresence mode="wait">
                {gameState === 'won' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-4 border-[#141414] p-12 bg-white text-center space-y-6"
                  >
                    <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
                    <div>
                      <h2 className="text-4xl font-serif italic font-bold">目标已破解！</h2>
                      <p className="text-sm uppercase tracking-widest opacity-50 mt-2">
                        在 {history.length} 次尝试中找到答案
                      </p>
                    </div>
                    <div className="text-6xl font-mono font-bold tracking-tighter">
                      {mode === 'ai-guesses' ? aiGuess : secretNumber}
                    </div>
                    <button 
                      onClick={resetGame}
                      className="px-8 py-3 bg-[#141414] text-[#E4E3E0] uppercase text-sm font-bold tracking-widest hover:scale-105 transition-transform"
                    >
                      新游戏
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key={mode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-[#141414] bg-white p-8 space-y-8"
                  >
                    {mode === 'ai-guesses' ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase opacity-50">
                          <Cpu className={cn("w-3 h-3", isThinking && "animate-pulse")} />
                          <span>{isThinking ? "逻辑处理中..." : "AI 假设已就绪："}</span>
                        </div>
                        <div className="flex justify-center gap-4 relative">
                          {isThinking && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                              <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                  <motion.div 
                                    key={i}
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                    className="w-2 h-2 bg-[#141414]"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {aiGuess.split('').map((digit, i) => (
                            <motion.div 
                              key={i}
                              initial={{ rotateX: 90 }}
                              animate={{ rotateX: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="w-20 h-28 border-2 border-[#141414] flex items-center justify-center text-5xl font-mono font-bold bg-[#E4E3E0]"
                            >
                              {digit}
                            </motion.div>
                          ))}
                        </div>
                        <div className="space-y-6">
                          <p className="text-center font-serif italic text-lg">请告诉我，有几个数字是完全猜对的？</p>
                          
                          <div className="flex justify-center">
                            <div className="grid grid-cols-3 gap-4 max-w-md w-full">
                              {Array.from({ length: digitLength + 1 }).map((_, n) => (
                                <button
                                  key={`hits-${n}`}
                                  disabled={isThinking}
                                  onClick={() => handleAiFeedback(n)}
                                  className="py-4 border-2 border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors font-mono font-bold text-2xl bg-white"
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase opacity-50">
                          <User className="w-3 h-3" />
                          <span>需要用户输入：</span>
                        </div>
                        <form onSubmit={handleUserGuess} className="space-y-6">
                          <div className="flex justify-center gap-4">
                            <input 
                              type="text"
                              maxLength={digitLength}
                              value={userGuess}
                              onChange={(e) => setUserGuess(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder={"0".repeat(digitLength)}
                              className="w-full max-w-xs text-center text-6xl font-mono font-bold tracking-tighter border-b-4 border-[#141414] focus:outline-none py-4"
                              autoFocus
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full py-4 bg-[#141414] text-[#E4E3E0] uppercase font-bold tracking-widest hover:bg-opacity-90 transition-colors"
                          >
                            提交猜测
                          </button>
                        </form>
                      </div>
                    )}
                    
                    {error && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History Table */}
              <div className="border border-[#141414] bg-white overflow-hidden">
                <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">操作日志</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#E4E3E0] border-b border-[#141414] text-[10px] uppercase font-mono tracking-widest">
                      <tr>
                        <th className="p-4 border-r border-[#141414]/10">尝试</th>
                        <th className="p-4 border-r border-[#141414]/10">猜测</th>
                        <th className="p-4 text-center">完全正确个数</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {history.map((entry, idx) => (
                        <tr key={idx} className="border-b border-[#141414]/10 hover:bg-[#E4E3E0]/50 transition-colors">
                          <td className="p-4 border-r border-[#141414]/10 opacity-50">#{history.length - idx}</td>
                          <td className="p-4 border-r border-[#141414]/10 font-bold tracking-widest">{entry.guess}</td>
                          <td className="p-4 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded-full border",
                              entry.hits === digitLength ? "bg-green-100 border-green-500 text-green-700" : "border-[#141414]/20"
                            )}>
                              {entry.hits}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-12 text-center opacity-30 italic font-serif">尚无记录...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#141414] p-8 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-center gap-4">
            <CheckCircle2 className="w-4 h-4 opacity-30" />
            <CheckCircle2 className="w-4 h-4 opacity-30" />
            <CheckCircle2 className="w-4 h-4 opacity-30" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">
            安全逻辑推理界面 // 仅限授权访问
          </p>
        </div>
      </footer>
    </div>
  );
}
