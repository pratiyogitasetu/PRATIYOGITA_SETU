import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLayout } from "../contexts/LayoutContext";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import {
  Play,
  Clock,
  Trophy,
  CheckCircle,
  X,
  ChevronRight,
  SkipForward,
  AlertCircle,
  LogIn,
  StopCircle,
  RefreshCw,
} from "lucide-react";
import apiService from "../services/api";

const QuizSection = () => {
  const { theme } = useTheme();
  const { contentOffsetLeft, isMobile } = useLayout();
  const { currentUser, saveQuizResult } = useAuth();
  const { trackInteraction } = useDashboard();

  // Quiz states
  const [selectedExam, setSelectedExam] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [skippedQuestions, setSkippedQuestions] = useState(new Set());
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [error, setError] = useState("");
  const [quizResults, setQuizResults] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [availableExams, setAvailableExams] = useState([]);
  const [expandedWrongExplanations, setExpandedWrongExplanations] = useState({});
  const [aiWrongExplanations, setAiWrongExplanations] = useState({});
  const [loadingWrongExplanations, setLoadingWrongExplanations] = useState({});
  const [wrongExplanationErrors, setWrongExplanationErrors] = useState({});

  const normalizeExamId = (name) =>
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");

  const getQuizQuestionKey = (question, index = 0) => {
    if (question?.id !== undefined && question?.id !== null && String(question.id).trim() !== "") {
      return String(question.id);
    }

    const exam = question?.exam_name || selectedExam?.name || "unknown_exam";
    const subject = question?.subject || question?.metadata?.subject || "unknown_subject";
    const year = question?.year || question?.metadata?.year || question?.metadata?.exam_year || "unknown_year";
    const term = question?.term || question?.metadata?.term || question?.metadata?.exam_term || "unknown_term";
    const questionText = (question?.question || "").trim().slice(0, 80);

    return [exam, subject, year, term, questionText || `fallback_${index}`]
      .map((part) => String(part).toLowerCase().replace(/\s+/g, "_"))
      .join("__");
  };

  const getExamIcon = (examName) => {
    const value = String(examName || "").toLowerCase();
    if (value.includes("civil") || value.includes("upsc")) return "🏛️";
    if (value.includes("bank")) return "🏦";
    if (value.includes("school") || value.includes("board")) return "🏫";
    if (value.includes("defence") || value.includes("cds") || value.includes("capf")) return "🛡️";
    if (value.includes("ssc")) return "📄";
    if (value.includes("rail")) return "🚆";
    return "📝";
  };

  useEffect(() => {
    let cancelled = false;
    let idleHandle = null;
    let timeoutHandle = null;

    const loadQuizExams = async () => {
      setIsLoadingExams(true);
      try {
        const response = await apiService.getPyqFilters();
        if (cancelled) return;
        const exams = Array.isArray(response?.exams) ? response.exams : [];

        const mapped = exams
          .filter((name) => String(name || "").trim().length > 0)
          .map((name) => ({
            id: normalizeExamId(name),
            name,
            description: "Questions available in PYQ database",
            icon: getExamIcon(name),
          }));

        setAvailableExams(mapped);
      } catch (err) {
        console.error("Failed to load quiz exam list:", err);
        if (!cancelled) setAvailableExams([]);
      } finally {
        if (!cancelled) setIsLoadingExams(false);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => {
        loadQuizExams();
      }, { timeout: 1200 });
    } else {
      timeoutHandle = window.setTimeout(() => {
        loadQuizExams();
      }, 250);
    }

    return () => {
      cancelled = true;
      if (idleHandle && "cancelIdleCallback" in window) window.cancelIdleCallback(idleHandle);
      if (timeoutHandle) window.clearTimeout(timeoutHandle);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (quizStarted && !quizCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, quizCompleted, timeRemaining]);

  const startQuiz = async (exam) => {
    setIsLoading(true);
    setError("");
    setSelectedExam(exam);

    try {
      // Fetch 15 random questions from the selected exam
      const response = await apiService.searchPyqQuestions({
        query: "",
        exam: exam.name,
        subject: null,
        year: null,
        limit: 30, // Fetch more to shuffle and select 15
      });

      if (response && response.questions && response.questions.length > 0) {
        // Shuffle and take 15 questions
        const shuffled = [...response.questions].sort(
          () => Math.random() - 0.5,
        );
        const selected = shuffled.slice(0, 15);

        setQuizQuestions(selected);
        setQuizStarted(true);
        setQuizStartTime(new Date());
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setSkippedQuestions(new Set());
        setTimeRemaining(15 * 60); // 15 minutes
        setQuizCompleted(false);
      } else {
        setError("No questions available for this exam. Please try another.");
      }
    } catch (err) {
      console.error("Failed to load quiz questions:", err);
      setError("Failed to load quiz questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const questionKey = getQuizQuestionKey(currentQuestion, currentQuestionIndex);
    setUserAnswers((prev) => ({
      ...prev,
      [questionKey]: answerIndex,
    }));

    const isCorrect = answerIndex === currentQuestion.correct_answer;
    if (!isCorrect) {
      const wrongItem = {
        questionId: questionKey,
        question: currentQuestion.question,
        options: currentQuestion.options,
        userAnswer: answerIndex,
        correctAnswer: currentQuestion.correct_answer,
        correctOption: currentQuestion.correct_option,
        correctAnswerText:
          currentQuestion.correct_answer_text ||
          (Array.isArray(currentQuestion.options) && currentQuestion.correct_answer >= 0
            ? currentQuestion.options[currentQuestion.correct_answer]
            : ""),
        subject: currentQuestion.subject || currentQuestion.metadata?.subject || "General",
        examName: currentQuestion.exam_name || selectedExam?.name,
        explanation: currentQuestion.explanation || "",
      };
      void fetchWrongAnswerExplanation(questionKey, wrongItem);
    }
  };

  const handleSkipQuestion = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const questionKey = getQuizQuestionKey(currentQuestion, currentQuestionIndex);
    setSkippedQuestions((prev) => new Set([...prev, questionKey]));
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Auto-submit if on last question
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    // Calculate results
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const wrongAnswers = [];

    quizQuestions.forEach((question, index) => {
      const questionKey = getQuizQuestionKey(question, index);
      const userAnswer = userAnswers[questionKey];

      if (userAnswer === undefined || skippedQuestions.has(questionKey)) {
        skipped++;
      } else if (userAnswer === question.correct_answer) {
        correct++;

        // Track correct answer
        if (currentUser) {
          trackInteraction("mcq_correct", {
            questionId: questionKey,
            subject: question.subject || "General",
            exam: question.exam_name || selectedExam.name,
            selectedOption: userAnswer,
            correctOption: question.correct_answer,
          });
        }
      } else {
        wrong++;
        wrongAnswers.push({
          questionId: questionKey,
          questionNumber: index + 1,
          question: question.question,
          options: question.options,
          userAnswer: userAnswer,
          correctAnswer: question.correct_answer,
          correctOption: question.correct_option,
          correctAnswerText: question.correct_answer_text || (Array.isArray(question.options) && question.correct_answer >= 0 ? question.options[question.correct_answer] : ''),
          subject: question.subject || question.metadata?.subject || 'General',
          examName: question.exam_name || selectedExam.name,
          explanation: question.explanation || "No explanation available.",
        });

        // Track wrong answer
        if (currentUser) {
          trackInteraction("mcq_wrong", {
            questionId: questionKey,
            subject: question.subject || "General",
            exam: question.exam_name || selectedExam.name,
            selectedOption: userAnswer,
            correctOption: question.correct_answer,
          });
        }
      }
    });

    const score = ((correct / quizQuestions.length) * 100).toFixed(2);
    const timeTaken = 15 * 60 - timeRemaining;

    const results = {
      examName: selectedExam.name,
      examId: selectedExam.id,
      totalQuestions: quizQuestions.length,
      correct,
      wrong,
      skipped,
      score,
      timeTaken,
      wrongAnswers,
      completedAt: new Date(),
      startedAt: quizStartTime,
    };

    setQuizResults(results);
    setQuizCompleted(true);
    setQuizStarted(false);

    // Save quiz result if user is logged in
    if (currentUser) {
      try {
        await saveQuizResult({
          examName: selectedExam.name,
          examId: selectedExam.id,
          totalQuestions: quizQuestions.length,
          correct,
          wrong,
          skipped,
          score: parseFloat(score),
          timeTaken,
          startedAt: quizStartTime,
        });
        console.log("✅ Quiz result saved successfully");
      } catch (error) {
        console.error("Failed to save quiz result:", error);
      }
    } else {
      // Show login prompt after a short delay
      setTimeout(() => {
        setShowLoginPrompt(true);
      }, 2000);
    }
  };

  const handleEndTest = () => {
    if (
      window.confirm(
        "Are you sure you want to end the test? All unanswered questions will be marked as skipped.",
      )
    ) {
      handleSubmitQuiz();
    }
  };

  const handleRestartQuiz = () => {
    setQuizCompleted(false);
    setQuizResults(null);
    setSelectedExam(null);
    setQuizQuestions([]);
    setExpandedWrongExplanations({});
    setAiWrongExplanations({});
    setLoadingWrongExplanations({});
    setWrongExplanationErrors({});
  };

  const fetchWrongAnswerExplanation = async (key, item) => {
    if (aiWrongExplanations[key] || loadingWrongExplanations[key]) return;

    setLoadingWrongExplanations((prev) => ({ ...prev, [key]: true }));
    setWrongExplanationErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const response = await apiService.generatePyqExplanation({
        question: item.question,
        options: item.options || [],
        correct_answer: item.correctAnswer,
        correct_option: item.correctOption,
        correct_answer_text: item.correctAnswerText,
        subject: item.subject,
        exam_name: item.examName,
        existing_explanation: item.explanation || "",
      });

      const explanation = (response?.explanation || "").trim() || (item.explanation || "").trim();
      if (explanation) {
        setAiWrongExplanations((prev) => ({ ...prev, [key]: explanation }));
      } else {
        setWrongExplanationErrors((prev) => ({ ...prev, [key]: "Unable to generate explanation right now." }));
      }
    } catch (error) {
      console.error("Failed to generate wrong-answer explanation:", error);
      if ((item.explanation || "").trim()) {
        setAiWrongExplanations((prev) => ({ ...prev, [key]: item.explanation.trim() }));
      } else {
        setWrongExplanationErrors((prev) => ({ ...prev, [key]: "Unable to generate explanation right now." }));
      }
    } finally {
      setLoadingWrongExplanations((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleWrongExplanation = (key, item) => {
    const willOpen = !expandedWrongExplanations[key];
    setExpandedWrongExplanations((prev) => ({ ...prev, [key]: willOpen }));
    if (willOpen) {
      void fetchWrongAnswerExplanation(key, item);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeTaken = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Results Screen
  if (quizCompleted && quizResults) {
    return (
      <div
        className="flex-1 mr-0 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2"
        style={{
          marginLeft: `${contentOffsetLeft}px`,
          width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
        }}
      >
        <div className="flex-1 bg-white border border-gray-400 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {/* Results Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex-shrink-0">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
                    Quiz Results
                  </h1>
                  <p className="text-gray-600 mt-1">{selectedExam?.name}</p>
                </div>
                <button
                  onClick={handleRestartQuiz}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Another Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="max-w-none mx-0 md:max-w-4xl md:mx-auto space-y-6">
              {/* Login Prompt Banner */}
              {!currentUser && showLoginPrompt && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <LogIn className="w-10 h-10" />
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          Save Your Progress!
                        </h3>
                        <p className="text-blue-100">
                          Login to save your quiz results and track your progress over time.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          // Trigger login - dispatch event to open auth modal
                          const event = new CustomEvent("openAuthModal", {
                            detail: { mode: "login" },
                          });
                          window.dispatchEvent(event);
                        }}
                        className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                      >
                        Login Now
                      </button>
                      <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center mb-6">
                  <div
                    className="text-5xl font-bold mb-2"
                    style={{ color: theme.colors.primary }}
                  >
                    {quizResults.score}%
                  </div>
                  <p className="text-gray-600">Your Score</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {quizResults.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {quizResults.correct}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {quizResults.wrong}
                    </div>
                    <div className="text-sm text-gray-600">Wrong</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {quizResults.skipped}
                    </div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                  <p className="text-sm text-gray-600">
                    Time Taken:{" "}
                    <span className="font-medium">
                      {formatTimeTaken(quizResults.timeTaken)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Wrong Answers Section */}
              {quizResults.wrongAnswers.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
                    Review Wrong Answers ({quizResults.wrongAnswers.length})
                  </h2>

                  <div className="space-y-4">
                    {quizResults.wrongAnswers.map((item, index) => {
                      const wrongKey = String(item.questionId || `${item.questionNumber}-${index}`);
                      return (
                      <div
                        key={index}
                        className="bg-red-50 border border-red-200 rounded-lg p-5"
                      >
                        <div className="mb-3">
                          <span className="text-sm font-medium text-red-600">
                            Question {item.questionNumber}
                          </span>
                          <h3 className="text-base font-medium text-gray-900 mt-1">
                            {item.question}
                          </h3>
                        </div>

                        <div className="space-y-2 mb-4">
                          {item.options?.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border-2 ${
                                optIndex === item.correctAnswer
                                  ? "border-green-500 bg-green-50"
                                  : optIndex === item.userAnswer
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-900">
                                  {option}
                                </span>
                                {optIndex === item.correctAnswer && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                                {optIndex === item.userAnswer &&
                                  optIndex !== item.correctAnswer && (
                                    <X className="w-5 h-5 text-red-600" />
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <button
                            onClick={() => toggleWrongExplanation(wrongKey, item)}
                            className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                          >
                            {expandedWrongExplanations[wrongKey] ? 'Hide Explanation' : 'Show Explanation'}
                          </button>

                          {expandedWrongExplanations[wrongKey] && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                              {loadingWrongExplanations[wrongKey] ? (
                                <div className="flex items-center gap-2 text-blue-900">
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <p className="text-sm">Generating AI explanation...</p>
                                </div>
                              ) : wrongExplanationErrors[wrongKey] ? (
                                <p className="text-sm text-red-600">{wrongExplanationErrors[wrongKey]}</p>
                              ) : (
                                <p className="text-sm text-blue-900">
                                  <strong>Explanation:</strong> {aiWrongExplanations[wrongKey] || item.explanation || 'Explanation unavailable.'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Perfect Score Message */}
              {quizResults.wrong === 0 && quizResults.skipped === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    Perfect Score! 🎉
                  </h3>
                  <p className="text-green-700">
                    You got all questions correct. Excellent work!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz In Progress
  if (quizStarted && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const currentQuestionKey = getQuizQuestionKey(currentQuestion, currentQuestionIndex);
    const hasAnswered = userAnswers[currentQuestionKey] !== undefined;

    return (
      <div
        className="flex-1 mr-0 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2"
        style={{
          marginLeft: `${contentOffsetLeft}px`,
          width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
        }}
      >
        <div className="flex-1 bg-white border border-gray-400 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {/* Quiz Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex-shrink-0">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {selectedExam?.name} Quiz
                  </h1>
                  <p className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of{" "}
                    {quizQuestions.length}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                      timeRemaining < 60
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  <button
                    onClick={handleEndTest}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center space-x-1"
                    title="End Test"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>End Test</span>
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to exit? Your progress will be lost.",
                        )
                      ) {
                        setQuizStarted(false);
                        setQuizCompleted(false);
                        setSelectedExam(null);
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Exit Quiz"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / quizQuestions.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="max-w-none mx-0 md:max-w-3xl md:mx-auto">
              {/* Question */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>

                {currentQuestion.subject && (
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {currentQuestion.subject}
                    </span>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={hasAnswered}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      userAnswers[currentQuestionKey] === index
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } ${
                      hasAnswered
                        ? "cursor-not-allowed opacity-75"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                          userAnswers[currentQuestionKey] === index
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 text-gray-900">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSkipQuestion}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip</span>
                </button>

                <div className="text-sm text-gray-600">
                  {Object.keys(userAnswers).length} answered,{" "}
                  {skippedQuestions.size} skipped
                </div>

                <button
                  onClick={handleNextQuestion}
                  disabled={!hasAnswered}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span>
                    {currentQuestionIndex === quizQuestions.length - 1
                      ? "Submit"
                      : "Next"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Exam Selection Screen
  return (
    <div
      className="flex-1 mr-0 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2"
      style={{
        marginLeft: `${contentOffsetLeft}px`,
        width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
      }}
    >
      <div className="flex-1 bg-white border border-gray-400 rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Trophy
                    className="w-8 h-8 mr-3"
                    style={{ color: theme.colors.primary }}
                  />
                  Attempt Quiz
                </h1>
                <p className="text-gray-600 mt-1">
                  Select an exam to start a 15-question timed quiz
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Selection */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="max-w-none mx-0 md:max-w-4xl md:mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading quiz questions...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => setError("")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : availableExams.length === 0 && !isLoadingExams ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No Exams Found</h3>
                <p className="text-yellow-700">No quiz exams are available in the PYQ database right now.</p>
              </div>
            ) : (
              <>
                {/* Quiz Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3 mb-2">
                          <h3 className="text-base font-semibold text-blue-900 mb-1">
                          📝 Quiz Format
                          </h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-xs md:text-sm text-blue-800 leading-tight">
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
                            <span className="min-w-0 leading-tight">
                            <strong>15 random questions</strong> from the selected
                            exam
                            </span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
                            <span className="min-w-0 leading-tight">
                            <strong>15 minutes</strong> time limit
                            </span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
                            <span className="min-w-0 leading-tight">
                            Questions from <strong>any year</strong> and{" "}
                            <strong>any subject</strong>
                            </span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
                            <span className="min-w-0 leading-tight">
                            One question at a time, with option to{" "}
                            <strong>skip</strong>
                            </span>
                          </li>
                          <li className="flex items-start space-x-2 md:col-span-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5"></span>
                            <span className="min-w-0 leading-tight">
                            Detailed results with{" "}
                            <strong>wrong answer review</strong>
                            </span>
                          </li>
                          </ul>
                        </div>

                {/* Exam Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all hover:scale-105"
                    >
                      <div className="p-6">
                        <div className="text-4xl mb-3 text-center">
                          {exam.icon}
                        </div>

                        <h3 className="text-lg font-semibold mb-2 text-gray-900 text-center">
                          {exam.name}
                        </h3>

                        <p className="text-sm mb-4 text-gray-600 text-center">
                          {exam.description}
                        </p>

                        <button
                          onClick={() => startQuiz(exam)}
                          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Quiz</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSection;
