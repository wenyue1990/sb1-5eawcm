App({
  globalData: {
    userInfo: null,
    isAdmin: false,
    token: null
  },
  onLaunch() {
    // 检查是否有存储的登录信息
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isAdmin = wx.getStorageSync('isAdmin');
      wx.switchTab({
        url: '/pages/contacts/contacts'
      });
    }
  }
})