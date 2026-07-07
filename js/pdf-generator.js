// js/pdf-generator.js
// Generate CV PDF
async function generateCVPDF() {
    showLoading(true, 'Membuat CV PDF...');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    const cvElement = document.getElementById('cv-preview');
    
    try {
        const canvas = await html2canvas(cvElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        const name = AppState.data?.personal?.name || 'CV';
        doc.save(`CV-${name.replace(/\s+/g, '-')}.pdf`);
        
        showToast('✅ CV PDF berhasil dibuat!', 'success');
    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('❌ Gagal membuat PDF', 'danger');
    }
    
    showLoading(false);
}

// Generate Portfolio PDF (Landscape)
async function generatePortfolioPDF() {
    showLoading(true, 'Membuat Portfolio PDF...');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    let y = 15;
    const margin = 15;
    const pageWidth = 297;
    const pageHeight = 210;
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(13, 110, 253);
    doc.text('Professional Portfolio', margin, y);
    y += 15;
    
    // Personal Info
    const personal = AppState.data?.personal || {};
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${personal.name || 'Nama'} | ${personal.email || ''} | ${personal.phone || ''}`, margin, y);
    y += 15;
    
    // Work Experience
    const work = AppState.data?.work || [];
    if (work.length > 0) {
        // Cek page break
        if (y > pageHeight - 30) {
            doc.addPage();
            y = 15;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(13, 110, 253);
        doc.text('Work Experience', margin, y);
        y += 10;
        
        work.forEach((item, index) => {
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 15;
            }
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`${item.title} at ${item.company || ''}`, margin, y);
            y += 6;
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`${formatDate(item.startDate)} - ${item.endDate ? formatDate(item.endDate) : 'Present'}`, margin, y);
            y += 6;
            
            if (item.description) {
                doc.setFontSize(9);
                doc.setTextColor(50, 50, 50);
                const lines = doc.splitTextToSize(item.description, pageWidth - margin * 2);
                doc.text(lines, margin, y);
                y += lines.length * 4 + 4;
            } else {
                y += 4;
            }
        });
    }
    
    // Skills
    const skills = AppState.data?.skill || [];
    if (skills.length > 0) {
        if (y > pageHeight - 40) {
            doc.addPage();
            y = 15;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(13, 110, 253);
        doc.text('Skills', margin, y);
        y += 10;
        
        skills.forEach(skill => {
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`${skill.title}`, margin, y);
            
            // Progress bar
            const barWidth = 100;
            const barHeight = 4;
            const level = (skill.level || 50) / 100;
            
            doc.setFillColor(230, 230, 230);
            doc.rect(margin + 60, y - 3, barWidth, barHeight, 'F');
            doc.setFillColor(13, 110, 253);
            doc.rect(margin + 60, y - 3, barWidth * level, barHeight, 'F');
            
            y += 10;
        });
    }
    
    doc.save(`Portfolio-${new Date().getFullYear()}.pdf`);
    showToast('✅ Portfolio PDF berhasil dibuat!', 'success');
    showLoading(false);
}

// Print Portfolio
function printPortfolio() {
    window.print();
}
