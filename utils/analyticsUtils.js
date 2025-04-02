const fs = require('fs');
const path = require('path');
const { getDataFromFile, writeToFile } = require('./ioUtils');
const { createDecipheriv } = require('crypto');

class AnalyticsManager {
  constructor() {
    this.stats = {
      totalJobsApplied: 0,
      totalQuestionsAnswered: 0,
      totalEmailsSent: 0,
      lastUpdated: new Date().toISOString(),
      createDate: new Date().toISOString(),
      dailyStats: {}
    };
  }

  async loadStats(userId) {
    try {
      const stats = await getDataFromFile('analytics', userId);
      if (stats) {
        this.stats = stats;
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  async saveStats(userId) {
    try {
      this.stats.lastUpdated = new Date().toISOString();
      await writeToFile(this.stats, 'analytics', userId);
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  }

  incrementJobsApplied() {
    this.stats.totalJobsApplied++;
    this.updateDailyStats('jobsApplied');
  }

  incrementQuestionsAnswered() {
    this.stats.totalQuestionsAnswered++;
    this.updateDailyStats('questionsAnswered');
  }

  incrementEmailsSent() {
    this.stats.totalEmailsSent++;
    this.updateDailyStats('emailsSent');
  }

  setCreateDate(userId) {
    this.stats.createDate = new Date().toISOString();
    this.saveStats(userId);
  }

  updateDailyStats(type) {
    const today = new Date().toISOString().split('T')[0];
    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = {
        jobsApplied: 0,
        questionsAnswered: 0,
        emailsSent: 0
      };
    }
    this.stats.dailyStats[today][type]++;
  }

  getStats() {
    return {
      ...this.stats,
      dailyStats: this.getLast7DaysStats()
    };
  }

  getLast7DaysStats() {
    const today = new Date();
    const last7Days = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if(this.stats.dailyStats[dateStr])  last7Days[dateStr] = this.stats.dailyStats[dateStr];
    }
    
    return last7Days;
  }
}

// Create a singleton instance
const analyticsManager = new AnalyticsManager();

module.exports = analyticsManager; 