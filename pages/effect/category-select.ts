// category-select.ts
const app = getApp();
interface ImageData {
  id: string;
  url: string;
  title: string;
  category: string;
  created_at: string;
}

interface CategoryData {
  category: string;
  images: ImageData[];
}

Page({
  data: {
    uploadedImageUrl: '',
    categories: [] as any[], // List of categories from the API
    selectedCategory: '', // Currently selected category
    selectedCategoryImages: [], // Images under the selected 
    selectedCategoryIndex: 0, // 默认选中的分类索引
    apiBaseUrl: app.globalData.apiBaseUrl,
    userToken: app.globalData.userToken,
    userId: app.globalData.userId,
  },

  onLoad() {
    console.log("获取到的用户信息:")
    console.log(app.globalData.userInfo)
     this.loadCategoriesAndImages();
  },

   loadCategoriesAndImages() {
    
    try {
      wx.request({
        url: `${this.data.apiBaseUrl}/api/image_gallery`,
        method: 'GET',
        success: (res) => {
          const categoriesData: CategoryData[] = res.data;
          // 添加"自定义"分类并加载用户图片数据
          const customCategory = {
            category: "自定义",
            images: [],
          };
          categoriesData.push(customCategory);

          this.loadUserImagesIntoCategory(customCategory);

          this.setData({
            categories: categoriesData,
          });

          // Load the default category (e.g., '热门')
          const defaultCategory = categoriesData[0].category;
          if (defaultCategory) {
            this.loadCategoryImages(defaultCategory);
          }
        }
      });

    } catch (error) {
      console.error('Error loading categories and images:', error);
    }
  },

  onSelectCategory(event: any) {
    const selectedCategory = event.currentTarget.dataset.categoryId;
    this.setData({
      selectedCategory: selectedCategory,
    });

    this.loadCategoryImages(selectedCategory);
  },

  async loadCategoryImages(category: string) {
    const selectedCategoryData = this.data.categories.find(item => item.category === category);
    if (selectedCategoryData) {
      const images = selectedCategoryData.images.map(image => ({
        ...image,
        url: this.data.apiBaseUrl + image.url,
        isCustomFirst: false,
      }));

    // 设置自定义分类下的第一个元素为 true
    if (category === '自定义' && images.length > 0) {
      images[0].isCustomFirst = true;
    }

      this.setData({
        selectedCategoryImages: images,
      });
    }
  },

  // Method to handle image selection
  onSelectImage(event: any) {
    const imageId = event.currentTarget.dataset.imageId;
    const imageName = event.currentTarget.dataset.imageName;
    const imagePath = event.currentTarget.dataset.imagePath;
    const isCustomFirst = event.currentTarget.dataset.isCustomFirst; 
    console.log("Selected ImageId: " + imageId)
    console.log("Selected ImageName: " + imageName)
    console.log("Selected ImagePath: " + imagePath)
    console.log("isCustomFirst:" + isCustomFirst)
    // Implement the logic to handle image selection as needed
    // For example, close the page and update the dropdown component with the selected image's ID and name.
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const prevPage = pages[pages.length - 2];
      if (prevPage.data) {
        prevPage.setData({
          selectedImageId: imageId,
          selectedImageName: imageName,
          selectedImagePath: imagePath,
        });
      }
    }
    wx.navigateBack();
  },


  async loadUserImagesIntoCategory(targetCategory: CategoryData) {
    try {
      // 获取用户图片数据
      const userId = this.data.userId;
      const userToken = this.data.userToken;
      console.log("userId:", userId);
      console.log("userToken:", userToken);
      wx.request({
        url: `${this.data.apiBaseUrl}/api/images/users/${userId}/_custom`,
        method: 'GET',
        header: {
          access_token: userToken,
        },
        success:(res) => {
          const userImages = res.data;
          // 加载用户图片数据到目标分类中
  
          targetCategory.images = [
            {
              id: "upload", // 虚拟的id
              url: "/images/detail/upload.png", // 无实际图片地址
              title: "上传图片", // 显示文本
              category: "_generated", // 分类
              created_at: "", // 创建时间
            },
            ...userImages, // 添加用户图片数据
          ];
        }
      });

    } catch (error) {
      console.error('Error loading user images:', error);
    }
  },

  async onUploadImageForCustomCategory() {
    try {
      const res = await wx.chooseImage({
        count: 1, // 最多选择一张图片
        sizeType: ['original', 'compressed'],
        sourceType: ['album'],
      });

      const tempFilePath = res.tempFilePaths[0];
      const curUserOpenId = app.globalData.userInfo.openid;
      console.log("Upload, 当前用户openid:"+ curUserOpenId);
      // 调用上传图片的接口，并等待上传完成
      await wx.uploadFile({
        url: `${this.data.apiBaseUrl}/api/upload_file`,
        filePath: tempFilePath,
        name: 'file',
        formData:{
          user_id: curUserOpenId,
        },
        success: (res) => {
          console.log("图片上传成功");
          const uploadImageData = JSON.parse(res.data);
          const uploadedImageUrl = uploadImageData.url;
          const uploadedImageId = uploadImageData.id;
                // 刷新自定义分类的图片数据
          const customCategory = this.data.categories.find(
            (category) => category.category === "自定义"
          );
          const imageInfo = {
            id: uploadedImageId, // 虚拟的id
            url: uploadedImageUrl,
            title: "已上传图片", // 显示文本
            category: "_custom", // 分类
            created_at: new Date().toISOString(), // 创建时间
          }
          if (customCategory) {
            customCategory.images.splice(1, 0, {
              ...imageInfo,
              isCustomFirst: false, // 不是自定义分类的第一个元素
            });
          }
          this.setData({
            categories: this.data.categories,
            selectedCategoryImages: customCategory.images.map((img, index) => {
              return {
                ...img,
                url: this.data.apiBaseUrl + img.url,
                isCustomFirst: index === 0,
              }
            })
          }, () => {
            console.log('setData callback: Page data updated');
          });
          console.log("图片上传成功");

          wx.showToast({
            title: "图片上传成功",
            icon: "success",
            duration: 2000,
          });
        },
        fail:(error) => {
            console.log("图片上传失败");
            wx.showToast({
              title: "图片上传失败",
              icon: "error",
              duration: 2000,
            });
        }
      });


    } catch (error) {
      console.error('Error uploading image:', error);
    }
  },


});
