"use client"

import React, { useEffect, useState, useRef } from "react";

export default function QuizExam({
  questions = [],
  timeLimit = 15 * 60, // seconds
  onSubmit = (res) => console.log("Quiz results", res),
  allowReview = true,
  shuffle = false,
}) {
  const [order, setOrder] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(timeLimit);
  const timerRef = useRef(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingList, setPendingList] = useState([]);

  useEffect(() => {
    if (questions && questions.length) {
      const idx = questions.map((_, i) => i);
      if (shuffle) {
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [idx[i], idx[j]] = [idx[j], idx[i]];
        }
      }
      setOrder(idx);
    }
  }, [questions, shuffle]);

  // Warn on reload/close and intercept browser back during an active exam
  useEffect(() => {
    if (!(started && !finished)) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Triggers native browser confirmation
    };

    const handlePopState = () => {
      setShowLeaveConfirm(true);
      history.pushState(null, "", location.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [started, finished]);

  useEffect(() => {
    if (started && timeLimit) {
      timerRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r === 1) {
            clearInterval(timerRef.current);
            handleFinish();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [started, timeLimit]);

  function startQuiz() {
    setStarted(true);
    setFinished(false);
    setRemaining(timeLimit);
  }

  function handleAnswerChange(qIndex, value) {
    const q = questions[qIndex];
    setAnswers((prev) => {
      const copy = { ...prev };
      if (q.type === "multiple") {
        const prevSet = new Set(copy[q.id] || []);
        if (prevSet.has(value)) prevSet.delete(value);
        else prevSet.add(value);
        copy[q.id] = Array.from(prevSet);
      } else if (q.type === "single") {
        copy[q.id] = value;
      } else {
        copy[q.id] = value; // text
      }
      return copy;
    });
  }

  function goTo(i) {
    if (i < 0 || i >= order.length) return;
    setCurrent(i);
  }

  function handleFinish() {
    clearInterval(timerRef.current);
    setFinished(true);
    setStarted(false);
    const result = gradeQuiz(questions, answers);
    onSubmit({ answers, result, submittedAt: new Date().toISOString() });
  }

  // Determine unanswered/pending questions
  function getPendingQuestions() {
    const pending = [];
    order.forEach((qi, i) => {
      const q = questions[qi];
      const u = answers[q.id];
      if (q.type === 'single') {
        if (u === undefined) pending.push(i + 1);
      } else if (q.type === 'multiple') {
        if (!Array.isArray(u) || u.length === 0) pending.push(i + 1);
      } else if (q.type === 'text') {
        if (typeof u !== 'string' || u.trim().length === 0) pending.push(i + 1);
      }
    });
    return pending;
  }

  function handleSubmitClick() {
    const pending = getPendingQuestions();
    if (pending.length > 0) {
      setPendingList(pending);
      setShowSubmitConfirm(true);
    } else {
      handleFinish();
    }
  }

  function gradeQuiz(qs, ans) {
    let score = 0;
    let maxScore = 0;
    const perQuestion = [];
    qs.forEach((q) => {
      const marks = q.marks || 1;
      maxScore += marks;
      let awarded = 0;
      const user = ans[q.id];
      if (q.type === "single") {
        if (user !== undefined && user === q.correct) awarded = marks;
      } else if (q.type === "multiple") {
        const correctSet = new Set(q.correct || []);
        const userSet = new Set(user || []);
        if (userSet.size === 0) awarded = 0;
        else {
          let right = 0;
          let wrong = 0;
          userSet.forEach((u) => (correctSet.has(u) ? right++ : wrong++));
          awarded = Math.max(0, (right - wrong) / correctSet.size) * marks;
        }
      } else if (q.type === "text") {
        if (typeof q.grader === "function") {
          awarded = q.grader(user) * marks;
        }
      }
      perQuestion.push({ id: q.id, awarded, marks });
      score += awarded;
    });
    return { score, maxScore, perQuestion };
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-xl mx-auto">
        <h3 className="text-lg font-semibold">No questions provided</h3>
        <p className="text-sm text-gray-500">Pass a `questions` prop to the component.</p>
      </div>
    );
  }

  const qIndex = order[current];
  const q = questions[qIndex];

  // small helper
  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className={`min-h-screen bg-gray-50 text-slate-900 ${started && !finished ? 'md:pl-72' : ''}`}>
      {started && !finished && (
        <aside className="hidden md:block fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-blue-700 to-blue-600 rounded-tr-xl rounded-br-xl text-white p-6 z-40 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-semibold">S</div>
            <div>
              <div className="font-semibold">Smart</div>
              <div className="text-xs opacity-80">Student</div>
            </div>
          </div>

          <div className="mb-3">
            <h3 className="text-sm font-semibold">Questions</h3>
            <p className="text-xs text-white/80">Jump to any question</p>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            {order.map((idx, i) => {
              const ans = answers[questions[idx].id];
              const hasAnswer = ans !== undefined && (Array.isArray(ans) ? ans.length > 0 : true);
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full h-10 px-3 rounded text-sm text-left border transition-colors ${
                    i === current
                      ? 'bg-transparent text-white border-white/70'
                      : hasAnswer
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'bg-white/10 text-white/90 hover:bg-white/20 border-white/20'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">G</div>
              <div className="text-sm">Grace</div>
            </div>
            <button className="w-full text-sm py-2 rounded bg-white/10 hover:bg-white/20">Log out</button>
          </div>
        </aside>
      )}

      {!finished && (
        <div
          className="fixed right-4 top-4 z-[50] rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg"
          aria-live="polite"
          aria-label="Time remaining"
          title="Time remaining"
        >
          {started ? fmt(remaining) : fmt(timeLimit)}
        </div>
      )}

      {started && !finished && (
        <div className="md:hidden sticky top-16 z-[45] bg-white/90 backdrop-blur border-b">
          <div className="flex gap-2 overflow-x-auto p-3">
            {order.map((idx, i) => {
              const ans = answers[questions[idx].id];
              const hasAnswer = ans !== undefined && (Array.isArray(ans) ? ans.length > 0 : true);
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`min-w-[44px] h-10 px-3 rounded text-sm flex items-center justify-center border transition-colors ${
                    i === current
                      ? 'bg-blue-600 text-white border-blue-600'
                      : hasAnswer
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        {!started && !finished && (
          <div className="sm:min-h-[80vh] flex flex-col items-center justify-center text-center">
            <div className="bg-white shadow-xl shadow-black-800 rounded-2xl p-6 sm:p-10 w-full">
              <h2 className="text-2xl font-bold mb-2">Ready to start the Exam?</h2>
              <p className="mb-1 text-sm text-slate-600">Questions: {questions.length}</p>
              <p className="text-sm text-slate-600">{timeLimit ? `Time: ${Math.floor(timeLimit/60)}m ${timeLimit%60}s` : ''}</p>
              <button className="px-8 sm:px-10 py-2 rounded border mt-3 bg-blue-700 text-white hover:bg-blue-800" onClick={startQuiz}>Start</button>
            </div>
          </div>
        )}

        {started && !finished && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <strong>Question {current + 1} / {questions.length}</strong>
              </div>
              <div className="text-sm text-slate-600" />
            </div>

            <div className="p-6 sm:p-8 border rounded-lg mb-6 shadow-sm bg-white">
              <h3 className="font-semibold text-xl sm:text-2xl leading-relaxed mb-4">{q.title}</h3>

              {q.type === 'single' && (
                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-4 border rounded-md hover:bg-gray-50 text-base sm:text-lg">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === i}
                        onChange={() => handleAnswerChange(qIndex, i)}
                        className="w-5 h-5"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multiple' && (
                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-4 border rounded-md hover:bg-gray-50 text-base sm:text-lg">
                      <input
                        type="checkbox"
                        checked={(answers[q.id] || []).includes(i)}
                        onChange={() => handleAnswerChange(qIndex, i)}
                        className="w-5 h-5"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <div>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                    rows={6}
                    className="w-full p-3 border rounded text-base"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-between items-stretch sm:items-center">
              <div className="flex gap-2">
                <button className="px-3 py-2 sm:py-1 rounded border bg-white text-slate-800 hover:bg-gray-50 disabled:opacity-50" onClick={() => goTo(current - 1)} disabled={current===0}>Prev</button>
                <button className="px-3 py-2 sm:py-1 rounded border bg-white text-slate-800 hover:bg-gray-50 disabled:opacity-50" onClick={() => goTo(current + 1)} disabled={current===order.length-1}>Next</button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitClick}
                  disabled={current !== order.length - 1}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {finished && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Results</h3>
          <p className="mb-4">You scored <strong>{gradeQuiz(questions, answers).score.toFixed(2)}</strong> out of {gradeQuiz(questions, answers).maxScore}</p>

            {allowReview && (
              <div className="space-y-4">
                {questions.map((qq, i) => {
                  const u = answers[qq.id];
                  const correct = qq.correct;
                  return (
                    <div key={qq.id} className="p-3 border rounded bg-white">
                      <div className="font-medium">{i+1}. {qq.title}</div>
                      {qq.type !== 'text' && (
                        <div className="mt-2">
                          <div className="text-sm">Your answer: {String(u)}</div>
                          <div className="text-sm">Correct: {String(correct)}</div>
                        </div>
                      )}
                      {qq.type === 'text' && (
                        <div className="mt-2">
                          <div className="text-sm">Your response:</div>
                          <pre className="whitespace-pre-wrap">{u}</pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Leave confirmation modal */}
      {showLeaveConfirm && started && !finished && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative z-[61] w-full max-w-md rounded-lg bg-white p-6 shadow-xl border">
            <h4 className="text-lg font-semibold text-center mb-3">Do you want to submit your exam?</h4>
            <p className="text-sm text-gray-600 text-center mb-6">You attempted to leave this page. Submitting will end your attempt.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Continue Exam
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800"
                onClick={handleFinish}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirmation modal (manual submit with pending) */}
      {showSubmitConfirm && started && !finished && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative z-[66] w-full max-w-md rounded-lg bg-white p-6 shadow-xl border">
            <h4 className="text-lg font-semibold text-center mb-3">You have unanswered questions</h4>
            <p className="text-sm text-slate-700 text-center mb-4">Pending questions: {pendingList.length}</p>
            {pendingList.length > 0 && (
              <div className="max-h-40 overflow-auto border rounded p-2 mb-5 text-sm text-slate-700">
                <div className="flex flex-wrap gap-2">
                  {pendingList.map((n) => (
                    <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded border bg-amber-50 text-amber-900 border-amber-200">{n}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Continue Exam
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800"
                onClick={handleFinish}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
