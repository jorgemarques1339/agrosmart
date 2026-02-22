import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../store/useStore';

export const useExportHandlers = () => {
    const { fields, stocks, ui, closeModal, registerSale } = useStore();
    const { guideData } = ui.modals;

    const generateGuidePDF = () => {
        const selectedStock = stocks.find(s => s.id === guideData.stockId);
        const selectedField = fields.find(f => f.id === guideData.fieldId);
        if (!selectedStock || !selectedField) return;

        // Register the sale first
        const tx = {
            id: Date.now().toString(),
            date: guideData.date,
            type: 'income' as const,
            amount: parseFloat(guideData.quantity) * parseFloat(guideData.price),
            category: 'Vendas',
            description: `Venda: ${guideData.clientName}`
        };

        registerSale({
            stockId: guideData.stockId,
            quantity: parseFloat(guideData.quantity),
            transaction: tx
        });

        // Generate PDF
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(62, 104, 55);
        doc.text("GUIA DE TRANSPORTE", 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Documento de Acompanhamento de Mercadorias", 105, 26, { align: 'center' });
        doc.setDrawColor(200);
        doc.line(14, 32, 196, 32);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("EXPEDIDOR (Quinta):", 14, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Oriva Farms Enterprise", 14, 48);
        doc.text(`Local Carga: ${selectedField.name} (${selectedField.coordinates.join(', ')})`, 14, 53);
        doc.text(`Data/Hora: ${new Date().toLocaleString()}`, 14, 58);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("DESTINATÁRIO:", 110, 42);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(guideData.clientName, 110, 48);
        doc.text(`NIF: ${guideData.clientNif || 'N/A'}`, 110, 53);
        doc.text(`Descarga: ${guideData.destination || 'Morada do Cliente'}`, 110, 58);

        doc.setFillColor(240, 240, 240);
        doc.rect(14, 65, 182, 15, 'F');
        doc.text(`Viatura: ${guideData.plate.toUpperCase()}`, 20, 75);
        doc.text(`Data Início: ${guideData.date}`, 120, 75);

        const tableRows = [[
            selectedStock.name,
            `${guideData.quantity} ${selectedStock.unit}`,
            `${guideData.price} €`,
            `${(parseFloat(guideData.quantity) * parseFloat(guideData.price)).toFixed(2)} €`
        ]];

        autoTable(doc, {
            startY: 85,
            head: [['Mercadoria', 'Quantidade', 'Preço Unit.', 'Total']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [62, 104, 55] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Este documento não substitui a fatura oficial. Válido para circulação.", 14, finalY);
        doc.text(`Emitido via OrivaSmart App`, 14, finalY + 5);

        doc.save(`Guia_Transporte_${guideData.clientName.replace(/\s/g, '_')}.pdf`);
        closeModal('guide');
    };

    return {
        generateGuidePDF
    };
};
