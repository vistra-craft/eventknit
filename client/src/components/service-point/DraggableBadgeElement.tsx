import React, { useRef, useCallback } from 'react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { QrCode, Image, GripVertical, Crown, Star, CheckCircle, Award, BadgeIcon } from 'lucide-react';
import { mmToPixels, pixelsToMm, type BadgeElement, type RibbonIcon } from '@/lib/badge-template-api';
import 'react-resizable/css/styles.css';

interface DraggableBadgeElementProps {
  element: BadgeElement;
  scale: number;
  isSelected: boolean;
  isPreviewMode: boolean;
  content: string;
  onSelect: (elementId: string) => void;
  onUpdate: (elementId: string, updates: Partial<BadgeElement>) => void;
  onUpdateComplete: () => void;
}

const DraggableBadgeElement: React.FC<DraggableBadgeElementProps> = ({
  element,
  scale,
  isSelected,
  isPreviewMode,
  content,
  onSelect,
  onUpdate,
  onUpdateComplete,
}) => {
  const nodeRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  const handleDrag = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      if (element.isLocked || isPreviewMode) return;
      isDraggingRef.current = true;

      // Convert pixels to MM
      const newX = pixelsToMm(data.x / scale);
      const newY = pixelsToMm(data.y / scale);

      onUpdate(element.id, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
    },
    [element.id, element.isLocked, isPreviewMode, scale, onUpdate]
  );

  const handleDragStop = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onUpdateComplete();
    }
  }, [onUpdateComplete]);

  const handleResize = useCallback(
    (_e: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
      if (element.isLocked || isPreviewMode) return;
      isResizingRef.current = true;

      // Convert pixels to MM
      const newWidth = pixelsToMm(size.width / scale);
      const newHeight = pixelsToMm(size.height / scale);

      onUpdate(element.id, {
        width: Math.max(5, Math.round(newWidth * 10) / 10),
        height: Math.max(3, Math.round(newHeight * 10) / 10),
      });
    },
    [element.id, element.isLocked, isPreviewMode, scale, onUpdate]
  );

  const handleResizeStop = useCallback(() => {
    if (isResizingRef.current) {
      isResizingRef.current = false;
      onUpdateComplete();
    }
  }, [onUpdateComplete]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isPreviewMode && !element.isLocked) {
        onSelect(element.id);
      }
    },
    [element.id, element.isLocked, isPreviewMode, onSelect]
  );

  const getRibbonIcon = (iconType?: RibbonIcon) => {
    const iconSize = `${Math.min((element.width * scale) / 3, (element.height * scale) / 2)}px`;
    const iconClass = "text-white drop-shadow-md";

    switch (iconType) {
      case 'crown':
        return <Crown className={iconClass} style={{ width: iconSize, height: iconSize }} />;
      case 'star':
        return <Star className={iconClass} style={{ width: iconSize, height: iconSize }} fill="currentColor" />;
      case 'check-circle':
        return <CheckCircle className={iconClass} style={{ width: iconSize, height: iconSize }} />;
      case 'award':
        return <Award className={iconClass} style={{ width: iconSize, height: iconSize }} />;
      case 'badge':
        return <BadgeIcon className={iconClass} style={{ width: iconSize, height: iconSize }} />;
      default:
        return null;
    }
  };

  const elementContent = (
    <div
      className={`h-full w-full ${element.type === 'text' ? 'flex items-center' : ''} ${
        element.isLocked ? 'cursor-not-allowed' : ''
      }`}
      style={{
        fontSize: `${(element.fontSize || 14) * scale}px`,
        fontFamily: element.fontFamily || 'Inter',
        fontWeight: element.fontWeight || 'normal',
        textAlign: element.textAlign || 'left',
        color: element.color || '#000000',
        backgroundColor: element.backgroundColor || 'transparent',
        borderRadius: `${(element.borderRadius || 0) * scale}px`,
        opacity: element.opacity || 1,
        transform: `rotate(${element.rotation || 0}deg)`,
        justifyContent:
          element.textAlign === 'center'
            ? 'center'
            : element.textAlign === 'right'
            ? 'flex-end'
            : 'flex-start',
        padding: element.type === 'text' ? `${2 * scale}px` : 0,
        overflow: 'hidden',
        position: 'relative',
      }}
      onClick={handleClick}
    >
      {element.type === 'text' && (
        <span className="whitespace-pre-wrap break-words w-full">{content}</span>
      )}
      {element.type === 'qr' && (
        <div className="w-full h-full bg-white border border-border rounded flex items-center justify-center p-1">
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-sm flex items-center justify-center">
            <QrCode className="w-1/2 h-1/2 text-white" />
          </div>
        </div>
      )}
      {element.type === 'image' && (
        <div className="w-full h-full bg-muted border border-border rounded flex items-center justify-center">
          <Image className="w-1/3 h-1/3 text-muted-foreground" />
        </div>
      )}
      {element.type === 'shape' && (
        <div className="w-full h-full" style={{ backgroundColor: element.backgroundColor }} />
      )}
      {element.type === 'ribbon' && (
        <div
          className="w-full h-full rounded flex items-center justify-center gap-2 font-bold text-white shadow-lg"
          style={{
            background:
              element.ribbonGradient ||
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {getRibbonIcon(element.ribbonIcon)}
          {content && <span className="drop-shadow-md">{content}</span>}
        </div>
      )}

      {/* Drag handle indicator - positioned inside element to stay within canvas bounds */}
      {isSelected && !isPreviewMode && !element.isLocked && (
        <div className="absolute top-1 left-1 flex items-center gap-1 bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium shadow-md backdrop-blur-sm z-10">
          <GripVertical className="w-3 h-3" />
          <span className="capitalize">{element.type}</span>
        </div>
      )}
    </div>
  );

  if (isPreviewMode || element.isLocked) {
    // Non-interactive rendering
    return (
      <div
        className={`absolute ${element.isLocked ? 'cursor-not-allowed' : ''}`}
        style={{
          left: `${mmToPixels(element.x) * scale}px`,
          top: `${mmToPixels(element.y) * scale}px`,
          width: `${mmToPixels(element.width) * scale}px`,
          height: `${mmToPixels(element.height) * scale}px`,
          zIndex: element.zIndex,
          display: element.isVisible === false ? 'none' : 'block',
        }}
      >
        {elementContent}
      </div>
    );
  }

  // Interactive draggable and resizable element
  return (
    <Draggable
      nodeRef={nodeRef}
      position={{
        x: mmToPixels(element.x) * scale,
        y: mmToPixels(element.y) * scale,
      }}
      onDrag={handleDrag}
      onStop={handleDragStop}
      disabled={element.isLocked || isPreviewMode}
      bounds="parent"
      grid={[scale, scale]} // Snap to pixel grid based on scale
    >
      <div
        ref={nodeRef}
        className="absolute"
        style={{
          zIndex: element.zIndex,
          display: element.isVisible === false ? 'none' : 'block',
        }}
      >
        <ResizableBox
          width={mmToPixels(element.width) * scale}
          height={mmToPixels(element.height) * scale}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          minConstraints={[mmToPixels(5) * scale, mmToPixels(3) * scale]}
          maxConstraints={[mmToPixels(200) * scale, mmToPixels(150) * scale]}
          resizeHandles={isSelected && !isPreviewMode ? ['se', 'sw', 'ne', 'nw'] : []}
          handle={
            isSelected && !isPreviewMode ? (
              <div className="react-resizable-handle react-resizable-handle-se">
                <div className="w-2 h-2 bg-primary rounded-full border border-white shadow-md" />
              </div>
            ) : undefined
          }
          className={`${
            isSelected && !isPreviewMode
              ? 'ring-2 ring-primary ring-offset-1 shadow-lg'
              : 'hover:ring-1 hover:ring-border'
          } transition-all duration-100`}
        >
          {elementContent}
        </ResizableBox>
      </div>
    </Draggable>
  );
};

export default DraggableBadgeElement;
