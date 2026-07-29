# 一盏余额

Expo React Native TypeScript 本地原型。

## 运行

```bash
npm install
npx expo start -c
```

## 网页版

推送到 `master` 后，GitHub Actions 会自动构建并发布网页版本到 GitHub Pages。

## 图像使用

- UI 最终参考图：仅用于页面布局、颜色、间距和卡片层级的还原，不会作为页面背景使用。
- `assets/app-icon.png`：使用用户确认的第二张图，已配置为 Expo `icon`、Android `adaptiveIcon.foregroundImage` 和 splash 图标。

## 已实现

- 三页底部导航：首页、计划、我的
- 收入/支出录入与余额、四档灯光联动
- AsyncStorage 持久化
- 多目标轮播、优先级切换、目标存入
- 图鉴、年度总结和设置入口
