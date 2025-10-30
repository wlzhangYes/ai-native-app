import React, { useState } from 'react';
import { Table, Card } from 'antd';
import type { TableProps, ColumnType } from 'antd/es/table';
import type { DynamicUIComponentProps } from '../registry';

/**
 * 表格列配置
 */
export interface TableColumnConfig {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sorter?: boolean;
  fixed?: 'left' | 'right';
}

/**
 * 表格配置
 */
export interface TableRendererConfig {
  title?: string;
  columns: TableColumnConfig[];
  dataSource: Array<Record<string, any>>;
  pagination?: boolean | { pageSize?: number; showSizeChanger?: boolean };
  bordered?: boolean;
  size?: 'small' | 'middle' | 'large';
  rowKey?: string; // 数据行的唯一标识字段名，默认 'id'
}

/**
 * TableRenderer - 表格渲染器
 *
 * 根据配置动态渲染表格，支持排序、筛选、分页
 *
 * @example
 * ```tsx
 * const config: TableRendererConfig = {
 *   title: '用户列表',
 *   columns: [
 *     { title: '姓名', dataIndex: 'name', sorter: true },
 *     { title: '年龄', dataIndex: 'age', sorter: true },
 *     { title: '地址', dataIndex: 'address' }
 *   ],
 *   dataSource: [
 *     { id: 1, name: '张三', age: 28, address: '北京' },
 *     { id: 2, name: '李四', age: 32, address: '上海' }
 *   ],
 *   pagination: { pageSize: 10 }
 * };
 *
 * <TableRenderer config={config} onEvent={handleEvent} />
 * ```
 */
export const TableRenderer: React.FC<DynamicUIComponentProps> = ({
  config,
  onEvent,
  componentId,
}) => {
  const tableConfig = config as TableRendererConfig;
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 转换列配置为 Ant Design Table 列配置
  const columns: ColumnType<any>[] = tableConfig.columns.map((col) => {
    const column: ColumnType<any> = {
      title: col.title,
      dataIndex: col.dataIndex,
      key: col.key || col.dataIndex,
      width: col.width,
      align: col.align,
      fixed: col.fixed,
    };

    // 添加排序功能
    if (col.sorter) {
      column.sorter = (a, b) => {
        const aVal = a[col.dataIndex];
        const bVal = b[col.dataIndex];

        // 数字排序
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal - bVal;
        }

        // 字符串排序
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal);
        }

        return 0;
      };
    }

    return column;
  });

  // 分页配置
  const paginationConfig: TableProps<any>['pagination'] =
    tableConfig.pagination === false
      ? false
      : typeof tableConfig.pagination === 'object'
        ? {
            pageSize: tableConfig.pagination.pageSize || 10,
            showSizeChanger: tableConfig.pagination.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }
        : {
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条`,
          };

  // 行选择配置
  const rowSelection: TableProps<any>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys, selectedRows) => {
      setSelectedRowKeys(newSelectedRowKeys);
      onEvent?.('selection-change', {
        selectedRowKeys: newSelectedRowKeys,
        selectedRows,
      });
    },
  };

  // 行点击事件
  const handleRowClick = (record: any, index?: number) => {
    onEvent?.('row-click', {
      record,
      index,
    });
  };

  const tableElement = (
    <Table
      columns={columns}
      dataSource={tableConfig.dataSource}
      rowKey={tableConfig.rowKey || 'id'}
      pagination={paginationConfig}
      bordered={tableConfig.bordered}
      size={tableConfig.size || 'middle'}
      rowSelection={rowSelection}
      onRow={(record, index) => ({
        onClick: () => handleRowClick(record, index),
        className: 'cursor-pointer hover:bg-gray-50',
      })}
      data-component="TableRenderer"
      data-component-id={componentId}
    />
  );

  // 如果有标题，使用 Card 包裹
  if (tableConfig.title) {
    return (
      <Card title={tableConfig.title} className="w-full">
        {tableElement}
      </Card>
    );
  }

  return <div className="w-full">{tableElement}</div>;
};
