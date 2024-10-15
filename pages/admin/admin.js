const app = getApp()

Page({
  data: {
    users: []
  },
  onLoad() {
    if (app.globalData.isAdmin) {
      this.fetchUsers()
    } else {
      wx.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      wx.navigateBack()
    }
  },
  fetchUsers() {
    wx.request({
      url: 'http://your-api-url/admin/users',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({
          users: res.data
        })
      }
    })
  },
  toggleAdmin(e) {
    const userId = e.currentTarget.dataset.id
    const isAdmin = e.detail.value
    wx.request({
      url: `http://your-api-url/admin/users/${userId}`,
      method: 'PUT',
      data: {
        is_admin: isAdmin
      },
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
      }
    })
  }
})