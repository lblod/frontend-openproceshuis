import jsPDF from 'jspdf';

export async function convertSvgToPng(svg) {
  const canvas = await convertSvgToCanvas(svg);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

export async function convertSvgToPdf(svg) {
  const canvas = await convertSvgToCanvas(svg);
  const width = canvas.width;
  const height = canvas.height;

  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
    hotfixes: ['px_scaling'],
  });
  pdf.addImage(canvas, 'PNG', 0, 0, width, height);
  return pdf.output('blob');
}

async function convertSvgToCanvas(svg) {
  const scaleFactor = 2;
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      ctx.scale(scaleFactor, scaleFactor);
      ctx.drawImage(img, 0, 0, img.width, img.height);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = `data:image/svg+xml;base64,${btoa(
      unescape(encodeURIComponent(svg))
    )}`;
  });
}
