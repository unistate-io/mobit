// src/vendor.d.ts 或 src/global.d.ts

declare module "@exact-realty/multipart-parser/dist/encodeMultipartMessage" {
  // 尝试从实际的 .js 文件或其类型定义中找到 TDecodedMultipartMessage 的结构
  // 如果找不到，或者作为临时方案，可以使用 any
  export type TDecodedMultipartMessage = any;
  // 或者，如果该模块实际导出了一个名为 TDecodedMultipartMessage 的东西，可以这样：
  // export { TDecodedMultipartMessage } from '@exact-realty/multipart-parser'; // 假设它从主入口导出
}

declare module "@exact-realty/multipart-parser/dist/types" {
  export type TTypedArray = any;
  // export { TTypedArray } from '@exact-realty/multipart-parser'; // 假设它从主入口导出
}
