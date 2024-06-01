interface Scene {
  id: number;
  name: string;
  description: string;
  image: string;
}

Page({
  data: {
    sceneList: [] as Scene[], // 场景列表数据，初始为空
  },

  onLoad: function () {

    tt.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  

    // 模拟接口数据，这里使用本地数据作为场景列表
    const mockData = {
      code: 0,
      msg: 'OK',
      data: {
        page: 1,
        total: 1,
        list: [
          // {
          //   id: 1,
          //   name: '换脸达人',
          //   description: '上传自拍照，选择喜欢的特效场景帮您替换为当前的特效',
          //   image: '/images/scenarios/image1.jpg',
          //   type: 'swap_face',
          // },
          {
            id: 1,
            name: '视频风格转换',
            description: '上传一段视频, 选择不同的风格为您转换成目标风格',
            image: '/images/scenarios/video.png',
            type: 'video_style'
          },
        ],
      },
    };

    this.setData({
      sceneList: mockData.data.list,
    });
  },
  onCreateTap: function (event) {
    const type = event.currentTarget.dataset.type;
    if (type === 'swap_face') {
      tt.navigateTo({
        url: '/pages/detail/image-gen',
      });
    } else if (type === 'video_style') {
      tt.navigateTo({
        url: '/pages/video/video-gen',
      });
    }
  },

});