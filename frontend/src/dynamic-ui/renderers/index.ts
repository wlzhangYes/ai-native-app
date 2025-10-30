/**
 * Dynamic UI Renderers
 *
 * 业务组件渲染器，自动注册到 ComponentRegistry
 */

import { componentRegistry } from '../registry';
import { FormRenderer } from './FormRenderer';
import { CardRenderer } from './CardRenderer';
import { ImageGalleryRenderer } from './ImageGalleryRenderer';
import { TableRenderer } from './TableRenderer';

/**
 * 注册所有渲染器
 *
 * 在应用启动时调用此函数，将所有渲染器注册到 ComponentRegistry
 */
export function registerAllRenderers() {
  componentRegistry.registerBatch({
    Form: FormRenderer,
    Card: CardRenderer,
    ImageGallery: ImageGalleryRenderer,
    Table: TableRenderer,
  });

  console.log('[Dynamic UI] Registered renderers:', componentRegistry.getRegisteredNames());
}

// 导出所有渲染器（供外部直接使用）
export { FormRenderer } from './FormRenderer';
export type { FormConfig, FormFieldConfig } from './FormRenderer';

export { CardRenderer } from './CardRenderer';
export type { CardConfig, CardAction } from './CardRenderer';

export { ImageGalleryRenderer } from './ImageGalleryRenderer';
export type { ImageGalleryConfig, ImageInfo } from './ImageGalleryRenderer';

export { TableRenderer } from './TableRenderer';
export type { TableRendererConfig, TableColumnConfig } from './TableRenderer';
