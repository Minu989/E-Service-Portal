import React from 'react';
import { ServiceRequest, InvoiceItem, Invoice } from '@/shared/types';
import { CloseIcon, ReceiptPercentIcon, PlusIcon, TrashIcon } from '@/components/common/icons';

// --- Reusable Sub-components ---

/**
 * Renders a single row in the invoice for an item, including input fields and a remove button.
 */
const InvoiceItemRow: React.FC<{
    item: InvoiceItem;
    index: number;
    onItemChange: (index: number, field: keyof InvoiceItem, value: string | number) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}> = ({ item, index, onItemChange, onRemove, canRemove }) => (
    <div className="grid grid-cols-[1fr_100px_40px] gap-x-4 items-center">
        <input
            type="text"
            aria-label={`Item ${index + 1} description`}
            placeholder="e.g., Replacement Part"
            value={item.description}
            onChange={(e) => onItemChange(index, 'description', e.target.value)}
            className="w-full bg-slate-100 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            required
        />
        <input
            type="number"
            aria-label={`Item ${index + 1} cost`}
            placeholder="0.00"
            value={item.cost || ''}
            onChange={(e) => onItemChange(index, 'cost', e.target.value)}
            className="w-full bg-slate-100 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-right"
            required
            min="0"
            step="0.01"
        />
        <button
            type="button"
            aria-label={`Remove item ${index + 1}`}
            onClick={() => onRemove(index)}
            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canRemove}
        >
            <TrashIcon className="w-5 h-5" />
        </button>
    </div>
);


// --- Main Modal Component ---

interface InvoiceModalProps {
    request: ServiceRequest;
    onClose: () => void;
    onSubmit: (invoice: Omit<Invoice, 'issuedDate'>) => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ request, onClose, onSubmit }) => {
    const [items, setItems] = React.useState<InvoiceItem[]>([
        { description: 'Service Labor', cost: 100 },
    ]);

    const total = React.useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    }, [items]);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items];
        if (field === 'cost') {
            newItems[index][field] = Number(value) >= 0 ? Number(value) : 0;
        } else {
            newItems[index][field] = value as string;
        }
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', cost: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.some(item => !item.description || item.cost <= 0)) {
            alert('Please ensure all invoice items have a valid description and cost.');
            return;
        }
        onSubmit({ items, total });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
                <header className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <ReceiptPercentIcon className="w-7 h-7 text-indigo-600 mr-3" />
                        <h2 id="invoice-modal-title" className="text-2xl font-bold text-gray-800">Create Invoice for {request.id}</h2>
                    </div>
                    <button type="button" aria-label="Close" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <CloseIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div className="grid grid-cols-[1fr_100px_40px] gap-x-4 mb-2 px-2">
                        <label className="font-semibold text-slate-600 text-sm">Description</label>
                        <label className="font-semibold text-slate-600 text-sm text-right">Cost ($)</label>
                        <span className="sr-only">Actions</span>
                    </div>

                    {items.map((item, index) => (
                        <InvoiceItemRow
                            key={index}
                            item={item}
                            index={index}
                            onItemChange={handleItemChange}
                            onRemove={removeItem}
                            canRemove={items.length > 1}
                        />
                    ))}
                    <button type="button" onClick={addItem} className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mt-2">
                        <PlusIcon className="w-5 h-5 mr-1" /> Add Item
                    </button>
                </main>

                <footer className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-between items-center">
                    <div>
                        <span className="text-lg font-semibold text-slate-600">Total:</span>
                        <span className="text-2xl font-bold text-slate-900 ml-2">${total.toFixed(2)}</span>
                    </div>
                    <button type="submit" className="px-6 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all">
                        Send Invoice to Customer
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default InvoiceModal;
