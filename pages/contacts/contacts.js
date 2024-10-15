const app = getApp()

Page({
  data: {
    contacts: [],
    searchQuery: ''
  },
  onLoad() {
    this.fetchContacts()
  },
  fetchContacts() {
    wx.request({
      url: 'http://your-api-url/contacts',
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({
          contacts: res.data
        })
      }
    })
  },
  searchInput(e) {
    this.setData({
      searchQuery: e.detail.value
    })
    // 实现搜索逻辑
  },
  addContact() {
    wx.navigateTo({
      url: '/pages/addEdit/addEdit'
    })
  },
  editContact(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/addEdit/addEdit?id=${id}`
    })
  }
})