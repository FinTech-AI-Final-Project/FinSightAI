import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications not available on web platform');
      return;
    }

    try {
      // Request permissions
      const localPermission = await LocalNotifications.requestPermissions();
      const pushPermission = await PushNotifications.requestPermissions();
      
      console.log('Local notification permissions:', localPermission);
      console.log('Push notification permissions:', pushPermission);
      
      // Register for push notifications
      if (pushPermission.receive === 'granted') {
        await PushNotifications.register();
      }
      
      // Add listeners
      this.addListeners();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  addListeners() {
    // Listen for push notification registration
    PushNotifications.addListener('registration', (token) => {
      console.log('Push notification token:', token.value);
      // You can send this token to your backend to send push notifications
    });

    // Listen for push notification errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push notification registration error:', error);
    });

    // Listen for incoming push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
    });

    // Listen for push notification taps
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed:', notification);
    });

    // Listen for local notification taps
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed:', notification);
    });
  }

  // Schedule a local notification
  async scheduleLocalNotification(options) {
    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        console.log('Local notifications not permitted');
        return false;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: options.title,
            body: options.body,
            id: options.id || Math.floor(Math.random() * 10000),
            schedule: options.schedule || { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: options.attachments || [],
            actionTypeId: options.actionTypeId || '',
            extra: options.extra || {}
          }
        ]
      });

      return true;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return false;
    }
  }

  // Schedule budget alert notification
  async scheduleBudgetAlert(budgetName, spentAmount, budgetAmount) {
    const percentage = Math.round((spentAmount / budgetAmount) * 100);
    
    return this.scheduleLocalNotification({
      title: 'Budget Alert! 🚨',
      body: `You've spent ${percentage}% of your ${budgetName} budget`,
      extra: { type: 'budget_alert', budgetName, percentage }
    });
  }

  // Schedule expense reminder
  async scheduleExpenseReminder() {
    return this.scheduleLocalNotification({
      title: 'Don\'t forget to log your expenses! 📊',
      body: 'Keep track of your spending to stay on budget',
      schedule: { at: new Date(Date.now() + 24 * 60 * 60 * 1000) }, // 24 hours from now
      extra: { type: 'expense_reminder' }
    });
  }

  // Schedule weekly report notification
  async scheduleWeeklyReport() {
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(9, 0, 0, 0); // 9 AM on Sunday

    return this.scheduleLocalNotification({
      title: 'Your Weekly Financial Report is Ready! 📈',
      body: 'See how you did this week and get insights for next week',
      schedule: { at: nextSunday },
      extra: { type: 'weekly_report' }
    });
  }

  // Schedule AI tip notification
  async scheduleAITipNotification(tip) {
    return this.scheduleLocalNotification({
      title: 'AI Financial Tip 💡',
      body: tip.substring(0, 100) + (tip.length > 100 ? '...' : ''),
      extra: { type: 'ai_tip', fullTip: tip }
    });
  }

  // Test notification
  async testNotification() {
    return this.scheduleLocalNotification({
      title: 'Test Notification 🔔',
      body: 'Notifications are working correctly!',
      extra: { type: 'test' }
    });
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await LocalNotifications.cancel({ notifications: [] });
      return true;
    } catch (error) {
      console.error('Error canceling notifications:', error);
      return false;
    }
  }

  // Get pending notifications
  async getPendingNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  // Check if notifications are available
  isAvailable() {
    return Capacitor.isNativePlatform() && this.isInitialized;
  }

  // For web platform, show browser notification (if supported)
  async showWebNotification(title, body, options = {}) {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo192.png',
        ...options
      });
      return true;
    }

    return false;
  }

  // Unified notification method that works on both web and mobile
  async notify(title, body, options = {}) {
    if (this.isAvailable()) {
      return this.scheduleLocalNotification({ title, body, ...options });
    } else {
      return this.showWebNotification(title, body, options);
    }
  }
}

export default new NotificationService();
