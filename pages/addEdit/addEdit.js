const app = getApp()

Page({
  data: {
    contact: {},
    genders: ['男', '女'],
    genderIndex: 0
  },
  onLoad(options) {
    if (options.id) {
      this.fetchContact(options.id)
    }
  },
  fetchContact(id) {
    wx.request({
      url: `http://your-api-url/contacts/${id}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({
          contact: res.data,
          genderIndex: res.data.gender === '男' ? 0 : 1
        })
      }
    })
  },
  inputName(e) {
    this.setData({
      'contact.name': e.detail.value
    })
  },
  inputPhone(e) {
    this.setData({
      'contact.phone': e.detail.value
    })
  },
  inputDepartment(e) {
    this.setData({
      'contact.department': e.detail.value
    })
  },
  selectGender(e) {
    this.setData({
      genderIndex: e.detail.value,
      'contact.gender': this.data.genders[e.detail.value]
    })
  },
  saveContact() {
    const url = this.data.contact.id ? 
      `http://your-api-url/contacts/${this.data.contact.id}` :
      'http://your-api-url/contacts'
    const method = this.data.contact.id ? 'PUT' : 'POST'

    wx.request({
      url: url,
      method: method,
      data: this.data.contact,
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        wx.navigateBack()
      }
    })
  }
})