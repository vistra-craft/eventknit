import { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedImage: string) => void;
  aspectRatio?: number; // width/height ratio
}

export const ImageCropper = ({ image, isOpen, onClose, onCrop, aspectRatio = 16 / 9 }: ImageCropperProps) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Calculate bounds based on zoom level
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const img = imageRef.current;
      
      // Get natural image dimensions
      const imgNaturalWidth = img.naturalWidth;
      const imgNaturalHeight = img.naturalHeight;
      
      // Calculate displayed size after zoom
      const containerAspect = containerRect.width / containerRect.height;
      const imgAspect = imgNaturalWidth / imgNaturalHeight;
      
      let displayedWidth: number;
      let displayedHeight: number;
      
      if (imgAspect > containerAspect) {
        // Image is wider than container
        displayedWidth = containerRect.width * zoom;
        displayedHeight = (containerRect.width / imgAspect) * zoom;
      } else {
        // Image is taller than container
        displayedHeight = containerRect.height * zoom;
        displayedWidth = (containerRect.height * imgAspect) * zoom;
      }
      
      // Calculate maximum allowed position (centered position)
      const maxX = Math.max(0, (displayedWidth - containerRect.width) / 2);
      const maxY = Math.max(0, (displayedHeight - containerRect.height) / 2);
      
      // Clamp position to bounds
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    
    // Calculate bounds (same logic as mouse move)
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const img = imageRef.current;
      
      const imgNaturalWidth = img.naturalWidth;
      const imgNaturalHeight = img.naturalHeight;
      const containerAspect = containerRect.width / containerRect.height;
      const imgAspect = imgNaturalWidth / imgNaturalHeight;
      
      let displayedWidth: number;
      let displayedHeight: number;
      
      if (imgAspect > containerAspect) {
        displayedWidth = containerRect.width * zoom;
        displayedHeight = (containerRect.width / imgAspect) * zoom;
      } else {
        displayedHeight = containerRect.height * zoom;
        displayedWidth = (containerRect.height * imgAspect) * zoom;
      }
      
      const maxX = Math.max(0, (displayedWidth - containerRect.width) / 2);
      const maxY = Math.max(0, (displayedHeight - containerRect.height) / 2);
      
      setPosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY)),
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const img = imageRef.current;
    
    // Set canvas size to match the visible crop area (high resolution)
    const targetWidth = 1200;
    const targetHeight = targetWidth / aspectRatio;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Get natural image dimensions
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;
    
    // Get displayed image rect (before zoom/transform)
    const imgRect = img.getBoundingClientRect();
    
    // Calculate scale from displayed size to natural size
    const scaleX = imgNaturalWidth / imgRect.width;
    const scaleY = imgNaturalHeight / imgRect.height;

    // The container center in container coordinates
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    // The image center in container coordinates (accounting for position offset)
    const imageCenterX = containerCenterX - position.x;
    const imageCenterY = containerCenterY - position.y;

    // Calculate source rectangle in natural image coordinates
    // The visible area is the container size, scaled to natural coordinates
    const sourceWidth = (containerRect.width / zoom) * scaleX;
    const sourceHeight = (containerRect.height / zoom) * scaleY;
    
    // Calculate source position: center of visible area in natural coordinates
    const sourceCenterX = imageCenterX * scaleX;
    const sourceCenterY = imageCenterY * scaleY;
    
    const sourceX = Math.max(0, Math.min(imgNaturalWidth - sourceWidth, sourceCenterX - sourceWidth / 2));
    const sourceY = Math.max(0, Math.min(imgNaturalHeight - sourceHeight, sourceCenterY - sourceHeight / 2));

    // Handle rotation
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    
    // Draw the cropped image
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      Math.min(sourceWidth, imgNaturalWidth - sourceX),
      Math.min(sourceHeight, imgNaturalHeight - sourceY),
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    // Convert to base64
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedImage);
    onClose();
  }, [position, zoom, rotation, aspectRatio, onCrop, onClose]);

  const resetTransform = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Position & Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={resetTransform}
            >
              Reset
            </Button>
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="relative w-full bg-gray-900 rounded-lg overflow-hidden select-none"
            style={{ 
              aspectRatio: aspectRatio.toString(), 
              minHeight: '400px',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={image}
              alt="Crop preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none',
              }}
              draggable={false}
              onLoad={() => {
                // Center the image on load
                if (containerRef.current && imageRef.current) {
                  const containerRect = containerRef.current.getBoundingClientRect();
                  const img = imageRef.current;
                  
                  // Calculate initial centered position
                  const imgNaturalWidth = img.naturalWidth;
                  const imgNaturalHeight = img.naturalHeight;
                  const containerAspect = containerRect.width / containerRect.height;
                  const imgAspect = imgNaturalWidth / imgNaturalHeight;
                  
                  let displayedWidth: number;
                  let displayedHeight: number;
                  
                  if (imgAspect > containerAspect) {
                    displayedWidth = containerRect.width;
                    displayedHeight = containerRect.width / imgAspect;
                  } else {
                    displayedHeight = containerRect.height;
                    displayedWidth = containerRect.height * imgAspect;
                  }
                  
                  setPosition({
                    x: (containerRect.width - displayedWidth) / 2,
                    y: (containerRect.height - displayedHeight) / 2,
                  });
                }
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Click and drag to reposition • Use zoom buttons to adjust size • The visible area will be used as your event image
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            <Check className="w-4 h-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

