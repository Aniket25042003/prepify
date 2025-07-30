// Google Analytics 4 enhanced tracking
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-XWBFS21D73', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

// Custom events for your app
export const analytics = {
  // Interview events
  startInterview: (interviewType: string) => {
    trackEvent('start_interview', {
      interview_type: interviewType,
    });
  },
  
  completeInterview: (interviewType: string, duration: number) => {
    trackEvent('complete_interview', {
      interview_type: interviewType,
      duration_minutes: Math.round(duration / 60),
    });
  },
  
  // User engagement
  signUp: (method: string) => {
    trackEvent('sign_up', {
      method: method, // 'google' or 'github'
    });
  },
  
  login: (method: string) => {
    trackEvent('login', {
      method: method,
    });
  },
  
  // Coding platform clicks
  clickCodingPlatform: (platform: string) => {
    trackEvent('click_coding_platform', {
      platform_name: platform,
    });
  },
  
  // Page engagement
  viewDashboard: () => {
    trackEvent('view_dashboard');
  },
  
  openAuthModal: () => {
    trackEvent('open_auth_modal');
  },
}; 