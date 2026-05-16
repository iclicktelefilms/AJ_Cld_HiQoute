import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package as PackageIcon, IndianRupee } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { formatINR } from '@/lib/currencyUtils';
import { motion } from 'framer-motion';

const PackageStep2 = ({ formData, setFormData, onNext, onBack, onCancel, isSaving, isUniversal }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (isUniversal) {
          const records = await pb.collection('universal_items').getFullList({
            sort: 'itemName',
            $autoCancel: false
          });
          setItems(records);
        } else {
          const [userItems, uniItems] = await Promise.all([
            pb.collection('items').getFullList({
              filter: `user_id = "${pb.authStore.model?.id}"`,
              sort: 'itemName',
              $autoCancel: false
            }).catch(() => []),
            pb.collection('universal_items').getFullList({
              sort: 'itemName',
              $autoCancel: false
            }).catch(() => [])
          ]);
          setItems([
            ...userItems, 
            ...uniItems.map(i => ({...i, isUniversal: true}))
          ]);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [isUniversal]);

  const addGroup = () => {
    setFormData({
      ...formData,
      groups: [...formData.groups, { title: `Group ${formData.groups.length + 1}`, items: [] }]
    });
  };

  const removeGroup = (index) => {
    const newGroups = [...formData.groups];
    newGroups.splice(index, 1);
    setFormData({ ...formData, groups: newGroups });
  };

  const updateGroupTitle = (index, title) => {
    const newGroups = [...formData.groups];
    newGroups[index].title = title;
    setFormData({ ...formData, groups: newGroups });
  };

  const addItemToGroup = (groupIndex, itemId) => {
    if (!itemId) return;
    const newGroups = [...formData.groups];
    const itemDetails = items.find(i => i.id === itemId);
    
    if (itemDetails) {
      newGroups[groupIndex].items.push({ 
        id: itemId, 
        itemName: itemDetails.itemName,
        description: itemDetails.description || '',
        price: itemDetails.price || 0,
        quantity: 1 
      });
      setFormData({ ...formData, groups: newGroups });
    }
  };

  const addManualItem = (groupIndex) => {
    const newGroups = [...formData.groups];
    newGroups[groupIndex].items.push({
      id: `manual-${Date.now()}`,
      itemName: 'New Item',
      description: '',
      price: 0,
      quantity: 1
    });
    setFormData({ ...formData, groups: newGroups });
  };

  const updateLineItem = (groupIndex, itemIndex, field, value) => {
    const newGroups = [...formData.groups];
    newGroups[groupIndex].items[itemIndex][field] = field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, groups: newGroups });
  };

  const removeItemFromGroup = (groupIndex, itemIndex) => {
    const newGroups = [...formData.groups];
    newGroups[groupIndex].items.splice(itemIndex, 1);
    setFormData({ ...formData, groups: newGroups });
  };

  // Calculate summary
  const baseAmount = parseFloat(formData.baseAmount) || 0;
  const itemsTotal = formData.groups.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => itemSum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
  }, 0);
  const subtotal = baseAmount + itemsTotal;

  let discountAmt = 0;
  if (formData.discount?.type === 'percentage') {
    discountAmt = subtotal * ((parseFloat(formData.discount.value) || 0) / 100);
  } else {
    discountAmt = parseFloat(formData.discount?.value) || 0;
  }
  const adjustmentAmt = parseFloat(formData.adjustment) || 0;
  const finalAmount = subtotal - discountAmt + adjustmentAmt;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-primary" />
          Base Pricing
        </h4>
        <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border shadow-sm">
          <label className="text-sm font-medium text-muted-foreground">Base Amount</label>
          <div className="flex items-center gap-1.5 relative">
            <span className="text-sm font-medium text-muted-foreground absolute left-3">₹</span>
            <input
              type="number"
              value={formData.baseAmount || ''}
              onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
              className="w-[140px] h-9 text-right border border-input rounded-md text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary px-3 pl-6 transition-all"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Package Content Groups</h3>
          </div>
          <Button variant="outline" size="sm" onClick={addGroup} className="h-8 text-xs bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Group
          </Button>
        </div>

        {formData.groups.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
            <PackageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">No content groups added to this package yet.</p>
            <Button variant="secondary" size="sm" onClick={addGroup} className="rounded-lg">
              Create First Group
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.groups.map((group, gIndex) => (
              <div key={gIndex} className="bg-muted/10 border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={group.title}
                    onChange={(e) => updateGroupTitle(gIndex, e.target.value)}
                    className="text-base font-bold text-foreground bg-transparent border-b border-transparent hover:border-input focus:border-primary outline-none px-1 py-1 transition-colors w-full mr-4"
                    placeholder="e.g. Photography Deliverables"
                  />
                  <button onClick={() => removeGroup(gIndex)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10 transition-colors shrink-0 border border-transparent">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {group.items.map((item, iIndex) => (
                    <div key={iIndex} className="flex flex-col gap-3 bg-background border border-border rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <input 
                            value={item.itemName || item.customName || ''}
                            onChange={(e) => updateLineItem(gIndex, iIndex, 'itemName', e.target.value)}
                            className="text-sm font-semibold text-foreground w-full outline-none bg-transparent border-b border-transparent focus:border-border placeholder:text-muted-foreground/50"
                            placeholder="Item Name"
                          />
                          <input 
                            value={item.description || ''}
                            onChange={(e) => updateLineItem(gIndex, iIndex, 'description', e.target.value)}
                            placeholder="Item Description (Optional)"
                            className="text-xs text-muted-foreground w-full outline-none bg-transparent mt-1.5 border-b border-transparent focus:border-border placeholder:text-muted-foreground/50"
                          />
                        </div>
                        <button onClick={() => removeItemFromGroup(gIndex, iIndex)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => updateLineItem(gIndex, iIndex, 'quantity', e.target.value)}
                            className="w-16 h-8 text-center border border-input rounded-md text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 relative">
                          <span className="text-xs font-medium text-muted-foreground absolute left-2">₹</span>
                          <input
                            type="number"
                            value={item.price || 0}
                            onChange={(e) => updateLineItem(gIndex, iIndex, 'price', e.target.value)}
                            className="w-24 h-8 text-right border border-input rounded-md text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary pl-5 pr-2 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <select
                    className="flex-1 text-sm border border-input rounded-lg p-2 outline-none focus:border-primary bg-background h-10 transition-colors"
                    onChange={(e) => {
                      addItemToGroup(gIndex, e.target.value);
                      e.target.value = "";
                    }}
                    value=""
                  >
                    <option value="" disabled>+ Add Pre-saved Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemName} {item.isUniversal ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => addManualItem(gIndex)}
                    className="px-4 py-2 border border-dashed border-input rounded-lg text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:border-primary/50 transition-colors whitespace-nowrap h-10 flex items-center justify-center bg-muted/30"
                  >
                    + Custom Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Discount</h4>
          <div className="flex bg-background rounded-lg border border-input p-1">
            <button 
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${formData.discount?.type === 'fixed' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setFormData({ ...formData, discount: { ...formData.discount, type: 'fixed' } })}
            >
              Fixed Amount
            </button>
            <button 
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${formData.discount?.type === 'percentage' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setFormData({ ...formData, discount: { ...formData.discount, type: 'percentage' } })}
            >
              Percentage (%)
            </button>
          </div>
          <div className="flex items-center justify-between bg-background p-2 rounded-lg border border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <input
              type="number"
              value={formData.discount?.value || ''}
              onChange={(e) => setFormData({ ...formData, discount: { ...formData.discount, value: e.target.value } })}
              className="w-full bg-transparent border-none text-sm outline-none px-2 font-medium"
              placeholder="0"
              min="0"
            />
            <span className="text-sm font-bold text-destructive px-2 border-l border-border">
              {formData.discount?.type === 'fixed' ? `₹${formData.discount?.value || 0}` : `${formData.discount?.value || 0}%`}
            </span>
          </div>
        </div>

        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3">
          <input 
            value={formData.adjustmentHeading || 'Adjustment'}
            onChange={(e) => setFormData({ ...formData, adjustmentHeading: e.target.value })}
            className="text-sm font-semibold text-foreground bg-transparent outline-none w-full border-b border-transparent focus:border-border pb-1 placeholder:text-muted-foreground"
            placeholder="Custom Adjustment Label"
          />
          <div className="h-2"></div>
          <div className="flex items-center justify-between bg-background p-2 rounded-lg border border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <span className="text-sm font-medium text-muted-foreground pl-2">₹</span>
            <input
              type="number"
              value={formData.adjustment || ''}
              onChange={(e) => setFormData({ ...formData, adjustment: e.target.value })}
              className="w-full text-right bg-transparent border-none text-sm font-medium outline-none px-2"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mt-2 space-y-3 shadow-sm">
        <h4 className="text-sm font-bold text-foreground border-b border-border pb-3 mb-3">Pricing Summary</h4>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base Amount</span>
          <span className="font-medium text-foreground">{formatINR(baseAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items Total</span>
          <span className="font-medium text-foreground">{formatINR(itemsTotal)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-sm text-destructive">
            <span>Discount ({formData.discount?.type === 'percentage' ? `${formData.discount.value}%` : 'Fixed'})</span>
            <span className="font-medium">-{formatINR(discountAmt)}</span>
          </div>
        )}
        {adjustmentAmt !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{formData.adjustmentHeading || 'Adjustment'}</span>
            <span className="font-medium text-foreground">{formatINR(adjustmentAmt)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-extrabold pt-4 border-t border-border mt-3">
          <span className="text-foreground">Final Package Total</span>
          <span className="text-primary">{formatINR(finalAmount)}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-6 border-t border-border">
        <Button variant="outline" className="flex-1 h-11 rounded-xl font-semibold" onClick={onBack}>Back</Button>
        <Button className="flex-1 h-11 rounded-xl font-bold" onClick={onNext} disabled={isSaving}>
          {isSaving ? 'Saving Package...' : 'Save Package'}
        </Button>
      </div>
    </motion.div>
  );
};

export default PackageStep2;