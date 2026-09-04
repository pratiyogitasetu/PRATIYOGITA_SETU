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
  AlertCircle,
  User,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLayout } from "../contexts/LayoutContext";
import { useDashboard } from "../contexts/DashboardContext";

const Dashboard = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
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

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    mcqBreakdown: true,
    subjectAnalysis: true,
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

  // Handle refresh
  const handleRefresh = () => {
    refreshDashboardData();
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="dashboard-page flex-1 transition-all duration-300 px-2 md:px-4 pb-2 md:pb-4 overflow-y-auto"
        style={{
          paddingTop: isMobile ? '60px' : '64px',
          marginLeft: `${contentOffsetLeft}px`,
          width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
        className="dashboard-page flex-1 transition-all duration-300 px-2 md:px-4 pb-2 md:pb-4 overflow-y-auto"
        style={{
          paddingTop: isMobile ? '60px' : '64px',
          marginLeft: `${contentOffsetLeft}px`,
          width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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

  const weakAreas = identifyWeakAreas()

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

  const SubjectCard = ({ subject }) => {
    const attempted = subject.mcqAttempted || 0;
    const correct = subject.mcqCorrect || 0;
    const wrong = subject.mcqWrong || 0;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{subject.name}</h4>
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: subject.color || '#3B82F6' }}
          ></div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-gray-800">{attempted}</span>
            <span className="text-[11px] text-gray-500">Attempted</span>
          </div>
          {attempted > 0 ? (
            <div>
              <div className="flex justify-between text-[11px] font-medium text-gray-600 mb-0.5">
                <span className="text-green-600 font-semibold">{correct} correct</span>
                <span className="text-red-500 font-semibold">{wrong} wrong</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-green-700">
                <span>{accuracy}%</span>
                <span className="text-[10px] text-gray-400 font-normal">accuracy</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${accuracy}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">No MCQs attempted</p>
          )}
        </div>
      </div>
    );
  };

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
        paddingTop: isMobile ? '60px' : '64px',
        marginLeft: `${contentOffsetLeft}px`,
        width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5"
                title="Refresh dashboard stats"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content with Expandable Sections */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="max-w-none mx-0 md:max-w-full md:mx-auto space-y-3">
            
            {/* Overview Stats - Questions & MCQ Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                title="Questions Asked"
                value={stats.totalQuestions || 0}
                subtitle="Total across all chats"
                icon={Brain}
                color="#3B82F6"
              />
              <StatCard
                title="MCQs Attempted"
                value={stats.totalMcqAttempted || 0}
                subtitle="Previous year questions"
                icon={BookOpen}
                color="#8B5CF6"
              />
              <StatCard
                title="Correct Answers"
                value={stats.mcqCorrect || 0}
                subtitle={stats.totalMcqAttempted > 0 ? `${Math.round(((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100)}% accuracy` : "0% accuracy"}
                icon={CheckCircle}
                color="#10B981"
              />
              <StatCard
                title="Wrong Answers"
                value={stats.mcqWrong || 0}
                subtitle={stats.totalMcqAttempted > 0 ? `${Math.round(((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100)}% error rate` : "0% error"}
                icon={XCircle}
                color="#EF4444"
              />
            </div>

            {/* MCQ Performance Breakdown Section */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="MCQ Performance Breakdown"
                icon={Target}
                isExpanded={expandedSections.mcqBreakdown}
                onToggle={() => toggleSection('mcqBreakdown')}
                badge={`${stats.mcqAccuracy || 0}% Accuracy`}
              />
              {expandedSections.mcqBreakdown && (
                <div className="p-4 space-y-4">
                  {/* Detailed Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-700 font-medium">Total Attempted</p>
                      <p className="text-xl font-bold text-purple-900 mt-0.5">{stats.totalMcqAttempted || 0}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-700 font-medium">Correct</p>
                      <p className="text-xl font-bold text-green-900 mt-0.5">{stats.mcqCorrect || 0}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-red-700 font-medium">Wrong</p>
                      <p className="text-xl font-bold text-red-900 mt-0.5">{stats.mcqWrong || 0}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <p className="text-xs text-amber-700 font-medium">Overall Accuracy</p>
                      <p className="text-xl font-bold text-amber-900 mt-0.5">{stats.mcqAccuracy || 0}%</p>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  {stats.totalMcqAttempted > 0 ? (
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span className="flex items-center gap-1 font-medium text-green-700">
                          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                          Correct: {stats.mcqCorrect || 0} ({Math.round(((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100)}%)
                        </span>
                        <span className="flex items-center gap-1 font-medium text-red-700">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                          Wrong: {stats.mcqWrong || 0} ({Math.round(((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
                        <div 
                          className="bg-green-500 h-full transition-all duration-500" 
                          style={{ width: `${Math.round(((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100)}%` }}
                          title={`Correct: ${stats.mcqCorrect || 0}`}
                        />
                        <div 
                          className="bg-red-500 h-full transition-all duration-500" 
                          style={{ width: `${Math.round(((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100)}%` }}
                          title={`Wrong: ${stats.mcqWrong || 0}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">No MCQs attempted yet. Practice previous year questions from the PYQ panel to see your accuracy breakdown!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

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
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('switchToChat'))}
                className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Return to Home
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
