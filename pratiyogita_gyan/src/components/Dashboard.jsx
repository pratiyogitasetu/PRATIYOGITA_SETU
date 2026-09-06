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
  ArrowLeft,
  X,
  Star,
  ZoomIn,
  Calendar,
  Award,
  Check,
  HelpCircle,
  Eye,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useLayout } from "../contexts/LayoutContext";
import { useDashboard } from "../contexts/DashboardContext";

const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  const idMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return trimmed;
};

const Dashboard = ({ onClose }) => {
  const { theme } = useTheme();
  const { currentUser, getStarredPyqQuestions, removeStarredPyqQuestion, getPaperPracticeHistory } = useAuth();
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
    paperPractice: true,
    subjectAnalysis: true,
    savedPyqs: true,
  });

  // Saved PYQs state
  const [savedPyqs, setSavedPyqs] = useState([]);
  const [loadingSavedPyqs, setLoadingSavedPyqs] = useState(false);
  const [expandedSavedExplanations, setExpandedSavedExplanations] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  // Year-wise PYQ Paper Practice History state
  const [paperHistory, setPaperHistory] = useState([]);
  const [loadingPaperHistory, setLoadingPaperHistory] = useState(false);
  const [selectedPaperReview, setSelectedPaperReview] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'correct' | 'wrong' | 'unattempted'

  // Handle close
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      window.dispatchEvent(new CustomEvent('switchToChat'));
    }
  };

  // Load Year-wise PYQ Paper Practice History
  const loadPaperPractice = async () => {
    setLoadingPaperHistory(true);
    try {
      if (getPaperPracticeHistory) {
        const history = await getPaperPracticeHistory();
        setPaperHistory(Array.isArray(history) ? history : []);
      } else {
        const localRaw = localStorage.getItem('pyqPaperPracticeHistory');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          setPaperHistory(Array.isArray(parsed) ? parsed : []);
        } else {
          setPaperHistory([]);
        }
      }
    } catch (e) {
      console.warn('Failed to load paper practice history:', e);
    } finally {
      setLoadingPaperHistory(false);
    }
  };

  // Load saved PYQs
  const loadSavedPyqs = async () => {
    setLoadingSavedPyqs(true);
    try {
      if (currentUser && getStarredPyqQuestions) {
        const questions = await getStarredPyqQuestions();
        setSavedPyqs(Array.isArray(questions) ? questions : []);
      } else {
        const localRaw = localStorage.getItem('pyqPracticeStarredQuestions');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          setSavedPyqs(Array.isArray(parsed) ? parsed : []);
        } else {
          setSavedPyqs([]);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved PYQs in dashboard:', e);
    } finally {
      setLoadingSavedPyqs(false);
    }
  };

  // Remove saved PYQ
  const handleRemoveSavedPyq = async (questionId) => {
    if (!questionId) return;
    setSavedPyqs(prev => prev.filter(q => (q.id || q._id) !== questionId));
    try {
      if (currentUser && removeStarredPyqQuestion) {
        await removeStarredPyqQuestion(questionId);
      } else {
        const localRaw = localStorage.getItem('pyqPracticeStarredQuestions');
        const parsed = localRaw ? JSON.parse(localRaw) : [];
        const next = Array.isArray(parsed) ? parsed.filter(q => (q.id || q._id) !== questionId) : [];
        localStorage.setItem('pyqPracticeStarredQuestions', JSON.stringify(next));
      }
    } catch (err) {
      console.warn('Failed to remove saved PYQ:', err);
    }
    window.dispatchEvent(new CustomEvent('starredPyqsUpdated', {
      detail: { questionId, isStarred: false }
    }));
  };

  useEffect(() => {
    loadSavedPyqs();
    loadPaperPractice();
  }, [currentUser]);

  useEffect(() => {
    const handleStarredUpdate = () => {
      loadSavedPyqs();
    };
    const handlePaperPracticeUpdate = () => {
      loadPaperPractice();
    };

    window.addEventListener('starredPyqsUpdated', handleStarredUpdate);
    window.addEventListener('paperPracticeUpdated', handlePaperPracticeUpdate);

    return () => {
      window.removeEventListener('starredPyqsUpdated', handleStarredUpdate);
      window.removeEventListener('paperPracticeUpdated', handlePaperPracticeUpdate);
    };
  }, [currentUser]);

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
      className="dashboard-page flex-1 flex flex-col h-full overflow-hidden pr-1 pb-1"
      style={{
        paddingTop: isMobile ? '56px' : '60px',
        marginLeft: `${contentOffsetLeft}px`,
        width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 4)}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Main Dashboard Container */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Dashboard Header */}
        <div className="border-b border-gray-200 px-3 py-2.5 sm:px-6 sm:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-gray-200"
                title="Back to Practice / Chat"
                aria-label="Close Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Dashboard</h1>
                <p className="text-gray-600 mt-0.5 text-xs sm:text-sm truncate">
                  Welcome back, {currentUser?.displayName || "Student"}! Here's your learning overview.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                className="px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5"
                title="Refresh dashboard stats"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleClose}
                className="px-2.5 sm:px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5"
                title="Close Dashboard"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content with Expandable Sections */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="max-w-none mx-0 md:max-w-full md:mx-auto space-y-3">
            
            {/* Guest sync notice (non-blocking) */}
            {!currentUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-800">
                  <User className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Viewing local practice stats. Sign in to save and sync your progress permanently across devices.</span>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal', { detail: { mode: 'login' } }))}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-md transition-colors shrink-0"
                >
                  Sign In
                </button>
              </div>
            )}
            
            {/* Side-by-Side Compact Containers: Activity Overview (Left) & MCQ Performance Breakdown (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-stretch">
              
              {/* Left Container: Activity & Questions Overview (Image 2 Dark & Warm Orange Scheme) */}
              <div className="bg-[#1e1e24] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#e4572e]/15 flex items-center justify-center text-[#ea580c]">
                      <Brain className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">Questions & Practice Overview</h3>
                      <p className="text-[10px] text-gray-400">Total questions asked and MCQ attempts</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#e4572e]/15 text-[#ea580c] border border-[#e4572e]/30 rounded-full">
                    {stats.totalQuestions || 0} Questions
                  </span>
                </div>

                {/* 2x2 Compact Metric Grid */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {/* Questions Asked */}
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2.5 flex flex-col justify-between hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-300">Questions Asked</span>
                      <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                        <Brain className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-white leading-tight">{stats.totalQuestions || 0}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">Total across all chats</p>
                    </div>
                  </div>

                  {/* MCQs Attempted */}
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2.5 flex flex-col justify-between hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-300">MCQs Attempted</span>
                      <div className="p-1 rounded bg-purple-500/10 text-purple-400">
                        <BookOpen className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-white leading-tight">{stats.totalMcqAttempted || 0}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">Previous year questions</p>
                    </div>
                  </div>

                  {/* Correct Answers */}
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2.5 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-300">Correct Answers</span>
                      <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-emerald-400 leading-tight">{stats.mcqCorrect || 0}</p>
                      <p className="text-[10px] text-emerald-400/90 mt-0.5 truncate font-medium">
                        {stats.totalMcqAttempted > 0 ? `${Math.round(((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100)}% accuracy` : "0% accuracy"}
                      </p>
                    </div>
                  </div>

                  {/* Wrong Answers */}
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2.5 flex flex-col justify-between hover:border-rose-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-gray-300">Wrong Answers</span>
                      <div className="p-1 rounded bg-rose-500/10 text-rose-400">
                        <XCircle className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-rose-400 leading-tight">{stats.mcqWrong || 0}</p>
                      <p className="text-[10px] text-rose-400/90 mt-0.5 truncate font-medium">
                        {stats.totalMcqAttempted > 0 ? `${Math.round(((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100)}% error` : "0% error"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Container: MCQ Performance Breakdown (Image 2 Dark & Warm Orange Scheme) */}
              <div className="bg-[#1e1e24] border border-white/10 rounded-xl p-3 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#e4572e]/15 flex items-center justify-center text-[#ea580c]">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">MCQ Performance Breakdown</h3>
                      <p className="text-[10px] text-gray-400">Accuracy and precision analytics</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#e4572e]/15 text-[#ea580c] border border-[#e4572e]/30 rounded-full">
                    {stats.mcqAccuracy || 0}% Accuracy
                  </span>
                </div>

                {/* 4 Detailed Metric Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-purple-300 font-medium">Total Attempted</p>
                    <p className="text-base sm:text-lg font-extrabold text-white mt-0.5">{stats.totalMcqAttempted || 0}</p>
                  </div>
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-emerald-400 font-medium">Correct</p>
                    <p className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5">{stats.mcqCorrect || 0}</p>
                  </div>
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-rose-400 font-medium">Wrong</p>
                    <p className="text-base sm:text-lg font-extrabold text-rose-400 mt-0.5">{stats.mcqWrong || 0}</p>
                  </div>
                  <div className="bg-[#27272e] border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-orange-400 font-medium">Overall Accuracy</p>
                    <p className="text-base sm:text-lg font-extrabold text-[#ea580c] mt-0.5">{stats.mcqAccuracy || 0}%</p>
                  </div>
                </div>

                {/* Visual Proportion Bar or Empty State Message */}
                <div className="flex-1 flex flex-col justify-center">
                  {stats.totalMcqAttempted > 0 ? (
                    <div className="bg-[#27272e] border border-white/10 rounded-lg p-2.5">
                      <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
                          Correct: {stats.mcqCorrect || 0} ({Math.round(((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100)}%)
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block shadow-[0_0_6px_rgba(248,113,113,0.6)]"></span>
                          Wrong: {stats.mcqWrong || 0} ({Math.round(((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#18181b] rounded-full h-2 overflow-hidden flex border border-white/5">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${Math.round(((stats.mcqCorrect || 0) / stats.totalMcqAttempted) * 100)}%` }}
                          title={`Correct: ${stats.mcqCorrect || 0}`}
                        />
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500" 
                          style={{ width: `${Math.round(((stats.mcqWrong || 0) / stats.totalMcqAttempted) * 100)}%` }}
                          title={`Wrong: ${stats.mcqWrong || 0}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2.5 px-3 bg-[#27272e]/60 rounded-lg border border-dashed border-white/15">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        No MCQs attempted yet. Practice previous year questions from the PYQ panel to see your accuracy breakdown!
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Year-Wise PYQ Practice Breakdown - Expandable */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Year-Wise PYQ Practice Breakdown"
                icon={Calendar}
                isExpanded={expandedSections.paperPractice}
                onToggle={() => toggleSection('paperPractice')}
                badge={`${paperHistory.length} Papers Attempted`}
              />
              {expandedSections.paperPractice && (
                <div className="p-4 space-y-3">
                  {loadingPaperHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-orange-500 mr-2" />
                      <span className="text-sm text-gray-500">Loading PYQ practice history...</span>
                    </div>
                  ) : paperHistory.length > 0 ? (
                    <div className="space-y-2.5">
                      {paperHistory.map((paper, idx) => {
                        const total = paper.total || (paper.attempted + paper.unattempted) || 0;
                        const attempted = paper.attempted || 0;
                        const unattempted = paper.unattempted !== undefined ? paper.unattempted : Math.max(0, total - attempted);
                        const correct = paper.correct || 0;
                        const wrong = paper.wrong || 0;
                        const accuracy = paper.accuracy !== undefined ? paper.accuracy : (attempted > 0 ? Math.round((correct / attempted) * 100) : 0);

                        return (
                          <div
                            key={paper.id || idx}
                            className="p-3 sm:p-3.5 rounded-lg border border-gray-200 bg-white hover:border-orange-300 hover:shadow-xs transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-[#E4572E] rounded">
                                  {paper.examName || paper.examId || 'Exam Paper'}
                                </span>
                                <span className="text-xs font-semibold text-gray-800">
                                  {paper.yearLabel || paper.yearId || 'Paper'}
                                </span>
                                {paper.category && (
                                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {paper.category}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 shrink-0">
                                <Clock className="w-3.5 h-3.5 opacity-60" />
                                <span>{paper.date || 'Recently'}</span>
                                {paper.timeSpent && (
                                  <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                                    {paper.timeSpent}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Metrics Breakdown Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center pt-1.5 border-t border-gray-100">
                              <div className="p-1.5 rounded bg-gray-50 border border-gray-100">
                                <span className="text-[10px] font-semibold text-gray-500 uppercase block">Total Qs</span>
                                <span className="text-xs font-bold text-gray-800">{total}</span>
                              </div>
                              <div className="p-1.5 rounded bg-blue-50/70 border border-blue-100">
                                <span className="text-[10px] font-semibold text-blue-700 uppercase block">Attempted</span>
                                <span className="text-xs font-bold text-blue-800">{attempted}</span>
                              </div>
                              <div className="p-1.5 rounded bg-gray-50 border border-gray-200">
                                <span className="text-[10px] font-semibold text-gray-600 uppercase block">Skipped</span>
                                <span className="text-xs font-bold text-gray-700">{unattempted}</span>
                              </div>
                              <div className="p-1.5 rounded bg-green-50 border border-green-200">
                                <span className="text-[10px] font-semibold text-green-700 uppercase block">Correct</span>
                                <span className="text-xs font-bold text-green-700">{correct}</span>
                              </div>
                              <div className="p-1.5 rounded bg-red-50 border border-red-200 col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-semibold text-red-600 uppercase block">Wrong</span>
                                <span className="text-xs font-bold text-red-600">{wrong}</span>
                              </div>
                            </div>

                            {/* Accuracy Visual Bar */}
                            {attempted > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden flex">
                                  <div
                                    className="bg-green-500 h-full"
                                    style={{ width: `${accuracy}%` }}
                                    title={`Correct: ${correct}`}
                                  />
                                  <div
                                    className="bg-red-500 h-full"
                                    style={{ width: `${100 - accuracy}%` }}
                                    title={`Wrong: ${wrong}`}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-gray-700 shrink-0">
                                  {accuracy}% Accuracy
                                </span>
                              </div>
                            )}

                            {/* View Questions Breakdown Button */}
                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[11px] text-gray-500">
                                {paper.questions?.length || total} Questions Saved
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedPaperReview(paper);
                                  setReviewFilter('all');
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-[#E4572E] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md transition-colors flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Review Paper Breakdown</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Award className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">No PYQ Papers Attempted Yet</p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                        Go to PYQ Practice, pick an exam and year paper to practice. Your attempt stats, date, correct, wrong, and skipped counts will appear here automatically!
                      </p>
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

            {/* Saved PYQs Section - Expandable */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <SectionHeader 
                title="Saved PYQs"
                icon={Star}
                isExpanded={expandedSections.savedPyqs}
                onToggle={() => toggleSection('savedPyqs')}
                badge={`${savedPyqs.length} saved`}
              />
              {expandedSections.savedPyqs && (
                <div className="p-4 space-y-3">
                  {loadingSavedPyqs ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-500 mr-2" />
                      <span className="text-sm text-gray-500">Loading saved PYQs...</span>
                    </div>
                  ) : savedPyqs.length > 0 ? (
                    <div className="space-y-3">
                      {savedPyqs.map((q, idx) => {
                        const qId = q.id || q._id || `saved_${idx}`;
                        const exam = q.exam_name || q.metadata?.exam_name || q.metadata?.exam;
                        const subject = q.subject || q.metadata?.subject;
                        const year = q.year || q.metadata?.year || q.metadata?.exam_year;
                        const hasExplanation = Boolean(q.explanation && q.explanation.trim());
                        const isExplanationOpen = expandedSavedExplanations[qId];

                        return (
                          <div 
                            key={qId} 
                            className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all duration-200"
                          >
                            {/* Header with badges and unstar button */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {exam && (
                                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                                    {exam}
                                  </span>
                                )}
                                {subject && (
                                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                                    {subject}
                                  </span>
                                )}
                                {year && (
                                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded-md">
                                    {year}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveSavedPyq(qId)}
                                title="Remove from saved"
                                className="p-1.5 text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium shrink-0"
                              >
                                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                                <span className="hidden sm:inline text-amber-700 font-semibold">Saved</span>
                              </button>
                            </div>

                            {/* Question Text */}
                            <p className="text-sm font-semibold text-gray-900 mb-2 leading-relaxed">
                              {q.question || q.text}
                            </p>

                            {/* Options and Image Side-by-Side */}
                            {(() => {
                              const rawImg = q.img || q.image_url || q.metadata?.img || q.metadata?.image_url;
                              const formattedImg = formatImageUrl(rawImg);

                              const renderOptions = () => (
                                Array.isArray(q.options) && q.options.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                                    {q.options.map((opt, optIdx) => {
                                      const isCorrect = q.correct_answer === optIdx;
                                      return (
                                        <div
                                          key={optIdx}
                                          className={`p-2 rounded-lg text-xs flex items-start gap-2 border transition-colors ${
                                            isCorrect 
                                              ? 'bg-green-50/80 border-green-300 text-green-900 font-medium' 
                                              : 'bg-gray-50 border-gray-200 text-gray-700'
                                          }`}
                                        >
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                            isCorrect 
                                              ? 'bg-green-600 text-white' 
                                              : 'bg-gray-200 text-gray-600'
                                          }`}>
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span className="flex-1 mt-0.5 leading-snug">{opt}</span>
                                          {isCorrect && (
                                            <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded shrink-0">
                                              Correct
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null
                              );

                              if (!formattedImg) {
                                return <div className="mb-3">{renderOptions()}</div>;
                              }

                              return (
                                <div className="flex flex-row items-center gap-2 mb-3">
                                  {renderOptions()}
                                  <div className="w-[46%] sm:w-48 shrink-0 flex flex-col items-center justify-center p-0">
                                    <img
                                      src={formattedImg}
                                      alt="Question Reference"
                                      loading="lazy"
                                      className="max-h-36 max-w-full object-contain rounded-lg cursor-pointer shadow-sm"
                                      onClick={() => setPreviewImage(formattedImg)}
                                      title="Click to enlarge"
                                      onError={(e) => {
                                        if (!e.target.dataset.triedFallback) {
                                          e.target.dataset.triedFallback = 'true';
                                          const fileDMatch = (rawImg || '').match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                                          if (fileDMatch && fileDMatch[1]) {
                                            e.target.src = `https://drive.google.com/thumbnail?id=${fileDMatch[1]}&sz=w1000`;
                                          }
                                        } else {
                                          e.target.style.display = 'none';
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(formattedImg)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 mt-1"
                                      title="Click to enlarge"
                                    >
                                      <ZoomIn className="w-3 h-3 text-amber-600" />
                                      <span>View figure</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Explanation Toggle */}
                            {hasExplanation && (
                              <div>
                                <button
                                  onClick={() => setExpandedSavedExplanations(prev => ({ ...prev, [qId]: !prev[qId] }))}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                >
                                  {isExplanationOpen ? 'Hide Explanation' : 'View Explanation'}
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExplanationOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isExplanationOpen && (
                                  <div className="mt-2 p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-gray-700 leading-relaxed">
                                    <span className="font-semibold text-blue-900 block mb-1">Explanation:</span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center">
                        <Star className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No Saved PYQs Yet</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                        Click the star icon (★) on any question in the PYQ panel while practicing to bookmark it here for quick revision!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Year-Wise Attempted Paper Breakdown Review Modal */}
      {selectedPaperReview && (
        <div
          onClick={() => setSelectedPaperReview(null)}
          className="fixed inset-0 z-[999990] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#E4572E] text-white rounded">
                    {selectedPaperReview.examName || selectedPaperReview.examId}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-gray-900 truncate">
                    {selectedPaperReview.yearLabel || selectedPaperReview.yearId}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    ({selectedPaperReview.date})
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-700">
                  <span className="text-emerald-700 font-bold">
                    ✓ {selectedPaperReview.correct || 0} Correct
                  </span>
                  <span className="text-red-600 font-bold">
                    ✗ {selectedPaperReview.wrong || 0} Wrong
                  </span>
                  <span className="text-gray-500 font-bold">
                    ⊘ {selectedPaperReview.unattempted || 0} Skipped
                  </span>
                  <span className="text-blue-700 font-extrabold">
                    {selectedPaperReview.accuracy || 0}% Accuracy
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPaperReview(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                title="Close review"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 bg-gray-50 overflow-x-auto shrink-0">
              {[
                { key: 'all', label: 'All Questions', count: selectedPaperReview.questions?.length || selectedPaperReview.total },
                { key: 'correct', label: 'Correct', count: selectedPaperReview.correct || 0, color: 'text-emerald-700' },
                { key: 'wrong', label: 'Wrong', count: selectedPaperReview.wrong || 0, color: 'text-red-600' },
                { key: 'unattempted', label: 'Not Attempted', count: selectedPaperReview.unattempted || 0, color: 'text-gray-600' },
              ].map((f) => {
                const isActive = reviewFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setReviewFilter(f.key)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/50">
              {Array.isArray(selectedPaperReview.questions) && selectedPaperReview.questions.length > 0 ? (
                selectedPaperReview.questions
                  .filter((q) => {
                    if (reviewFilter === 'correct') return q.status === 'correct';
                    if (reviewFilter === 'wrong') return q.status === 'wrong';
                    if (reviewFilter === 'unattempted') return q.status === 'unattempted';
                    return true;
                  })
                  .map((q, idx) => {
                    const status = q.status; // 'correct' | 'wrong' | 'unattempted'
                    const userOptIdx = q.userAnswer;
                    const correctOptIdx = q.correctAnswer;

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-3 sm:p-4 rounded-xl border bg-white shadow-2xs transition-all ${
                          status === 'correct'
                            ? 'border-emerald-200'
                            : status === 'wrong'
                            ? 'border-red-200'
                            : 'border-gray-200'
                        }`}
                      >
                        {/* Status Badge & Question Header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-gray-500">
                              Q{q.index !== undefined ? q.index + 1 : idx + 1}.
                            </span>
                            {q.subject && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">
                                {q.subject}
                              </span>
                            )}
                          </div>

                          {status === 'correct' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </span>
                          ) : status === 'wrong' ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-bold flex items-center gap-1">
                              <X className="w-3.5 h-3.5" />
                              <span>Wrong</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-bold flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Not Attempted</span>
                            </span>
                          )}
                        </div>

                        {/* Question Text */}
                        <p className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">
                          {q.question}
                        </p>

                        {/* Options List */}
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = correctOptIdx === optIdx;
                              const isUserAnswer = userOptIdx === optIdx;

                              let optBorder = 'border-gray-200 bg-gray-50 text-gray-700';
                              let badgeColor = 'bg-gray-200 text-gray-700';

                              if (isCorrect) {
                                optBorder = 'border-emerald-400 bg-emerald-50/70 text-emerald-900 font-semibold';
                                badgeColor = 'bg-emerald-600 text-white';
                              } else if (isUserAnswer && !isCorrect) {
                                optBorder = 'border-red-400 bg-red-50/70 text-red-900';
                                badgeColor = 'bg-red-500 text-white';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${optBorder}`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${badgeColor}`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1 mt-0.5 leading-snug break-words">
                                    {opt}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                      Correct
                                    </span>
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                                      Your Choice
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Official Key / Explanation */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-gray-800 leading-relaxed">
                            <strong className="text-blue-900 block mb-0.5">Official Explanation / Key:</strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-gray-700">Detailed question log not found for this attempt.</p>
                  <p className="text-xs text-gray-500 mt-1">Newly submitted papers will display every question, your selected choice, and the official answer key here.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-200 bg-white flex justify-end shrink-0">
              <button
                onClick={() => setSelectedPaperReview(null)}
                className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Lightbox Modal with Cross Button */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center justify-center"
          >
            <button
              onClick={() => setPreviewImage(null)}
              title="Close image"
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-8 h-8 rounded-full bg-white text-gray-900 shadow-xl flex items-center justify-center hover:bg-gray-100 hover:scale-105 transition-all z-10"
            >
              <X className="w-4 h-4 text-gray-800" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged figure"
              className="max-w-full max-h-[84vh] object-contain rounded-xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
