"use client";

import { useState, useEffect } from "react";
import { useQuiz } from "@/hooks/use-quiz";
import { StartScreen } from "./start-screen";
import { QuestionScreen } from "./question-screen";
import { ErrorScreen } from "./error-screen";
import { ResultScreen } from "./result-screen";
import { RankingScreen } from "./ranking-screen";

const BEST_SCORE_KEY = "price-guess:best";

type Screen = "start" | "playing" | "result" | "ranking";

export function Game() {
  const quiz = useQuiz();
  const [screen, setScreen] = useState<Screen>("start");
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [myNickname, setMyNickname] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    if (raw !== null) setBestScore(Number(raw));
  }, []);

  const startGame = async () => {
    setScreen("playing");
    await quiz.start();
  };

  const finishGame = () => {
    const score = quiz.correctCount;
    setFinalScore(score);
    if (bestScore === null || score > bestScore) {
      setBestScore(score);
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    }
    setScreen("result");
  };

  if (screen === "start") {
    return (
      <StartScreen
        bestScore={bestScore}
        onStart={startGame}
        onShowRanking={() => setScreen("ranking")}
      />
    );
  }

  if (screen === "playing") {
    if (quiz.status === "error") {
      return <ErrorScreen onRetry={() => quiz.retry()} />;
    }
    if (quiz.status === "idle" || quiz.status === "loading" || !quiz.question) {
      return (
        <div
          className="flex min-h-40 items-center justify-center p-6 text-muted-foreground"
          role="status"
        >
          불러오는 중…
        </div>
      );
    }
    return (
      <QuestionScreen
        question={quiz.question}
        status={quiz.status}
        questionNumber={quiz.questionNumber}
        total={quiz.total}
        correctCount={quiz.correctCount}
        isLast={quiz.isLastQuestion}
        selectedIndex={quiz.selectedIndex}
        onAnswer={quiz.answer}
        onNext={quiz.next}
        onFinish={finishGame}
      />
    );
  }

  if (screen === "result") {
    return (
      <ResultScreen
        finalScore={finalScore}
        total={quiz.total}
        onRegistered={(nickname) => {
          setMyNickname(nickname);
          setScreen("ranking");
        }}
        onRestart={startGame}
        onShowRanking={() => setScreen("ranking")}
      />
    );
  }

  if (screen === "ranking") {
    return <RankingScreen myNickname={myNickname} onRestart={startGame} />;
  }

  return null;
}
