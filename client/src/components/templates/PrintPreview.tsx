import React, { useState, useRef, useEffect } from 'react';
import { Printer, X, FileDown, Grid, Maximize2, Minimize2, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { usePDF } from 'react-to-pdf';
import type { TemplateData, TemplateElement } from '../../lib/template-api';

interface PrintPreviewProps {
  template: TemplateData;
  attendeeData: {
    firstName: string;
    lastName: string;
    email: string;
    ticketType?: string;
    [key: string]: unknown;
  };
  eventData: {
    title: string;
    date: string;
    venue?: string;
    [key: string]: unknown;
  };
  onClose: () => void;
  qrCodeData?: string; // QR code data (registration ID, etc.)
}

// Standard tag dimensions (adjust as needed)
const TAG_WIDTH_IN = 3.5;
const TAG_HEIGHT_IN = 5;
const DPI = 96;

// Common paper sizes in mm
const PAPER_SIZES = [
  { name: 'A4', width: 210, height: 297 },
  { name: 'Letter', width: 215.9, height: 279.4 },
  { name: 'Legal', width: 215.9, height: 355.6 },
];

const PrintPreview: React.FC<PrintPreviewProps> = ({
  template,
  attendeeData,
  eventData,
  onClose,
  qrCodeData,
}) => {
  const [singleTagMode, setSingleTagMode] = useState(false);
  const [paperSize, setPaperSize] = useState({
    width: 794, // A4 width in pixels at 96 DPI
    height: 1123, // A4 height in pixels at 96 DPI
    name: 'A4',
    widthMm: 210,
    heightMm: 297,
  });

  const printAreaRef = useRef<HTMLDivElement>(null);
  const singleTagRef = useRef<HTMLDivElement>(null);

  // Calculate tag dimensions
  const tagWidthPx = (template.width || TAG_WIDTH_IN * DPI);
  const tagHeightPx = (template.height || TAG_HEIGHT_IN * DPI);

  // PDF generation hook for grid layout
  const { toPDF: toGridPDF, targetRef: gridRef } = usePDF({
    filename: `${eventData.title}-ticket.pdf`,
    page: {
      format: [paperSize.widthMm, paperSize.heightMm],
      orientation: 'portrait',
      margin: 10,
    },
    canvas: {
      mimeType: 'image/png',
      qualityRatio: 1,
    },
  });

  // PDF generation hook for single tag
  const { toPDF: toSingleTagPDF, targetRef: singleTagPdfRef } = usePDF({
    filename: `${eventData.title}-${attendeeData.firstName}-${attendeeData.lastName}-ticket.pdf`,
    page: {
      format: [
        (template.width || TAG_WIDTH_IN * DPI) * 0.264583, // Convert px to mm
        (template.height || TAG_HEIGHT_IN * DPI) * 0.264583,
      ],
      orientation: 'portrait',
      margin: 0,
    },
    canvas: {
      mimeType: 'image/png',
      qualityRatio: 1,
    },
  });

  // Replace placeholders in text
  const replacePlaceholders = (text: string): string => {
    return text
      .replace(/{attendeeName}/g, `${attendeeData.firstName} ${attendeeData.lastName}`)
      .replace(/{firstName}/g, attendeeData.firstName)
      .replace(/{lastName}/g, attendeeData.lastName)
      .replace(/{email}/g, attendeeData.email)
      .replace(/{ticketType}/g, attendeeData.ticketType || 'Standard')
      .replace(/{eventTitle}/g, eventData.title)
      .replace(/{eventDate}/g, eventData.date)
      .replace(/{venue}/g, eventData.venue || '');
  };

  // Render template element
  const renderElement = (element: TemplateElement, index: number) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.xPercent !== undefined ? element.xPercent : (element.x / tagWidthPx) * 100}%`,
      top: `${element.yPercent !== undefined ? element.yPercent : (element.y / tagHeightPx) * 100}%`,
      fontSize: element.fontSize || 16,
      fontFamily: element.fontFamily || 'Arial',
      color: element.color || '#000000',
      fontWeight: element.fontWeight || 'normal',
      textAlign: element.align || 'left',
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: element.zIndex || index,
    };

    if (element.width) style.width = `${element.width}px`;
    if (element.height) style.height = `${element.height}px`;

    switch (element.type) {
      case 'text':
        return (
          <div key={element.id} style={style}>
            {replacePlaceholders(element.text || element.content || '')}
          </div>
        );
      case 'qrcode':
        return (
          <div
            key={element.id}
            style={{
              ...style,
              width: element.width || 100,
              height: element.height || 100,
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #d1d5db',
            }}
          >
            {/* QR Code placeholder - in production, use a QR code library */}
            <div style={{ fontSize: '10px', color: '#6b7280' }}>QR CODE</div>
          </div>
        );
      case 'image':
        return (
          <img
            key={element.id}
            src={element.content || ''}
            alt=""
            style={style}
          />
        );
      case 'rectangle':
        return (
          <div
            key={element.id}
            style={{
              ...style,
              width: element.width || 100,
              height: element.height || 100,
              border: `2px solid ${element.color || '#000000'}`,
              backgroundColor: 'transparent',
            }}
          />
        );
      case 'line':
        return (
          <div
            key={element.id}
            style={{
              ...style,
              width: element.width || 100,
              height: '2px',
              backgroundColor: element.color || '#000000',
            }}
          />
        );
      default:
        return null;
    }
  };

  const handlePaperSizeChange = (sizeName: string) => {
    const selectedSize = PAPER_SIZES.find((size) => size.name === sizeName);
    if (selectedSize) {
      const mmToInch = 0.0393701;
      const widthPx = Math.round(selectedSize.width * mmToInch * DPI);
      const heightPx = Math.round(selectedSize.height * mmToInch * DPI);

      setPaperSize({
        width: widthPx,
        height: heightPx,
        name: selectedSize.name,
        widthMm: selectedSize.width,
        heightMm: selectedSize.height,
      });
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const tagsPerRow = Math.floor(paperSize.width / tagWidthPx);
  const tagsPerColumn = Math.floor(paperSize.height / tagHeightPx);
  const tagsPerPage = tagsPerRow * tagsPerColumn;

  return (
    <>
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only,
          .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          @page {
            size: ${paperSize.name};
            margin: 10mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-auto">
        <div className="bg-gray-900 w-full max-w-5xl max-h-[95vh] flex flex-col rounded-lg shadow-2xl border border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              {singleTagMode ? 'Single Ticket Preview' : 'Grid Preview'}
            </h2>
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSingleTagMode(!singleTagMode)}
                className="text-white hover:bg-gray-700"
              >
                {singleTagMode ? (
                  <>
                    <Grid size={18} className="mr-2" />
                    Grid View
                  </>
                ) : (
                  <>
                    <Maximize2 size={18} className="mr-2" />
                    Single View
                  </>
                )}
              </Button>

              {/* Paper size selector (grid mode only) */}
              {!singleTagMode && (
                <select
                  value={paperSize.name}
                  onChange={(e) => handlePaperSizeChange(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                >
                  {PAPER_SIZES.map((size) => (
                    <option key={size.name} value={size.name}>
                      {size.name} ({size.width}mm × {size.height}mm)
                    </option>
                  ))}
                </select>
              )}

              {/* Download PDF */}
              {singleTagMode ? (
                <Button
                  size="sm"
                  onClick={() => toSingleTagPDF()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileDown size={18} className="mr-2" />
                  Download PDF
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => toGridPDF()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileDown size={18} className="mr-2" />
                  Download Grid PDF
                </Button>
              )}

              {/* Browser print */}
              <Button
                size="sm"
                onClick={handleBrowserPrint}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Printer size={18} className="mr-2" />
                Print
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-gray-700"
              >
                <X size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
            {singleTagMode ? (
              <div className="flex justify-center">
                <div
                  ref={singleTagPdfRef}
                  className="bg-white shadow-lg print-only"
                  style={{
                    width: `${tagWidthPx}px`,
                    height: `${tagHeightPx}px`,
                    position: 'relative',
                    backgroundImage: template.backgroundUrl
                      ? `url(${template.backgroundUrl})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {template.elements?.map((element, index) => renderElement(element, index))}
                </div>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="bg-white shadow-lg mx-auto print-only"
                style={{
                  width: `${paperSize.width}px`,
                  height: `${paperSize.height}px`,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignContent: 'center',
                  gap: '10px',
                  padding: '10px',
                }}
              >
                {/* Render multiple tickets in grid */}
                {Array.from({ length: Math.min(10, tagsPerPage) }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-300"
                    style={{
                      width: `${tagWidthPx}px`,
                      height: `${tagHeightPx}px`,
                      position: 'relative',
                      backgroundImage: template.backgroundUrl
                        ? `url(${template.backgroundUrl})`
                        : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {template.elements?.map((element, index) => renderElement(element, index))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-700 text-gray-400 text-sm">
            {singleTagMode ? (
              <div>
                Viewing single ticket • PDF dimensions: {Math.round(tagWidthPx * 0.264583)}mm ×{' '}
                {Math.round(tagHeightPx * 0.264583)}mm
              </div>
            ) : (
              <div>
                {tagsPerRow} × {tagsPerColumn} grid ({tagsPerPage} tickets per page)
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintPreview;

