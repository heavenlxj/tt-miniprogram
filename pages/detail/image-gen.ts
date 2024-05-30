const app = getApp();

interface GeneratedImage {
  data: {
    url: string,
    id: string,
  },
}

Page({
  data: {
    uploadedImageUrl: '', // Default uploaded image
    promptText: '', // User input for prompt text
    selectedImageName: '', // Selected image name from the dropdown
    selectedImageId: '',
    selectedImagePath: '',
    categoryList: [], // List of categories from the backend
    selectedCategory: '', // Selected category ID
    categoryImages: [], // List of images based on the selected category
    generatedImageSrc: '',
    apiBaseUrl: app.globalData.apiBaseUrl,
    userToken: app.globalData.userToken,
    containerWidth: 300, // Set a default width
    containerHeight: 200, // Set a default height
    humanId: 0,
  },

  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
  },

  // Event handler for input prompt text
  onInputPromptText: function (event) {
    this.setData({
      promptText: event.detail.value,
    });
  },

  async onUploadImage() {
    try {
      const res = await wx.chooseImage({
        count: 1, // Limit to 1 image selection
        sizeType: ['original', 'compressed'], 
        sourceType: ['album', 'camera'], 
      });

      console.log("TempFile path:" + res.tempFilePaths)
      const tempFilePaths = res.tempFilePaths;
      const imagePath = tempFilePaths[0];

      wx.getFileSystemManager().saveFile({
        tempFilePath: imagePath,
        success: (savedRes) => {
          console.log('Temporary file saved:', savedRes.savedFilePath);
          this.setData({
            uploadedImageUrl: savedRes.savedFilePath,
          });
          // You can do additional processing with the saved file if needed
        },
        fail: (error) => {
          console.error('Failed to save temporary file:', error);
        },
      });
    } catch (error) {
      console.error('Failed to choose image:', error);
    }


  },

    // Method to handle navigation to "category-select" page
    onNavigateToCategorySelect() {
      wx.navigateTo({
        url: '/pages/effect/category-select',
      });
    },


  async onGenerateImage() {
    try {
      // Show loading indicator
      wx.showLoading({
        title: '正在生成图片...',
      });
  
      // Read the two selected images from the local file system
      const sourceImage = this.data.uploadedImageUrl;
      const faceIndex = this.data.humanId;
      // Call the API to generate the new image
      console.log("Select ImageId: " + this.data.selectedImageId)
      const imageData = await this.callGenerateImageApi(sourceImage, faceIndex, this.data.selectedImageId);
  
      console.log("图片生成完成, image url: "+ imageData.url)
      // After generating the image, hide the loading indicator
      this.setData( {
          generatedImageSrc: this.data.apiBaseUrl + imageData.url
      }
      )

      wx.hideLoading();

      this.getImageInfo();
      console.log("获取图片的信息完成")
    } catch (error) {
      // Hide the loading indicator in case of an error
      wx.hideLoading();
  
      // Print an error message
      console.error('图片生成失败:', error);
    }
  },

  
  // Helper method to call the API and generate the new image
  callGenerateImageApi(imageUrl: string, face_index: number, targetImageId: string) {
    return new Promise((resolve, reject) => {
      const userToken = this.data.userToken;
      const apiUrl = `${this.data.apiBaseUrl}/api/face_swap`;
      wx.uploadFile({
        url: apiUrl,
        filePath: imageUrl, 
        name: 'file', 
        formData: {
          target_image_id: targetImageId,
          t_face_index: face_index,
        }, 
        header: {
          access_token: userToken
        },
        success: (res) => {
          if (res.statusCode === 200) {
            console.log('图片生成成功')
            console.log('图片数据:' + res)
            const data = JSON.parse(res.data);
            resolve(data.data)
          } else {
            console.error(res);
            reject('图片上传失败');
          }
        },
        fail: (error) => {
          console.error(error);
          reject(error);
        },
      });
    });
  },

  getImageInfo() {
    // Calculate the aspect ratio of the generated image
    wx.getImageInfo({
      src: this.data.generatedImageSrc,
      success: (res) => {
        const imageWidth = res.width;
        const imageHeight = res.height;
        console.debug('生成图片宽度: '+ imageWidth);
        console.debug('生成图片高度: '+ imageHeight);
        const aspectRatio = res.width / res.height;
        const screenWidth = wx.getSystemInfoSync().windowWidth;
        
        // Set the width and height of the container
        this.setData({
          containerWidth: screenWidth,
          containerHeight: screenWidth / aspectRatio,
        });
      },
      fail: (error) => {
        console.error('Failed to get image info:', error);
      },
    });
  },



  onShareAppMessage: function () {
    return {
      title: '分享图片给朋友',
      imageUrl: this.data.generatedImageSrc,
      success: (res) => {
        console.log('分享成功', res);
      },
      fail: (error) => {
        console.error('分享失败', error);
      },
    };
  },

  saveImage: function () {
    // Save the image to the user's photo album
    wx.saveImageToPhotosAlbum({
      filePath: this.data.generatedImageSrc,
      success: (res) => {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
        });
      },
      fail: (error) => {
        console.debug(error);
        if (error.errMsg !== 'saveImageToPhotosAlbum:fail cancel') {
          // 处理保存失败
          wx.showToast({
            title: '保存失败',
            icon: 'none',
          });
        }
        // 关闭弹窗
        this.hideImageModal();

      },
    });
  },

  previewImage: function (event) {
    const previewImage = event.currentTarget.dataset.previewImage;
    wx.previewImage({
      urls: [previewImage],
      current: previewImage,
    });
  },


  onHumanIdInput(event) {
    const humanId = event.detail.value;
    // 将获取的人物序号存储到页面数据中
    this.setData({
      humanId: humanId,
    });
  },


});
