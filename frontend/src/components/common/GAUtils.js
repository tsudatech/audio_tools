import ReactGA from "react-ga4";

const ga = {
  isInitialized: false,

  initGoogleAnalytics() {
    ReactGA.initialize("G-JM9CMHLBLK");
    this.isInitialized = true;
  },
  setOption(key, value) {
    if (this.isInitialized) {
      ReactGA.set({ [key]: value });
    }
  },
  setUserId(userId) {
    if (this.isInitialized) {
      this.setOption("userId", userId);
    }
  },
  sendData(type, data) {
    if (this.isInitialized) {
      ReactGA.send({ hitType: type, ...data });
    }
  },
  trackPageView(pageTitle, pagePath) {
    if (this.isInitialized) {
      this.sendData(HitTypes.PageView, { page: pagePath, title: pageTitle });
    }
  },
  trackEventBuilder(categoryName) {
    return (options) => {
      if (this.isInitialized) {
        ReactGA.event({ category: categoryName, ...options });
      }
    };
  },
};

export default ga;
