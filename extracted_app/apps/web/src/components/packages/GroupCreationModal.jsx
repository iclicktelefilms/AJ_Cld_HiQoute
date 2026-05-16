import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, Check } from 'lucide-react';
import { formatINR } from '@/lib/currencyUtils';

const GroupCreationModal = ({ open, onOpenChange, onSave, initialGroup, allItems }) => {
  const [title, setTitle] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      if (initialGroup) {
        setTitle(initialGroup.title || '');
        setSelectedItems(initialGroup.items ? [...initialGroup.items] : []);
      } else {
        setTitle('');
        setSelectedItems([]);
      }
      setSearchQuery('');
    }
  }, [open, initialGroup]);

  const handleSave = () => {
    if (!title.trim()) {
      // Basic validation
      return;
    }
    onSave({
      id: initialGroup?.id || crypto.randomUUID(),
      title: title.trim(),
      items: selectedItems
    });
    onOpenChange(false);
  };

  const toggleItem = (item) => {
    const exists = selectedItems.find(i => i.id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { 
        id: item.id, 
        name: item.itemName, 
        price: item.price, 
        quantity: 1 
      }]);
    }
  };

  const updateQuantity = (itemId, qty) => {
    setSelectedItems(selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity: Math.max(1, parseInt(qty) || 1) } : item
    ));
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
  };

  const filteredItems = allItems.filter(item => 
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col bg-white dark:bg-card rounded-2xl p-0 shadow-xl border border-gray-200">
        <DialogHeader className="p-5 border-b border-gray-100 shrink-0">
          <DialogTitle className="text-lg font-bold text-foreground">
            {initialGroup ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="groupTitle" className="text-sm font-bold">Group Title *</Label>
            <input
              id="groupTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Photography Services"
              className="flex h-11 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Items */}
            <div className="space-y-3 flex flex-col h-[300px]">
              <Label className="text-sm font-bold">Available Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/30 border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1 bg-muted/10">
                {filteredItems.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-4">No items found.</p>
                ) : (
                  filteredItems.map(item => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{item.itemName}</span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground flex-shrink-0 ml-2">{formatINR(item.price)}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Items */}
            <div className="space-y-3 flex flex-col h-[300px]">
              <Label className="text-sm font-bold flex justify-between">
                <span>Selected Items</span>
                <span className="text-primary">{selectedItems.length}</span>
              </Label>
              <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-2 bg-muted/10">
                {selectedItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <Plus className="w-8 h-8 opacity-20" />
                    <p className="text-xs text-center">Select items from the left to add them to this group.</p>
                  </div>
                ) : (
                  selectedItems.map(item => (
                    <div key={item.id} className="bg-background border border-gray-200 p-2.5 rounded-lg flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium text-foreground leading-tight">{item.name}</span>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{formatINR(item.price)}</span>
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-1">
                          <span className="text-[10px] font-medium text-muted-foreground px-1">Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className="w-10 h-6 text-center bg-background border border-gray-200 rounded text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 shrink-0 flex justify-end gap-3 bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-5 h-10">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()} className="rounded-xl px-6 h-10 font-bold">
            Save Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupCreationModal;