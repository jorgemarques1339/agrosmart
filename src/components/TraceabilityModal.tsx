import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Share2, ScanLine, Copy, ArrowUpRight } from 'lucide-react';
import { ProductBatch } from '../types';

interface TraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: ProductBatch;
}

const TraceabilityModal: React.FC<TraceabilityModalProps> = ({ isOpen, onClose, batch }) => {
  if (!isOpen) return null;

  // URL simulada (numa app real, seria o domínio da app)
  const productUrl = `${window.location.origin}?batchId=${batch.batchId}`;

  const handlePrint = () => {
    // Abrir uma janela de impressão simplificada
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta ${batch.batchId}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .label { border: 2px solid black; padding: 20px; display: inline-block; border-radius: 10px; }
              h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
              p { margin: 5px 0; font-size: 14px; }
              .footer { font-size: 10px; margin-top: 10px; color: #555; }
            </style>
          </head>
          <body>
            <div class="label">
              <h1>${batch.crop}</h1>
              <p>Lote: ${batch.batchId}</p>
              <p>Colheita: ${batch.harvestDate}</p>
              <div style="margin: 15px 0;">
                 ${document.getElementById('qr-canvas')?.outerHTML || 'QR Error'}
              </div>
              <p>Origem: ${batch.origin}</p>
              <p class="footer">Certificado OrivaSmart - Digital Passport</p>
            </div>
            <script>window.print(); window.close();<\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rastreabilidade: ${batch.crop}`,
          text: `Confira a origem do lote ${batch.batchId}`,
          url: productUrl,
        });
      } catch (error) {
        console.log('Partilha cancelada', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(productUrl);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up relative border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-agro-green p-6 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 rounded-full hover:bg-black/30 transition-colors">
             <X size={20} />
           </button>
           <ScanLine size={48} className="mx-auto mb-2 opacity-90" />
           <h2 className="text-2xl font-black uppercase tracking-tight">Passaporte Digital</h2>
           <p className="text-sm font-medium opacity-80">{batch.crop}</p>
        </div>

        <div className="p-8 flex flex-col items-center">
           
           {/* QR Code Container */}
           <div className="bg-white p-4 rounded-3xl shadow-lg border-4 border-gray-100 dark:border-neutral-800 mb-6" id="qr-container">
              <QRCodeSVG 
                id="qr-canvas"
                value={productUrl}
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "https://cdn-icons-png.flaticon.com/512/628/628283.png",
                  x: undefined,
                  y: undefined,
                  height: 34,
                  width: 34,
                  excavate: true,
                }}
              />
           </div>

           <div className="text-center mb-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ID do Lote</p>
              <p className="text-lg font-mono font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-lg select-all">
                {batch.batchId}
              </p>
           </div>

           {/* Actions */}
           <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={handlePrint}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border border-gray-100 dark:border-neutral-700"
              >
                 <Printer size={24} className="text-agro-green" />
                 <span className="text-xs uppercase">Imprimir</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border border-gray-100 dark:border-neutral-700"
              >
                 <Share2 size={24} className="text-blue-500" />
                 <span className="text-xs uppercase">Partilhar</span>
              </button>
           </div>

           <div className="mt-6 flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <a href={productUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-agro-green">
                 Ver Página Pública <ArrowUpRight size={10} />
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TraceabilityModal;