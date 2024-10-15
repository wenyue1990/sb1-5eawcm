const app = getApp()

Page({
  data: {
    phone: '',
    password: ''
  },
  inputPhone(e) {
    this.setData({
      phone: e.detail.value
    })
  },
  inputPassword(e) {
    this.setData({
      password: e.detail.value
    })
  },
  login() {
    wx.request({
      url: 'http://your-api-url/login',
      method: 'POST',
      data: {
        phone: this.data.phone,
        password: this.data.password
      },
      success: (res) => {
        if (res.data.token) {
          app.globalData.token = res.data.token
          app.globalData.isAdmin = res.data.isAdmin
          wx.setStorageSync('token', res.data.token)
          wx.setStorageSync('isAdmin', res.data.isAdmin)
          wx.switchTab({
            url: '/pages/contacts/contacts'
          })
        } else {
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          })
        }
      }
    })
  }
})