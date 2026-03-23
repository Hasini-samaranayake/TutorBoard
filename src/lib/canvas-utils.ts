import * as fabric from 'fabric';

export const COLORS = [
  '#000000', // Black
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
];

export const STROKE_WIDTHS = [2, 4, 6, 8, 12];

export function createPenBrush(canvas: fabric.Canvas, color: string, width: number): fabric.PencilBrush {
  const brush = new fabric.PencilBrush(canvas);
  brush.color = color;
  brush.width = width;
  return brush;
}

export function createHighlighterBrush(canvas: fabric.Canvas, color: string, width: number): fabric.PencilBrush {
  const brush = new fabric.PencilBrush(canvas);
  const hexColor = color.startsWith('#') ? color : '#ffff00';
  brush.color = hexColor + '60';
  brush.width = width * 3;
  return brush;
}

export function createLine(startX: number, startY: number, endX: number, endY: number, color: string, width: number): fabric.Line {
  return new fabric.Line([startX, startY, endX, endY], {
    stroke: color,
    strokeWidth: width,
    selectable: true,
    evented: true,
  });
}

export function createRectangle(left: number, top: number, width: number, height: number, color: string, strokeWidth: number): fabric.Rect {
  return new fabric.Rect({
    left,
    top,
    width,
    height,
    fill: 'transparent',
    stroke: color,
    strokeWidth,
    selectable: true,
    evented: true,
  });
}

export function createCircle(left: number, top: number, radius: number, color: string, strokeWidth: number): fabric.Circle {
  return new fabric.Circle({
    left,
    top,
    radius,
    fill: 'transparent',
    stroke: color,
    strokeWidth,
    selectable: true,
    evented: true,
  });
}

export function createArrow(startX: number, startY: number, endX: number, endY: number, color: string, width: number): fabric.Group {
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 15;
  
  const line = new fabric.Line([startX, startY, endX, endY], {
    stroke: color,
    strokeWidth: width,
  });

  const head1 = new fabric.Line([
    endX,
    endY,
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6),
  ], {
    stroke: color,
    strokeWidth: width,
  });

  const head2 = new fabric.Line([
    endX,
    endY,
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6),
  ], {
    stroke: color,
    strokeWidth: width,
  });

  return new fabric.Group([line, head1, head2], {
    selectable: true,
    evented: true,
  });
}

export function createTextbox(left: number, top: number, text: string, fontSize: number, color: string): fabric.Textbox {
  return new fabric.Textbox(text, {
    left,
    top,
    fontSize,
    fill: color,
    fontFamily: 'Arial',
    width: 150,
    originX: 'left',
    originY: 'top',
    selectable: true,
    evented: true,
    editable: true,
  });
}

export function serializeCanvas(canvas: fabric.Canvas): string {
  return JSON.stringify(canvas.toJSON());
}

export function deserializeCanvas(canvas: fabric.Canvas, json: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      canvas.loadFromJSON(JSON.parse(json)).then(() => {
        canvas.renderAll();
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function clearCanvas(canvas: fabric.Canvas): void {
  // Check if canvas context is still valid before clearing
  if (!canvas.getContext()) return;
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
}

export function deleteSelectedObjects(canvas: fabric.Canvas): void {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 0) {
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }
}

export function generateTemplateBackground(template: string, width: number, height: number): string {
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  switch (template) {
    case 'graph':
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 0.5;
      const gridSize = 25;
      
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
      break;

    case 'lined':
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 0.5;
      const lineSpacing = 30;
      
      for (let y = lineSpacing; y <= height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80 + 0.5, 0);
      ctx.lineTo(80 + 0.5, height);
      ctx.stroke();
      break;

    case 'coordinate':
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 0.5;
      const coordGridSize = 25;
      
      for (let x = 0; x <= width; x += coordGridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y += coordGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
      
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      
      const centerX = Math.floor(width / 2) + 0.5;
      const centerY = Math.floor(height / 2) + 0.5;
      
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText('0', centerX + 5, centerY + 15);
      ctx.fillText('x', width - 20, centerY - 5);
      ctx.fillText('y', centerX + 5, 15);
      break;

    default:
      break;
  }

  return canvas.toDataURL('image/png');
}
