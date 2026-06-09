import { useState, useEffect } from "react";
import {
  MessageCircle,
  BookOpen,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Brain,
  ChevronDown,
  Trophy,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Circle,
  TrendingDown,
  Flame,
  AlertCircle,
  User,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLayout } from "../contexts/LayoutContext";
import { useDashboard } from "../contexts/DashboardContext";

const Dashboard = () => {
  const { theme } = useTheme();
  const { currentUser, getUserQuizHistory, getQuizStatistics } = useAuth();
  const { contentOffsetLeft, isMobile } = useLayout();
  const {
    stats,
    subjectStats,
    achievements,
    learningGoals,
    recentActivity,
    loading,
    error,
    refreshDashboardData,
  } = useDashboard();

  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [quizStats, setQuizStats] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingQuizData, setLoadingQuizData] = useState(false);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    quizPerformance: true,
    subjectAnalysis: true,
    mcqBreakdown: false,
    studyStreak: false,
    weakAreas: false,
    progressTrends: false,
  });

  // Refresh dashboard data on mount
  useEffect(() => {
    refreshDashboardData();
  }, []);

  // Listen for dashboard refresh events (e.g., when chat history is cleared)
  useEffect(() => {
    const handleRefreshEvent = () => {
      console.log('Dashboard refresh event received');
      refreshDashboardData();
    };

    const handleChatDeleted = () => {
      console.log('Chat deleted - refreshing dashboard');
      refreshDashboardData();
    };

    window.addEventListener('refreshDashboard', handleRefreshEvent);
    window.addEventListener('chatDeleted', handleChatDeleted);
    
    return () => {
      window.removeEventListener('refreshDashboard', handleRefreshEvent);
      window.removeEventListener('chatDeleted', handleChatDeleted);
    };
  }, [refreshDashboardData]);

  // Fetch quiz statistics
  useEffect(() => {
    const fetchQuizData = async () => {
      if (currentUser) {
        setLoadingQuizData(true);
        try {
          const [stats, history] = await Promise.all([
            getQuizStatistics(),
            getUserQuizHistory(5),
          ]);
          setQuizStats(stats);
          setQuizHistory(history);
        } catch (error) {
          console.error("Failed to fetch quiz data:", error);
        } finally {
          setLoadingQuizData(false);
        }
      }
    };

    fetchQuizData();
  }, [currentUser, getUserQuizHistory, getQuizStatistics]);

  // Handle refresh
  const handleRefresh = () => {
    refreshDashboardData();
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="dashboard-page flex-1 transition-all duration-300 p-2 md:p-4 overflow-y-auto"
        style={{
          marginLeft: `${contentOffsetLeft}px`,
          width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
        }}
      >
        <div className="max-w-none mx-0 md:max-w-7xl md:mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="dashboard-page flex-1 transition-all duration-300 p-2 md:p-4 overflow-y-auto"
        style={{
          marginLeft: `${contentOffsetLeft}px`,
          width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
        }}
      >
        <div className="max-w-none mx-0 md:max-w-7xl md:mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Dashboard
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use only actual backend data - no defaults
  const subjectWiseQuestions = subjectStats || [];

  // Use only actual achievements - no defaults
  const displayAchievements = achievements || [];

  // Use only actual goals - no defaults
  const displayGoals = learningGoals || []

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Calculate advanced metrics
  const calculateStudyStreak = () => {
    return {
      currentStreak: stats.totalQuestions > 0 ? Math.min(Math.floor(stats.totalQuestions / 10), 30) : 0,
      longestStreak: stats.totalQuestions > 0 ? Math.floor(stats.totalQuestions / 8) : 0,
      lastActive: new Date()
    }
  }

  const identifyWeakAreas = () => {
    if (!subjectStats || subjectStats.length === 0) return []
    
    return subjectStats
      .filter(s => s.mcqAttempted > 0)
      .map(s => ({
        ...s,
        accuracy: ((s.mcqCorrect || 0) / s.mcqAttempted) * 100
      }))
      .filter(s => s.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3)
  }

  const calculateQuizTrends = () => {
    if (!quizHistory || quizHistory.length < 2) return null
    
    const recentScores = quizHistory.slice(0, 5).map(q => q.score).reverse()
    const trend = recentScores[recentScores.length - 1] > recentScores[0] ? 'improving' : 'declining'
    
    return {
      scores: recentScores,
      trend,
      improvement: recentScores[recentScores.length - 1] - recentScores[0]
    }
  }

  const studyStreak = calculateStudyStreak()
  const weakAreas = identifyWeakAreas()
  const quizTrends = calculateQuizTrends()

  // Component for expandable section header
  const SectionHeader = ({ title, icon: Icon, isExpanded, onToggle, badge }) => (
    <div 
      onClick={onToggle}
      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors border-b border-gray-200"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <ChevronDown 
        className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
      />
    </div>
  )

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`text-xs font-medium flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-full`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )

  const SubjectCard = ({ subject }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium text-gray-900 text-xs">{subject.name}</h4>
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: subject.color }}
        ></div>
      </div>
      <div className="space-y-1">
        <div>
          <div className="text-lg font-bold" style={{ color: subject.color }}>
            {subject.questions || 0}
          </div>
          <p className="text-xs text-gray-500">questions asked</p>
        </div>
        <div className="pt-1 border-t border-gray-100">
          <div className="text-sm font-semibold text-gray-700">
            {subject.mcqAttempted || 0}
          </div>
          <p className="text-xs text-gray-500">MCQs attempted</p>
          {subject.mcqAttempted > 0 && (
            <div className="mt-1">
              <div className="text-xs font-medium text-green-600">
                {Math.round(
                  ((subject.mcqCorrect || 0) / subject.mcqAttempted) * 100
                )}
                % accuracy
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-green-600 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((subject.mcqCorrect || 0) / subject.mcqAttempted) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ProgressCard = ({ title, items, icon: Icon }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center mb-3">
        <Icon
          className="w-4 h-4 mr-2"
          style={{ color: theme.colors.primary }}
        />
        <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">
                {item.name}
              </span>
              <span className="text-xs text-gray-500">{item.messages}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${item.progress}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const GoalCard = ({ goal }) => {
    const percentage = (goal.current / goal.target) * 100;
    const isComplete = goal.current >= goal.target;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">{goal.title}</h4>
          {isComplete && <Trophy className="w-3 h-3 text-yellow-500" />}
        </div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-lg font-bold"
            style={{ color: theme.colors.primary }}
          >
            {goal.current}
          </span>
          <span className="text-xs text-gray-500">/ {goal.target}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isComplete ? "#10B981" : theme.colors.primary,
            }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {isComplete
            ? "Goal completed! 🎉"
            : `${goal.target - goal.current} more to go`}
        </p>
      </div>
    );
  };

  return (
    <div
      className="dashboard-page flex-1 mr-0 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2"
      style={{
        marginLeft: `${contentOffsetLeft}px`,
        width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
      }}
    >
      {/* Main Dashboard Container */}
      <div className="flex-1 bg-white border border-gray-400 rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Dashboard Header */}
        <div className="border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p
                className="text-gray-600 mt-1 leading-snug md:leading-normal w-full"
                style={
                  isMobile
                    ? {
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }
                    : undefined
                }
              >
                Welcome back, {currentUser?.displayName || "Student"}! Here's
                your learning overview.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-nowrap">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="flex-1 md:flex-none min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button className="shrink-0 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content with Expandable Sections */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="max-w-none mx-0 md:max-w-full md:mx-auto space-y-3">
            
            {/* Overview Stats - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                title="Total Conversations"
                value={stats.totalChats || 0}
                subtitle="Active chats"
                icon={MessageCircle}
                color={theme.colors.primary}
                trend={5}
              />
              <StatCard
                title="Questions Asked"
                value={stats.totalQuestions || 0}
                subtitle="All time"
                icon={Brain}
                color="#10B981"
                trend={12}
              />
              <StatCard
                title="MCQs Attempted"
                value={stats.totalMcqAttempted || 0}
                subtitle="Previous year questions"
                icon={BookOpen}
                color="#8B5CF6"
                trend={8}
              />
              <StatCard
                title="MCQ Accuracy"
                value={`${stats.mcqAccuracy || 0}%`}
                subtitle={`${stats.mcqCorrect || 0} correct, ${stats.mcqWrong || 0} wrong`}
                icon={Target}
                color="#F59E0B"
                trend={3}
              />
            </div>

            {/* Study Streak Section */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Study Streak & Activity"
                icon={Flame}
                isExpanded={expandedSections.studyStreak}
                onToggle={() => toggleSection('studyStreak')}
                badge={`${studyStreak.currentStreak} days`}
              />
              {expandedSections.studyStreak && (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-orange-600">{studyStreak.currentStreak}</div>
                      <p className="text-xs text-gray-600">Current Streak</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Trophy className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-blue-600">{studyStreak.longestStreak}</div>
                      <p className="text-xs text-gray-600">Longest Streak</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Clock className="w-6 h-6 text-green-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-green-600">{stats.totalChats || 0}</div>
                      <p className="text-xs text-gray-600">Sessions</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 mb-2">Keep it up! Consistency is key to success.</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((studyStreak.currentStreak / 30) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {30 - studyStreak.currentStreak > 0 ? `${30 - studyStreak.currentStreak} days to reach 30-day streak!` : 'Amazing! You\'ve reached 30 days! 🎉'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Performance - Expandable */}
            {quizStats && quizStats.totalQuizzes > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader 
                  title="Quiz Performance Analytics"
                  icon={Trophy}
                  isExpanded={expandedSections.quizPerformance}
                  onToggle={() => toggleSection('quizPerformance')}
                  badge={`${quizStats.totalQuizzes} quizzes`}
                />
                {expandedSections.quizPerformance && (
                  <div className="p-4 space-y-4">
                    {/* Quiz Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{quizStats.totalQuizzes}</div>
                        <p className="text-xs text-gray-600">Quizzes Taken</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{quizStats.averageScore}%</div>
                        <p className="text-xs text-gray-600">Avg Score</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{quizStats.totalQuizQuestions}</div>
                        <p className="text-xs text-gray-600">Total Questions</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{quizStats.totalCorrectAnswers}</div>
                        <p className="text-xs text-gray-600">Correct Answers</p>
                      </div>
                    </div>

                    {/* Score Trend Visualization */}
                    {quizTrends && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">Score Trend</h4>
                          <span className={`text-sm font-medium flex items-center ${quizTrends.trend === 'improving' ? 'text-green-600' : 'text-orange-600'}`}>
                            {quizTrends.trend === 'improving' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {quizTrends.trend === 'improving' ? 'Improving' : 'Needs Attention'}
                          </span>
                        </div>
                        <div className="flex items-end space-x-2 h-20">
                          {quizTrends.scores.map((score, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end items-center">
                              <div 
                                className={`w-full rounded-t-lg transition-all duration-300 ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ height: `${score}%` }}
                              />
                              <span className="text-xs text-gray-600 mt-1">{score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Quiz History */}
                    {quizHistory.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Quiz Attempts</h4>
                        <div className="space-y-2">
                          {quizHistory.map((quiz, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${quiz.score >= 80 ? 'bg-green-500' : quiz.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{quiz.examName}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(quiz.completedAt).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-lg font-bold" style={{ 
                                    color: quiz.score >= 80 ? '#10B981' : quiz.score >= 60 ? '#F59E0B' : '#EF4444'
                                  }}>
                                    {quiz.score}%
                                  </p>
                                  <p className="text-xs text-gray-500">{quiz.correct}/{quiz.totalQuestions}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-gray-700">{quiz.correct}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                                    <span className="text-sm text-gray-700">{quiz.wrong}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Circle className="w-4 h-4 text-gray-400 mr-1" />
                                    <span className="text-sm text-gray-700">{quiz.skipped}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Subject Analysis - Expandable */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Subject-wise Analysis"
                icon={BarChart3}
                isExpanded={expandedSections.subjectAnalysis}
                onToggle={() => toggleSection('subjectAnalysis')}
                badge={`${subjectWiseQuestions.length} subjects`}
              />
              {expandedSections.subjectAnalysis && (
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {subjectWiseQuestions.map((subject, index) => (
                      <SubjectCard key={index} subject={subject} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Weak Areas Identification - Expandable */}
            {weakAreas.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader 
                  title="Areas Needing Improvement"
                  icon={AlertCircle}
                  isExpanded={expandedSections.weakAreas}
                  onToggle={() => toggleSection('weakAreas')}
                  badge={`${weakAreas.length} subjects`}
                />
                {expandedSections.weakAreas && (
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Focus on these subjects to improve your overall performance:
                    </p>
                    <div className="space-y-3">
                      {weakAreas.map((subject, index) => (
                        <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                            <span className="text-sm font-bold text-red-600">{subject.accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-red-100 rounded-full h-2 mb-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${subject.accuracy}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{subject.mcqAttempted} questions attempted</span>
                            <span>{subject.mcqCorrect} correct</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MCQ Performance Breakdown - Expandable */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="MCQ Performance Breakdown"
                icon={Target}
                isExpanded={expandedSections.mcqBreakdown}
                onToggle={() => toggleSection('mcqBreakdown')}
              />
              {expandedSections.mcqBreakdown && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalMcqAttempted || 0}</div>
                      <p className="text-sm text-gray-600">Total Attempted</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-green-600 mb-1">{stats.mcqCorrect || 0}</div>
                      <p className="text-sm text-gray-600">Correct Answers</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.totalMcqAttempted > 0 ? ((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-red-600 mb-1">{stats.mcqWrong || 0}</div>
                      <p className="text-sm text-gray-600">Wrong Answers</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.totalMcqAttempted > 0 ? ((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pie Chart Representation */}
                  <div className="mt-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 text-center">Performance Distribution</h4>
                    <div className="flex items-center justify-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full" />
                        <span className="text-sm text-gray-700">Correct ({stats.mcqAccuracy || 0}%)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full" />
                        <span className="text-sm text-gray-700">Wrong ({100 - (stats.mcqAccuracy || 0)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Login Modal Overlay */}
      {!currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-fadeIn">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
              <p className="text-gray-600">
                Please log in to track and view your performance metrics
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }))}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
              <p className="text-sm text-gray-500">
                Track your quiz scores, study streaks, and subject progress
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
