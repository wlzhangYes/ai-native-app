// Three-Column Layout Component
// Based on spec.md FR-001 to FR-005: 3:2:5 ratio, responsive, draggable dividers

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Layout, Flex } from 'antd';

interface ThreeColumnLayoutProps {
  left: ReactNode;
  middle: ReactNode;
  right: ReactNode;
}

export function ThreeColumnLayout({ left, middle, right }: ThreeColumnLayoutProps) {
  // Load saved column widths from LocalStorage or use defaults (3:2:5 = 30%, 20%, 50%)
  const [columnWidths, setColumnWidths] = useState<{
    left: number;
    middle: number;
    right: number;
  }>(() => {
    const saved = localStorage.getItem('columnWidths');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { left: 30, middle: 20, right: 50 };
      }
    }
    return { left: 30, middle: 20, right: 50 };
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);

  // Save column widths to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Handle divider drag
  const handleMouseDown = (divider: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(divider);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const mouseX = e.clientX;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const relativeX = mouseX - containerLeft;
      const percentage = (relativeX / containerWidth) * 100;

      if (isDragging === 'left') {
        // Dragging left divider: adjust left and middle columns
        const newLeft = Math.max(15, Math.min(50, percentage)); // Min 15%, max 50%
        const remainingWidth = 100 - newLeft;
        const middleRatio = columnWidths.middle / (columnWidths.middle + columnWidths.right);
        const newMiddle = remainingWidth * middleRatio;
        const newRight = remainingWidth - newMiddle;

        setColumnWidths({
          left: newLeft,
          middle: newMiddle,
          right: newRight,
        });
      } else if (isDragging === 'right') {
        // Dragging right divider: adjust middle and right columns
        const newLeftPlusMiddle = Math.max(30, Math.min(85, percentage)); // Min 30%, max 85%
        const newMiddle = newLeftPlusMiddle - columnWidths.left;
        const newRight = 100 - newLeftPlusMiddle;

        if (newMiddle >= 10 && newRight >= 15) {
          // Ensure minimum widths
          setColumnWidths({
            left: columnWidths.left,
            middle: newMiddle,
            right: newRight,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, columnWidths]);

  return (
    <Layout
      ref={containerRef}
      className={`three-column-layout h-screen ${isDragging ? 'select-none' : 'select-auto'}`}
    >
      <Flex className="h-full overflow-hidden">
        {/* Left Column - Always visible, takes full width on mobile */}
        <div
          className="column-left scrollbar-thin h-full overflow-auto bg-white w-full lg:w-auto lg:border-r lg:border-gray-300 lg:min-w-[300px]"
          style={{
            width: `${columnWidths.left}%`,
          }}
        >
          {left}
        </div>

        {/* Left Divider (draggable) - Hidden on mobile/tablet */}
        <div
          className={`column-divider hidden lg:block w-1 h-full cursor-col-resize ${
            isDragging === 'left' ? 'bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
          } ${isDragging ? '' : 'transition-colors duration-150'}`}
          onMouseDown={handleMouseDown('left')}
        />

        {/* Middle Column - Visible from lg (1024px+) */}
        <div
          className="column-middle hidden lg:block scrollbar-thin h-full overflow-auto border-r border-gray-300 bg-white"
          style={{
            width: `${columnWidths.middle}%`,
            minWidth: '200px',
          }}
        >
          {middle}
        </div>

        {/* Right Divider (draggable) - Visible from xl (1280px+) */}
        <div
          className={`column-divider hidden xl:block w-1 h-full cursor-col-resize ${
            isDragging === 'right' ? 'bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
          } ${isDragging ? '' : 'transition-colors duration-150'}`}
          onMouseDown={handleMouseDown('right')}
        />

        {/* Right Column - Visible from xl (1280px+) */}
        <div
          className="column-right hidden xl:block scrollbar-thin h-full overflow-auto bg-white"
          style={{
            width: `${columnWidths.right}%`,
            minWidth: '400px',
          }}
        >
          {right}
        </div>
      </Flex>
    </Layout>
  );
}
