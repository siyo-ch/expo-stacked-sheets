# 邮件堆叠草稿

用 Expo 还原 iOS 邮件里多层「新邮件」叠在收件箱上的卡片交互。iOS 和 Android 用同一套堆叠卡片，没有真实邮件后端。

## 运行

需要 Node.js 22.13 或更新版本。

```bash
npm install
npx expo start
```

然后：

- 按 `i` 打开 iOS 模拟器（需要 macOS）
- 按 `a` 打开 Android 模拟器
- 用与 **Expo SDK 58** 匹配的 Expo Go 扫码

浏览器里预览：

```bash
npx expo start --web
```

## 怎么试多层草稿

1. 点右下角蓝色撰写按钮，推入第一封「新邮件」。
2. 在最前面的卡片上再点一次撰写，再推入一封。背后的卡片会略微缩小并上移，顶边露出来。
3. 只有最前面的卡片能输入。点左上角关闭、向下拖标题栏，或按系统返回，都只关掉最上面一封。

收件人、主题和正文都留在各自的草稿里。发件人是示例地址 `navigatoricsl@gmail.com`，正文下方有「发自我的 iPhone」。

## iOS 和 Android

两端视觉是同一套，不使用 Android 全屏写信加草稿列表。

- 每一封「新邮件」都是 `@react-navigation/native-stack` 上的独立页面，所以可以同时打开两封以上，而不是复用一个模态。
- native-stack 没有 `cardStyleInterpolator`。缩放、上移和滑出由 `src/navigation/sheetLayout.ts` 里的共享插值计算，再用 Reanimated 画出来。iOS 不走系统 formSheet，避免和 Android 各做一套。
- Android 系统返回和预测性返回（`predictiveBackGestureEnabled`）只弹出最上面的那一页，因此只关闭最上面一封草稿。iOS 没有系统返回键，用关闭按钮或下拉标题栏。

## 检查

```bash
npm test
npm run typecheck
```
