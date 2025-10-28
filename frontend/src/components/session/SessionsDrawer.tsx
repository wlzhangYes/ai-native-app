// Sessions Drawer Component - Collapsible Sidebar for Session Management
// Based on layout optimization: Method 2 (Collapsible Sidebar)

import { Drawer } from 'antd';
import { SessionsList } from './SessionsList';

interface SessionsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SessionsDrawer({ open, onClose }: SessionsDrawerProps) {
  return (
    <Drawer
      title={null}
      placement="left"
      onClose={onClose}
      open={open}
      width={320}
      closable={false}
      styles={{
        body: { padding: 0 },
        header: { display: 'none' },
      }}
    >
      <SessionsList />
    </Drawer>
  );
}
