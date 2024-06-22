Page({
  data: {
    // 数据初始化
  },
  
  startCreating() {
    console.log("跳转到首页");
    tt.switchTab({
      url: '/pages/scenarios/scenario',
      success: function(res) {
        console.log("Navigation success");
      },
      fail: function(err) {
        console.error("Navigation failed", err);
      }
    });
  }
});