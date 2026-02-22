import { useStore } from '../store/useStore';
import { Transaction, StockItem, ProductBatch } from '../types';

export const useFarmOperations = (userName: string) => {
    const {
        fields, addTask, updateTask, deleteTask,
        registerSale, harvestField, addTransaction
    } = useStore();

    const handleAddTask = (
        title: string,
        type: 'task' | 'harvest',
        date?: string,
        relatedFieldId?: string,
        relatedStockId?: string,
        plannedQuantity?: number,
        assignedTo?: string
    ) => {
        addTask({
            id: Date.now().toString(),
            title,
            date: date || new Date().toISOString().split('T')[0],
            type,
            completed: false,
            status: 'pending',
            ...(relatedFieldId && { relatedFieldId }),
            ...(relatedStockId && { relatedStockId }),
            ...(plannedQuantity && { plannedQuantity }),
            ...(assignedTo && { assignedTo }),
        });
    };

    const handleSubmitProof = (taskId: string, proof: string) => {
        updateTask(taskId, { completed: true, status: 'done', proofImage: proof });
    };

    const handleReviewTask = (taskId: string, approved: boolean) => {
        updateTask(taskId, { status: approved ? 'done' : 'pending', completed: approved });
    };

    const handleRegisterSale = (data: any) => {
        const field = fields.find(f => f.id === data.fieldId);
        const tx: Transaction = {
            id: Date.now().toString(),
            date: data.date,
            type: 'income',
            amount: data.quantity * data.pricePerUnit,
            category: 'Vendas',
            description: `Venda: ${data.clientName}`,
            relatedCrop: data.crop || field?.crop,
            relatedId: data.fieldId
        };
        registerSale({
            stockId: data.stockId,
            quantity: data.quantity,
            transaction: tx
        });
    };

    const handleHarvest = (fieldId: string, data: any) => {
        const stockItem: StockItem = {
            id: Date.now().toString(),
            name: `Colheita: ${data.batchId}`,
            category: 'Colheita',
            quantity: data.quantity,
            unit: data.unit,
            minStock: 0,
            pricePerUnit: 0
        };
        const harvest: ProductBatch = {
            batchId: data.batchId,
            crop: fields.find(f => f.id === fieldId)?.crop || 'Desconhecido',
            quantity: data.quantity,
            unit: data.unit,
            harvestDate: data.date,
            origin: 'Quinta do Oriva, Laundos',
            coordinates: fields.find(f => f.id === fieldId)?.coordinates || [41.442, -8.723],
            stats: { sunDays: 0, harvestMethod: 'Manual' },
            farmerName: userName
        };
        harvestField(fieldId, stockItem, harvest);
    };

    return {
        handleAddTask,
        handleSubmitProof,
        handleReviewTask,
        handleRegisterSale,
        handleHarvest,
        deleteTask
    };
};
