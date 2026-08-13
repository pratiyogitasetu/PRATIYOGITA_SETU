import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
    saveAchievement
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

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

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

      setDashboardData({
        stats,
        subjectStats: firebaseSubjectStats && firebaseSubjectStats.length > 0 ? firebaseSubjectStats : getDefaultSubjects(),
        achievements: firebaseAchievements || [],
        learningGoals: firebaseLearningGoals || [],
        recentActivity: firebaseActivity || [],
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const refreshDashboardData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const trackInteraction = async (type, data = {}) => {
    try {
      const subject = data.subject || 'Others';
      const shouldUpdateSubjectStats = ['question', 'mcq_attempt', 'mcq_correct', 'mcq_wrong'].includes(type);

      if (shouldUpdateSubjectStats) {
        await trackSubjectInteraction(subject, type, data);
      } else {
        await trackUserInteraction({
          type,
          subject,
          ...data
        });
      }

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

      if (newStats.totalMcqAttempted > 0) {
        newStats.mcqAccuracy = Math.round((newStats.mcqCorrect / newStats.totalMcqAttempted) * 100);
      }

      await saveDashboardStats(newStats);

      // Local subject stats update
      if (shouldUpdateSubjectStats) {
        const currentSubjects = dashboardData.subjectStats.length > 0 ? dashboardData.subjectStats : getDefaultSubjects();
        const updatedSubjects = currentSubjects.map(s => {
          if (s.name.toLowerCase() === subject.toLowerCase()) {
            const next = { ...s };
            if (type === 'question') next.questions += 1;
            if (type === 'mcq_attempt' || type === 'mcq_correct' || type === 'mcq_wrong') next.mcqAttempted += 1;
            if (type === 'mcq_correct') next.mcqCorrect += 1;
            return next;
          }
          return s;
        });
        await saveSubjectStats(updatedSubjects);
      }

      refreshDashboardData();
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const updateStats = async (newStats) => {
    try {
      const currentStats = dashboardData.stats;
      const mergedStats = { ...currentStats, ...newStats };
      if (mergedStats.totalMcqAttempted > 0) {
        mergedStats.mcqAccuracy = Math.round((mergedStats.mcqCorrect / mergedStats.totalMcqAttempted) * 100);
      }
      await saveDashboardStats(mergedStats);
      refreshDashboardData();
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger, currentUser]);

  const value = {
    ...dashboardData,
    refreshDashboardData,
    trackInteraction,
    updateStats,
    loadDashboardData,
    addAchievement: async () => {},
    addLearningGoal: async () => {},
    updateGoalProgress: async () => {}
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
