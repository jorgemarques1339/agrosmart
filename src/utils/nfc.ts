import { haptics } from './haptics';

export interface NFCTagResult {
    serialNumber: string;
    message?: any;
}

export const nfcService = {
    /**
     * Checks if Web NFC is supported and accessible
     */
    isSupported: (): boolean => {
        return 'NDEFReader' in window;
    },

    /**
     * Scans for an NFC tag and returns its serial number
     */
    scanTag: async (timeoutMs: number = 15000): Promise<string> => {
        if (!nfcService.isSupported()) {
            throw new Error('NFC não suportado neste dispositivo/browser.');
        }

        try {
            const ndef = new (window as any).NDEFReader();
            await ndef.scan();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Tempo limite de leitura NFC esgotado.'));
                }, timeoutMs);

                ndef.onreading = (event: any) => {
                    clearTimeout(timeout);
                    const serialNumber = event.serialNumber;
                    haptics.success();
                    resolve(serialNumber);
                };

                ndef.onreadingerror = () => {
                    clearTimeout(timeout);
                    haptics.error();
                    reject(new Error('Erro ao ler a Tag NFC. Tente novamente.'));
                };
            });
        } catch (error: any) {
            console.error('NFC Scan Error:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Permissão NFC negada pelo utilizador.');
            }
            throw error;
        }
    }
};
