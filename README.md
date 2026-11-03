# 上下文液压机

DeepSeek Harness 会话输入栏的压缩工具。点「液压机」打开面板，再触发当前会话的原生压缩。压缩期间可以切换会话，原请求仍只作用于发起时的会话。压缩前后用量来自 Harness 的上下文用量估算。
![Uploading 6abf526012ffa80c871a1b8213996502.png…]()


## 安装

从 [GitHub Releases](https://github.com/kuangre123/dsh-context-press/releases/latest) 下载 `dsh-context-press-0.1.2.tgz`，使用 Harness 插件管理器添加该文件，或在 macOS 运行：

```sh
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add "file:/绝对路径/dsh-context-press-0.1.2.tgz"
```

重新启动 Harness 后，在已有会话的输入栏查看入口。移除时在插件管理器卸载，或用相同 CLI 执行 `plugin --profile desktop remove dsh-context-press`。

## 构建

`npm ci && npm run build && npm pack`
