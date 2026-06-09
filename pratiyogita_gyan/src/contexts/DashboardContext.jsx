import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const { 
    currentUser, 
    getDashboardStats, 
    saveDashboardStats, 
    trackUserInteraction,
    trackSubjectInteraction,
    getSubjectStats,
    saveSubjectStats,
    getRecentActivity,
    getUserAchievements,
    getUserLearningGoals,
    saveAchievement,
    saveLearningGoal,
    updateLearningGoalProgress
  } = useAuth();

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalChats: 0,
      totalQuestions: 0,
      totalMcqAttempted: 0,
      mcqCorrect: 0,
      mcqWrong: 0,
      mcqAccuracy: 0
    },
    subjectStats: [],
    achievements: [],
    learningGoals: [],
    recentActivity: [],
    loading: true,
    error: null
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const getDefaultSubjects = () => ([
    { name: 'Geography', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#06B6D4' },
    { name: 'Polity', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#8B5CF6' },
    { name: 'History', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#10B981' },
    { name: 'Economics', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#F59E0B' },
    { name: 'Science', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#EF4444' },
    { name: 'Others', questions: 0, mcqAttempted: 0, mcqCorrect: 0, color: '#6B7280' }
  ]);

  const normalizeSubjectName = (subject) => {
    const raw = String(subject || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
    if (!raw || raw === 'all' || raw === 'all subjects') return 'Others';

    if (raw.includes('political science') || raw.includes('indian polity') || raw.includes('public administration')) {
      return 'Polity';
    }

    const has = (key) => raw.includes(key);
    const scores = {
      Geography: 0,
      Polity: 0,
      History: 0,
      Economics: 0,
      Science: 0,
    };

    const buckets = {
      Geography: ['geography', 'geo', 'latitude', 'longitude', 'map', 'climate', 'monsoon', 'soil', 'resources'],
      Polity: ['polity', 'politics', 'political', 'constitution', 'constitutional', 'civics', 'governance', 'parliament', 'judiciary', 'legislature', 'rights'],
      History: ['history', 'ancient', 'medieval', 'modern', 'freedom struggle', 'revolt', 'civilization'],
      Economics: ['economics', 'economy', 'economic', 'gdp', 'inflation', 'fiscal', 'monetary', 'budget', 'banking', 'poverty', 'unemployment'],
      Science: ['science', 'physics', 'chemistry', 'biology', 'botany', 'zoology'],
    };

    Object.entries(buckets).forEach(([name, keys]) => {
      keys.forEach((key) => {
        if (has(key)) scores[name] += 1;
      });
    });

    if (scores.Polity > 0 || scores.Economics > 0) {
      scores.Science = Math.max(0, scores.Science - 1);
    }

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 0) return best[0];

    return 'Others';
  };

  const deriveSubjectStatsFromActivity = (activity = []) => {
    const base = getDefaultSubjects();
    const indexByName = Object.fromEntries(base.map((item, index) => [item.name, index]));

    (Array.isArray(activity) ? activity : []).forEach((entry) => {
      const type = entry?.type;
      const subject = normalizeSubjectName(entry?.subject);
      const idx = indexByName[subject] ?? indexByName.Others;
      if (idx == null) return;

      if (type === 'question') base[idx].questions += 1;
      if (type === 'mcq_attempt' || type === 'mcq_correct' || type === 'mcq_wrong') base[idx].mcqAttempted += 1;
      if (type === 'mcq_correct') base[idx].mcqCorrect += 1;
    });

    return base;
  };

  const mergeSubjectStats = (stored = [], derived = []) => {
    const template = getDefaultSubjects();
    const out = template.map((t) => ({ ...t }));
    const byName = Object.fromEntries(out.map((item, index) => [item.name, index]));

    const apply = (arr) => {
      (Array.isArray(arr) ? arr : []).forEach((item) => {
        const name = normalizeSubjectName(item?.name || item?.subject);
        const idx = byName[name] ?? byName.Others;
        if (idx == null) return;
        out[idx].questions = Math.max(out[idx].questions, Number(item?.questions || 0) || 0);
        out[idx].mcqAttempted = Math.max(out[idx].mcqAttempted, Number(item?.mcqAttempted || 0) || 0);
        out[idx].mcqCorrect = Math.max(out[idx].mcqCorrect, Number(item?.mcqCorrect || 0) || 0);
      });
    };

    apply(stored);
    apply(derived);
    return out;
  };

  const isPermissionDeniedError = (err) => (
    err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')
  );

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!currentUser) {
      setDashboardData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // Get data from Firebase
      const [
        firebaseStats,
        firebaseSubjectStats,
        firebaseAchievements,
        firebaseLearningGoals,
        firebaseActivity
      ] = await Promise.all([
        getDashboardStats(),
        getSubjectStats(),
        getUserAchievements(),
        getUserLearningGoals(),
        getRecentActivity(10)
      ]);

      // Calculate accuracy if we have MCQ data
      const stats = firebaseStats || {
        totalChats: 0,
        totalQuestions: 0,
        totalMcqAttempted: 0,
        mcqCorrect: 0,
        mcqWrong: 0,
        mcqAccuracy: 0
      };

      if (stats.totalMcqAttempted > 0) {
        stats.mcqAccuracy = Math.round((stats.mcqCorrect / stats.totalMcqAttempted) * 100);
      }

      const derivedSubjectStats = deriveSubjectStatsFromActivity(firebaseActivity || []);
      const resolvedSubjectStats = mergeSubjectStats(firebaseSubjectStats || [], derivedSubjectStats);

      setDashboardData({
        stats,
        subjectStats: resolvedSubjectStats,
        achievements: firebaseAchievements || [],
        learningGoals: firebaseLearningGoals || [],
        recentActivity: firebaseActivity || [],
        loading: false,
        error: null
      });

      console.log('✅ Dashboard data loaded from Firebase');
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        console.warn('⚠️ Dashboard permission denied. Falling back to empty dynamic state.');
        setDashboardData({
          stats: {
            totalChats: 0,
            totalQuestions: 0,
            totalMcqAttempted: 0,
            mcqCorrect: 0,
            mcqWrong: 0,
            mcqAccuracy: 0
          },
          subjectStats: [],
          achievements: [],
          learningGoals: [],
          recentActivity: [],
          loading: false,
          error: null
        });
        return;
      }
      console.error('❌ Error loading dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Refresh dashboard data
  const refreshDashboardData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Track user interaction and update stats
  const trackInteraction = async (type, data = {}) => {
    if (!currentUser) return;

    try {
      const subject = (() => {
        if (typeof data.subject === 'string') return data.subject;
        if (data.subject && typeof data.subject === 'object') {
          if (typeof data.subject.name === 'string') return data.subject.name;
          if (typeof data.subject.subject === 'string') return data.subject.subject;
        }
        return 'Others';
      })();

      const shouldUpdateSubjectStats = ['question', 'mcq_attempt', 'mcq_correct', 'mcq_wrong'].includes(type);

      // Track subject-specific counters only for subject-relevant events
      if (shouldUpdateSubjectStats) {
        // trackSubjectInteraction also records general interaction internally
        await trackSubjectInteraction(subject, type, data);
      } else {
        // For non-subject events (e.g., search/chat), only log interaction activity
        await trackUserInteraction({
          type,
          subject,
          ...data
        });
      }

      // Update global stats based on interaction type
      const currentStats = dashboardData.stats;
      let newStats = { ...currentStats };

      switch (type) {
        case 'chat':
          newStats.totalChats = (currentStats.totalChats || 0) + 1;
          break;
        case 'question':
          newStats.totalQuestions = (currentStats.totalQuestions || 0) + 1;
          break;
        case 'mcq_attempt':
          newStats.totalMcqAttempted = (currentStats.totalMcqAttempted || 0) + 1;
          break;
        case 'mcq_correct':
          newStats.mcqCorrect = (currentStats.mcqCorrect || 0) + 1;
          newStats.totalMcqAttempted = (currentStats.totalMcqAttempted || 0) + 1;
          break;
        case 'mcq_wrong':
          newStats.mcqWrong = (currentStats.mcqWrong || 0) + 1;
          newStats.totalMcqAttempted = (currentStats.totalMcqAttempted || 0) + 1;
          break;
      }

      // Recalculate accuracy
      if (newStats.totalMcqAttempted > 0) {
        newStats.mcqAccuracy = Math.round((newStats.mcqCorrect / newStats.totalMcqAttempted) * 100);
      }

      // Save updated stats to Firebase
      await saveDashboardStats(newStats);

      // Refresh dashboard data
      refreshDashboardData();
      
      console.log('✅ Interaction tracked and stats updated:', type, 'for subject:', subject);
    } catch (error) {
      console.error('❌ Error tracking interaction:', error);
    }
  };

  // Update specific stats
  const updateStats = async (newStats) => {
    if (!currentUser) return;

    try {
      // Merge with existing stats
      const currentStats = dashboardData.stats;
      const mergedStats = { ...currentStats, ...newStats };

      // Recalculate accuracy if MCQ data is updated
      if (mergedStats.totalMcqAttempted > 0) {
        mergedStats.mcqAccuracy = Math.round((mergedStats.mcqCorrect / mergedStats.totalMcqAttempted) * 100);
      }

      // Save to Firebase
      await saveDashboardStats(mergedStats);
      
      // Refresh dashboard data
      refreshDashboardData();
      
      console.log('✅ Stats updated:', newStats);
    } catch (error) {
      console.error('❌ Error updating stats:', error);
    }
  };

  // Add new achievement
  const addAchievement = async (achievement) => {
    if (!currentUser) return;

    try {
      await saveAchievement(achievement);
      refreshDashboardData();
      console.log('✅ Achievement added:', achievement.title);
    } catch (error) {
      console.error('❌ Error adding achievement:', error);
    }
  };

  // Add new learning goal
  const addLearningGoal = async (goal) => {
    if (!currentUser) return;

    try {
      const goalId = await saveLearningGoal(goal);
      refreshDashboardData();
      console.log('✅ Learning goal added:', goal.title);
      return goalId;
    } catch (error) {
      console.error('❌ Error adding learning goal:', error);
    }
  };

  // Update learning goal progress
  const updateGoalProgress = async (goalId, progress) => {
    if (!currentUser) return;

    try {
      await updateLearningGoalProgress(goalId, progress);
      refreshDashboardData();
      console.log('✅ Goal progress updated');
    } catch (error) {
      console.error('❌ Error updating goal progress:', error);
    }
  };

  // Load data on mount and when refresh is triggered
  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger, currentUser]);

  const value = {
    ...dashboardData,
    refreshDashboardData,
    trackInteraction,
    updateStats,
    loadDashboardData,
    addAchievement,
    addLearningGoal,
    updateGoalProgress
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
