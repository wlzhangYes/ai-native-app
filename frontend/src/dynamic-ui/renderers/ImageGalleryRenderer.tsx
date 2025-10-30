import React from 'react';
import { Image, Card, Row, Col } from 'antd';
import type { DynamicUIComponentProps } from '../registry';

/**
 * 图片信息
 */
export interface ImageInfo {
  url: string;
  alt?: string;
  caption?: string;
}

/**
 * 图片画廊配置
 */
export interface ImageGalleryConfig {
  title?: string;
  images: ImageInfo[];
  columns?: number; // 每行显示几张图片（1-4）
  gap?: number; // 图片间距（像素）
}

/**
 * ImageGalleryRenderer - 图片画廊渲染器
 *
 * 根据配置动态渲染图片画廊，支持预览和下载
 *
 * @example
 * ```tsx
 * const config: ImageGalleryConfig = {
 *   title: '设计稿',
 *   columns: 3,
 *   images: [
 *     { url: 'https://example.com/1.jpg', caption: '首页设计' },
 *     { url: 'https://example.com/2.jpg', caption: '详情页设计' }
 *   ]
 * };
 *
 * <ImageGalleryRenderer config={config} onEvent={handleEvent} />
 * ```
 */
export const ImageGalleryRenderer: React.FC<DynamicUIComponentProps> = ({
  config,
  onEvent,
  componentId,
}) => {
  const galleryConfig = config as ImageGalleryConfig;
  const columns = Math.min(Math.max(galleryConfig.columns || 3, 1), 4);
  const gap = galleryConfig.gap || 16;

  // 计算每列的栅格数（24 / columns）
  const span = Math.floor(24 / columns);

  // 图片点击事件
  const handleImageClick = (image: ImageInfo, index: number) => {
    onEvent?.('image-click', {
      url: image.url,
      caption: image.caption,
      index,
    });
  };

  const content = (
    <div data-component="ImageGalleryRenderer" data-component-id={componentId}>
      <Image.PreviewGroup>
        <Row gutter={[gap, gap]}>
          {galleryConfig.images.map((image, index) => (
            <Col key={index} span={span}>
              <div className="relative group">
                <Image
                  src={image.url}
                  alt={image.alt || image.caption || `Image ${index + 1}`}
                  className="w-full h-48 object-cover rounded"
                  onClick={() => handleImageClick(image, index)}
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm rounded-b">
                    {image.caption}
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    </div>
  );

  // 如果有标题，使用 Card 包裹
  if (galleryConfig.title) {
    return (
      <Card title={galleryConfig.title} className="w-full">
        {content}
      </Card>
    );
  }

  return content;
};
