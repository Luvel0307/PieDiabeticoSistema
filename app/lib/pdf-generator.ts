
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface EvaluacionData {
  id: number;
  paciente: { nombre: string };
  fechaHora: string;
  sensibilidad: number;
  tiempoEvolucion: number;
  controlGlucemico: number;
  secrecion: boolean;
  eritema: boolean;
  riesgo: number;
  nivelRiesgo: string;
  semaforoColor: string;
  areaLesion: number;
  desvEstR: number;
  mediaR: number;
  mediaG: number;
  mediaB: number;
  evolArea: string;
  evolDesv: string;
  cloudStoragePath?: string;
}

export const generateMedicalPDF = async (evaluacion: EvaluacionData) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Header
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo placeholder (you can add actual logo later)
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COLEGIO MÉXICO', 20, 15);
    pdf.setFontSize(12);
    pdf.text('Sistema de Evaluación de Pie Diabético', 20, 25);
    pdf.text('Análisis inteligente con lógica difusa', 20, 32);
    
    // Date
    pdf.setFontSize(10);
    const fecha = new Date(evaluacion.fechaHora).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Fecha: ${fecha}`, pageWidth - 60, 15);
    
    // Patient info
    let yPos = 55;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE MÉDICO', 20, yPos);
    
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Paciente: ${evaluacion.paciente.nombre}`, 20, yPos);
    pdf.text(`ID Evaluación: ${evaluacion.id}`, pageWidth - 60, yPos);
    
    yPos += 20;
    
    // Clinical parameters
    pdf.setFont('helvetica', 'bold');
    pdf.text('PARÁMETROS CLÍNICOS', 20, yPos);
    yPos += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const parametros = [
      ['Sensibilidad:', `${evaluacion.sensibilidad}/6`],
      ['Tiempo Evolución:', `${evaluacion.tiempoEvolucion} días`],
      ['Control Glucémico:', `${evaluacion.controlGlucemico}`],
      ['Secreción:', evaluacion.secrecion ? 'Sí' : 'No'],
      ['Eritema:', evaluacion.eritema ? 'Sí' : 'No']
    ];
    
    parametros.forEach(([label, value]) => {
      pdf.text(label, 20, yPos);
      pdf.text(value, 80, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    
    // Image analysis results
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('ANÁLISIS DE IMAGEN', 20, yPos);
    yPos += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    const analisisImagen = [
      ['Área de lesión:', `${evaluacion.areaLesion.toFixed(2)} px²`],
      ['Desviación estándar R:', `${evaluacion.desvEstR.toFixed(2)}`],
      ['Media RGB:', `R:${evaluacion.mediaR.toFixed(1)} G:${evaluacion.mediaG.toFixed(1)} B:${evaluacion.mediaB.toFixed(1)}`],
      ['Evolución área:', evaluacion.evolArea || 'N/A'],
      ['Evolución desv:', evaluacion.evolDesv || 'N/A']
    ];
    
    analisisImagen.forEach(([label, value]) => {
      pdf.text(label, 20, yPos);
      pdf.text(value, 80, yPos);
      yPos += 6;
    });
    
    yPos += 20;
    
    // Risk assessment - Traffic light system
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('EVALUACIÓN DE RIESGO', 20, yPos);
    yPos += 15;
    
    // Traffic light indicator
    const semaforoColors = {
      'verde': [34, 139, 34],
      'amarillo': [255, 193, 7],
      'rojo': [220, 20, 60]
    };
    
    const colorRGB = semaforoColors[evaluacion.semaforoColor as keyof typeof semaforoColors] || [128, 128, 128];
    
    // Draw traffic light circle
    pdf.setFillColor(colorRGB[0], colorRGB[1], colorRGB[2]);
    pdf.circle(30, yPos + 5, 8, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(`RIESGO: ${evaluacion.nivelRiesgo.toUpperCase()}`, 50, yPos + 8);
    
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Valor numérico: ${evaluacion.riesgo.toFixed(2)}`, 50, yPos + 8);
    
    yPos += 25;
    
    // Clinical recommendations
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('RECOMENDACIONES CLÍNICAS', 20, yPos);
    yPos += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    let recomendaciones: string[] = [];
    
    switch (evaluacion.semaforoColor) {
      case 'verde':
        recomendaciones = [
          '• Continuar con cuidados preventivos regulares',
          '• Mantener control glucémico actual',
          '• Revisión en 3-6 meses',
          '• Educación en autocuidado de pies'
        ];
        break;
      case 'amarillo':
        recomendaciones = [
          '• Vigilancia estrecha cada 2-4 semanas',
          '• Optimizar control glucémico',
          '• Evaluación vascular si es necesario',
          '• Considerar interconsulta con especialista',
          '• Reforzar educación en cuidado de pies'
        ];
        break;
      case 'rojo':
        recomendaciones = [
          '• ATENCIÓN URGENTE REQUERIDA',
          '• Interconsulta inmediata con especialista',
          '• Control glucémico estricto',
          '• Evaluación vascular completa',
          '• Posible hospitalización',
          '• Seguimiento semanal'
        ];
        break;
    }
    
    recomendaciones.forEach(rec => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(rec, 20, yPos);
      yPos += 6;
    });
    
    yPos += 15;
    
    // Footer
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Este reporte fue generado automáticamente por el Sistema de Evaluación de Pie Diabético', 20, yPos);
    pdf.text('Colegio México - Institución Colaboradora', 20, yPos + 6);
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, 20, yPos + 12);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `Reporte_Medico_${evaluacion.paciente.nombre.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    
    // Generate PDF blob
    const pdfBlob = pdf.output('blob');
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
    
    return { success: true, fileName };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF');
  }
};

export const generatePDFFromHTML = async (elementId: string, fileName: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Elemento no encontrado');
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Generate PDF blob and force download
    const pdfBlob = pdf.output('blob');
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw error;
  }
};
