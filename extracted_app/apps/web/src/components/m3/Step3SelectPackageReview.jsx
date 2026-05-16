import React, { useState, useEffect } from 'react';
import AppButton from '@/components/m3/AppButton';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Package as PackageIcon, Layers, Loader2, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/currencyUtils';
import { formatEventDates } from '@/lib/quotationUtils';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const Step3SelectPackageReview = ({ 
  data, 
  updateData, 
  onBack, 
  onSave, 
  packages, 
  allItems, 
  customers,
  loading
}) => {
  const [localPackages, setLocalPackages] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  const [termsList, setTermsList] = useState([]);
  const [universalTermsList, setUniversalTermsList] = useState([]);
  const [isFetchingPackages, setIsFetchingPackages] = useState(true);
  
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    const fetchUniversalData = async () => {
      setIsFetchingPackages(true);
      try {
        // NOTE: terms collection currently lacks user_id in schema, removing filter to prevent 400 error.
        const [uPkgsRes, uItemsRes, termsRes, uniTermsRes] = await Promise.allSettled([
          pb.collection('universal_packages').getList(1, 100, { $autoCancel: false }),
          pb.collection('universal_items').getList(1, 100, { $autoCancel: false }),
          pb.collection('terms').getFullList({ 
            sort: 'term_name', 
            $autoCancel: false 
          }),
          pb.collection('universal_terms').getFullList({ 
            sort: 'term_name', 
            $autoCancel: false 
          })
        ]);
        
        const uPkgs = uPkgsRes.status === 'fulfilled' ? uPkgsRes.value : { items: [] };
        const uItems = uItemsRes.status === 'fulfilled' ? uItemsRes.value : { items: [] };
        const fetchedTerms = termsRes.status === 'fulfilled' ? termsRes.value : [];
        const fetchedUniTerms = uniTermsRes.status === 'fulfilled' ? uniTermsRes.value : [];

        const formattedUPkgs = (uPkgs.items || []).map(p => ({ ...p, isUniversal: true }));
        const formattedUItems = (uItems.items || []).map(i => ({ ...i, isUniversal: true }));
        
        const combinedPackages = [...packages, ...formattedUPkgs];
        const uniquePackages = Array.from(new Map(combinedPackages.map(p => [p.packageName, p])).values());
        
        setLocalPackages(uniquePackages);
        setLocalItems([...allItems, ...formattedUItems]);
        setTermsList(fetchedTerms);
        setUniversalTermsList(fetchedUniTerms);
      } catch (err) {
        console.error('Failed to process universal data or terms:', err);
        const uniquePackages = Array.from(new Map(packages.map(p => [p.packageName, p])).values());
        setLocalPackages(uniquePackages);
        setLocalItems(allItems);
      } finally {
        setIsFetchingPackages(false);
      }
    };
    
    fetchUniversalData();
  }, [packages, allItems]);

  const handlePackageSelect = async (packageId) => {
    setSubmitAttempted(false);
    
    if (packageId === 'manual') {
      updateData({ 
        selectedPackage_universal: 'manual', 
        selectedTermId: '',
        termsAndConditions: '',
        lineItems: { 
          ...data.lineItems, 
          baseAmount: 0,
          groups: [{ groupTitle: 'Custom Items', isCustom: true, items: [] }],
          discount: { type: 'fixed', value: 0 },
          adjustment: { heading: 'Adjustment', value: 0 }
        }
      });
      return;
    }

    try {
      const isUniversal = localPackages.find(p => p.id === packageId)?.isUniversal;
      const collectionName = isUniversal ? 'universal_packages' : 'packages';
      
      const selectedPkg = await pb.collection(collectionName).getOne(packageId, { $autoCancel: false });
      
      let parsedGroups = [];
      try {
        parsedGroups = selectedPkg.groups ? JSON.parse(selectedPkg.groups) : [];
      } catch (e) {}

      const groups = parsedGroups.map(group => ({
        groupTitle: group.title || group.groupTitle || 'Group',
        isCustom: false,
        items: (group.items || []).map(itemObj => {
          const itemId = typeof itemObj === 'string' ? itemObj : (itemObj.id || itemObj.itemId);
          const qty = typeof itemObj === 'string' ? 1 : (itemObj.quantity || 1);
          const itemDetails = localItems.find(i => i.id === itemId);
          
          return {
            itemId: itemId,
            itemName: itemObj.itemName || itemObj.customName || itemDetails?.itemName || 'Unknown Item',
            description: itemObj.description !== undefined ? itemObj.description : (itemDetails?.description || ''),
            quantity: qty,
            price: itemObj.price !== undefined ? parseFloat(itemObj.price) : (parseFloat(itemDetails?.price) || 0)
          };
        }).filter(i => i.itemName !== 'Unknown Item')
      }));

      let newTerms = data.termsAndConditions;
      let newTermId = data.selectedTermId || '';
      
      if (selectedPkg.terms) {
        const termId = Array.isArray(selectedPkg.terms) ? selectedPkg.terms[0] : selectedPkg.terms;
        const termObj = termsList.find(t => t.id === termId) || universalTermsList.find(t => t.id === termId);
        if (termObj) {
          newTerms = termObj.term_description;
          newTermId = termObj.id;
        }
      }

      let pkgDiscount = { type: 'fixed', value: 0 };
      if (selectedPkg.discount) {
        if (typeof selectedPkg.discount === 'string') {
          try { pkgDiscount = JSON.parse(selectedPkg.discount); } catch(e) {}
        } else {
          pkgDiscount = selectedPkg.discount;
        }
      }

      updateData({ 
        selectedPackage_universal: packageId, 
        termsAndConditions: newTerms,
        selectedTermId: newTermId,
        lineItems: { 
          ...data.lineItems, 
          baseAmount: parseFloat(selectedPkg.baseAmount) || 0,
          groups,
          discount: pkgDiscount,
          adjustment: { 
            heading: selectedPkg.adjustmentHeading || 'Adjustment', 
            value: parseFloat(selectedPkg.adjustment) || 0 
          }
        }
      });
    } catch (error) {
      console.error("Error fetching package details:", error);
      toast.error("Failed to load package details");
      updateData({ selectedPackage_universal: packageId });
    }
  };

  const handleTermSelect = (val) => {
    if (val === 'none') {
      updateData({ selectedTermId: '', termsAndConditions: '' });
      return;
    }
    const term = termsList.find(t => t.id === val) || universalTermsList.find(t => t.id === val);
    updateData({ 
      selectedTermId: val, 
      termsAndConditions: term ? term.term_description : '' 
    });
  };

  const updateLineItem = (groupIndex, itemIndex, field, value) => {
    const updatedGroups = [...data.lineItems.groups];
    updatedGroups[groupIndex].items[itemIndex][field] = field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value;
    updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
  };

  const removeLineItem = (groupIndex, itemIndex) => {
    const updatedGroups = [...data.lineItems.groups];
    updatedGroups[groupIndex].items.splice(itemIndex, 1);
    updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
  };

  const updateGroupTitle = (groupIndex, title) => {
    const updatedGroups = [...data.lineItems.groups];
    updatedGroups[groupIndex].groupTitle = title;
    updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
  };

  const addItemToCustomGroup = (groupIndex, itemId) => {
    if (!itemId) return;
    const itemDetails = localItems.find(i => i.id === itemId);
    if (itemDetails) {
      const updatedGroups = [...data.lineItems.groups];
      updatedGroups[groupIndex].items.push({
        itemId: itemId,
        itemName: itemDetails.itemName,
        description: itemDetails.description || '',
        quantity: 1,
        price: parseFloat(itemDetails.price) || 0
      });
      updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
    }
  };

  const addManualItem = (groupIndex) => {
    const updatedGroups = [...data.lineItems.groups];
    updatedGroups[groupIndex].items.push({
      itemId: `manual-${Date.now()}`,
      itemName: 'New Item',
      description: '',
      quantity: 1,
      price: 0
    });
    updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
  };

  const addCustomGroup = () => {
    const updatedGroups = [...data.lineItems.groups, { groupTitle: 'New Custom Group', isCustom: true, items: [] }];
    updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
  };

  const removeGroup = (groupIndex) => {
    const updatedGroups = [...data.lineItems.groups];
    updatedGroups.splice(groupIndex, 1);
    updateData({ lineItems: { ...data.lineItems, groups: updatedGroups } });
  };

  const baseAmount = parseFloat(data.lineItems?.baseAmount) || 0;
  const itemsTotal = (data.lineItems?.groups || []).reduce((sum, group) => {
    return sum + (group.items || []).reduce((itemSum, item) => itemSum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)), 0);
  }, 0);
  const subtotal = baseAmount + itemsTotal;
  
  let discountAmt = 0;
  if (data.lineItems?.discount?.type === 'percentage') {
    discountAmt = subtotal * ((parseFloat(data.lineItems.discount.value) || 0) / 100);
  } else {
    discountAmt = parseFloat(data.lineItems?.discount?.value) || 0;
  }
  
  let adjustmentAmt = 0;
  if (typeof data.lineItems?.adjustment === 'object') {
    adjustmentAmt = parseFloat(data.lineItems.adjustment.value) || 0;
  } else {
    adjustmentAmt = parseFloat(data.lineItems?.adjustment) || 0;
  }
  
  const total = subtotal - discountAmt + adjustmentAmt;

  const handleCreateQuotation = async () => {
    setSubmitAttempted(true);
    
    if (!data.selectedPackage_universal || data.selectedPackage_universal.trim() === '') {
      toast.error("Please select a package or choose manual entry to proceed.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!data.customerName?.trim()) {
      toast.error("Customer name is missing. Please go back to Step 1.");
      return;
    }
    if (!data.customerPhone?.trim()) {
      toast.error("Customer phone is missing. Please go back to Step 1.");
      return;
    }
    if (!data.eventDays || data.eventDays.length === 0) {
      toast.error("Event dates are missing. Please go back to Step 2.");
      return;
    }

    try {
      const currentUserId = pb.authStore.model?.id;

      if (!currentUserId) {
        toast.error("User authentication error. Please log in again.");
        return;
      }

      const quotationPayload = {
        customer_name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail || '',
        eventName: data.eventName || data.eventDays[0]?.name || 'Event',
        location: data.location || '',
        eventDate: new Date(data.eventDays[0]?.date || new Date()).toISOString(),
        eventDays: data.eventDays,
        lineItems: data.lineItems,
        termsAndConditions: data.termsAndConditions || '',
        totalAmount: total,
        status: data.id ? data.status : 'draft',
        user_id: currentUserId,
      };

      if (data.customer && typeof data.customer === 'string' && data.customer.trim() !== '') {
        quotationPayload.customer = data.customer;
      }
      
      if (data.selectedPackage_universal && data.selectedPackage_universal !== 'manual' && typeof data.selectedPackage_universal === 'string' && data.selectedPackage_universal.trim() !== '') {
        quotationPayload.selectedPackage_universal = data.selectedPackage_universal;
      }
      
      if (pb.authStore.model?.plan_id) {
        quotationPayload.plan_id = pb.authStore.model.plan_id;
      }

      await onSave('sent', data.id ? 'update' : 'create', quotationPayload);
    } catch (error) {
      console.error("Error preparing quotation data:", error);
      toast.error("Failed to prepare quotation data.");
    }
  };

  const selectedPkgDetails = localPackages.find(p => p.id === data.selectedPackage_universal);
  const customerDetails = customers.find(c => c.id === data.customer);

  const packageGroups = (data.lineItems?.groups || []).map((g, i) => ({ ...g, originalIndex: i })).filter(g => !g.isCustom);
  const customGroups = (data.lineItems?.groups || []).map((g, i) => ({ ...g, originalIndex: i })).filter(g => g.isCustom);
  
  const showPackageError = submitAttempted && (!data.selectedPackage_universal || data.selectedPackage_universal.trim() === '');

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="mb-2 border-b border-border pb-3">
        <h3 className="text-xl font-extrabold text-foreground tracking-tight">Step 3: Package & Review</h3>
      </div>
      
      <div className={`space-y-2 p-1 transition-colors ${showPackageError ? 'bg-destructive/5 rounded-xl border border-destructive/20 p-3' : ''}`}>
        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
          <span>Select Package *</span>
          {showPackageError && (
            <span className="text-xs text-destructive font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Required field
            </span>
          )}
        </label>
        
        <Select value={data.selectedPackage_universal || ''} onValueChange={handlePackageSelect} disabled={isFetchingPackages}>
          <SelectTrigger className={`w-full rounded-xl bg-background h-12 text-sm focus:ring-1 shadow-sm transition-all ${showPackageError ? 'border-destructive focus:ring-destructive ring-1 ring-destructive/20' : 'border-input focus:ring-primary'}`}>
            {isFetchingPackages ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching packages...
              </div>
            ) : (
              <SelectValue placeholder="Select a predefined package" />
            )}
          </SelectTrigger>
          <SelectContent>
            {localPackages.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.packageName} {p.isUniversal && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md ml-2 font-semibold">TEMPLATE</span>}
              </SelectItem>
            ))}
            {!isFetchingPackages && (
              <SelectItem value="manual" className="font-bold text-primary">Create Custom Package (Manual Entry)</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedPkgDetails && selectedPkgDetails.description && (
        <div className="bg-muted/40 p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground italic">{selectedPkgDetails.description}</p>
        </div>
      )}

      {data.selectedPackage_universal && (
        <div className="mt-4 space-y-6">
          
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Base Package Amount</h4>
            <div className="flex items-center gap-1.5 relative">
              <span className="text-sm font-medium text-muted-foreground absolute left-3">₹</span>
              <input
                type="number"
                value={data.lineItems?.baseAmount || 0}
                onChange={(e) => updateData({ lineItems: { ...data.lineItems, baseAmount: parseFloat(e.target.value) || 0 } })}
                className="w-28 h-9 text-right border border-input rounded-md text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-1 bg-background px-2 pl-6"
                min="0"
              />
            </div>
          </div>

          {packageGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <PackageIcon className="w-4 h-4 text-primary" />
                <h4 className="text-base font-bold text-foreground">Package Items</h4>
              </div>
              {packageGroups.map((group) => (
                <div key={group.originalIndex} className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
                  <input 
                    value={group.groupTitle}
                    onChange={(e) => updateGroupTitle(group.originalIndex, e.target.value)}
                    className="text-sm font-bold text-foreground bg-transparent outline-none w-full border-b border-transparent focus:border-border pb-1"
                  />
                  {group.items.map((item, iIndex) => (
                    <div key={iIndex} className="flex flex-col gap-3 bg-background border border-border rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <input 
                            value={item.itemName}
                            onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'itemName', e.target.value)}
                            className="text-sm font-semibold text-foreground w-full outline-none bg-transparent border-b border-transparent focus:border-border"
                            placeholder="Item Name"
                          />
                          <input 
                            value={item.description}
                            onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'description', e.target.value)}
                            placeholder="Description (Optional)"
                            className="text-xs text-muted-foreground w-full outline-none bg-transparent mt-1 border-b border-transparent focus:border-border"
                          />
                        </div>
                        <button onClick={() => removeLineItem(group.originalIndex, iIndex)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'quantity', e.target.value)}
                            className="w-14 h-8 text-center border border-input rounded-md text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 relative">
                          <span className="text-xs font-medium text-muted-foreground absolute left-2">₹</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'price', e.target.value)}
                            className="w-24 h-8 text-right border border-input rounded-md text-sm font-semibold text-foreground outline-none focus:border-primary pl-5 pr-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h4 className="text-base font-bold text-foreground">Additional Extras</h4>
              </div>
              <button 
                onClick={addCustomGroup}
                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Group
              </button>
            </div>
            
            {customGroups.map((group) => (
              <div key={group.originalIndex} className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center">
                  <input 
                    value={group.groupTitle}
                    onChange={(e) => updateGroupTitle(group.originalIndex, e.target.value)}
                    className="text-sm font-bold text-foreground bg-transparent outline-none flex-1 border-b border-transparent focus:border-border pb-1"
                    placeholder="Extra Items Group"
                  />
                  <button onClick={() => removeGroup(group.originalIndex)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors ml-2 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {group.items.map((item, iIndex) => (
                  <div key={iIndex} className="flex flex-col gap-3 bg-background border border-border rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <input 
                          value={item.itemName}
                          onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'itemName', e.target.value)}
                          className="text-sm font-semibold text-foreground w-full outline-none bg-transparent border-b border-transparent focus:border-border"
                          placeholder="Item Name"
                        />
                        <input 
                          value={item.description}
                          onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'description', e.target.value)}
                          placeholder="Description (Optional)"
                          className="text-xs text-muted-foreground w-full outline-none bg-transparent mt-1 border-b border-transparent focus:border-border"
                        />
                      </div>
                      <button onClick={() => removeLineItem(group.originalIndex, iIndex)} className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'quantity', e.target.value)}
                          className="w-14 h-8 text-center border border-input rounded-md text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 relative">
                        <span className="text-xs font-medium text-muted-foreground absolute left-2">₹</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateLineItem(group.originalIndex, iIndex, 'price', e.target.value)}
                          className="w-24 h-8 text-right border border-input rounded-md text-sm font-semibold text-foreground outline-none focus:border-primary pl-5 pr-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <select
                    className="flex-1 text-sm border border-input rounded-lg p-2 outline-none focus:border-primary bg-background h-10 transition-colors"
                    onChange={(e) => {
                      addItemToCustomGroup(group.originalIndex, e.target.value);
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add Pre-saved Item</option>
                    {localItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemName} {item.isUniversal ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => addManualItem(group.originalIndex)}
                    className="px-4 py-2 border border-dashed border-input rounded-lg text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors h-10 flex items-center justify-center bg-muted/30 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Custom
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.selectedPackage_universal && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-sm">
              <h4 className="text-sm font-bold text-foreground">Apply Discount</h4>
              <div className="flex bg-muted rounded-md p-1 border border-border">
                <button 
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${data.lineItems?.discount?.type === 'fixed' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}
                  onClick={() => updateData({ lineItems: { ...data.lineItems, discount: { ...data.lineItems?.discount, type: 'fixed' } } })}
                >
                  Fixed
                </button>
                <button 
                  className={`flex-1 py-1.5 text-xs font-semibold rounded ${data.lineItems?.discount?.type === 'percentage' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}
                  onClick={() => updateData({ lineItems: { ...data.lineItems, discount: { ...data.lineItems?.discount, type: 'percentage' } } })}
                >
                  Percentage (%)
                </button>
              </div>
              <div className="flex items-center justify-between bg-background p-2 rounded-md border border-input focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                <input
                  type="number"
                  value={data.lineItems?.discount?.value || ''}
                  onChange={(e) => updateData({ lineItems: { ...data.lineItems, discount: { ...data.lineItems?.discount, value: parseFloat(e.target.value) || 0 } } })}
                  className="w-full bg-transparent border-none text-sm outline-none px-2 font-medium"
                  placeholder="0"
                  min="0"
                />
                <span className="text-sm font-bold text-destructive px-2 border-l border-border">
                  {data.lineItems?.discount?.type === 'fixed' ? `₹${data.lineItems?.discount?.value || 0}` : `${data.lineItems?.discount?.value || 0}%`}
                </span>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border space-y-3 shadow-sm">
              <input 
                value={data.lineItems?.adjustment?.heading || 'Adjustment'}
                onChange={(e) => updateData({ lineItems: { ...data.lineItems, adjustment: { ...data.lineItems?.adjustment, heading: e.target.value } } })}
                className="text-sm font-bold text-foreground bg-transparent outline-none w-full border-b border-transparent focus:border-border pb-1 placeholder:text-muted-foreground"
                placeholder="Custom Adjustment Label"
              />
              <div className="h-[2px]"></div>
              <div className="flex items-center justify-between bg-background p-2 rounded-md border border-input focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                <span className="text-sm font-medium text-muted-foreground pl-2">₹</span>
                <input
                  type="number"
                  value={data.lineItems?.adjustment?.value || ''}
                  onChange={(e) => updateData({ lineItems: { ...data.lineItems, adjustment: { ...data.lineItems?.adjustment, value: parseFloat(e.target.value) || 0 } } })}
                  className="w-full text-right bg-transparent border-none text-sm font-medium outline-none px-2"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-sm font-bold text-foreground">Terms & Conditions</label>
            <Select value={data.selectedTermId || ''} onValueChange={handleTermSelect}>
              <SelectTrigger className="w-full h-11 text-sm rounded-xl border-input bg-background">
                <SelectValue placeholder="Select terms template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
                
                {termsList.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Personal Terms</SelectLabel>
                    {termsList.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-sm">{t.term_name}</SelectItem>
                    ))}
                  </SelectGroup>
                )}

                {universalTermsList.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">Universal Terms</SelectLabel>
                    {universalTermsList.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-sm">{t.term_name}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mt-6 space-y-6 shadow-md">
            <h4 className="text-lg font-extrabold text-foreground border-b border-border pb-3">Quotation Summary</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer Details</h5>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{data.customerName || customerDetails?.name || '-'}</p>
                  <p className="text-sm text-muted-foreground">{data.customerPhone ? `+${data.countryCode || '91'} ${data.customerPhone}` : (customerDetails?.phone || '-')}</p>
                  {data.customerEmail && <p className="text-sm text-muted-foreground">{data.customerEmail}</p>}
                  {customerDetails?.address && <p className="text-sm text-muted-foreground">{customerDetails.address}</p>}
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Event Details</h5>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{data.eventName || '-'}</p>
                  <p className="text-sm text-muted-foreground">{data.location || '-'}</p>
                  <p className="text-sm text-muted-foreground">{formatEventDates(data.eventDays)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pricing Breakdown</h5>
              
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex justify-between text-sm font-bold text-foreground">
                  <span>Base Package Amount</span>
                  <span>{formatINR(baseAmount)}</span>
                </div>
                {(data.lineItems?.groups || []).map((group, idx) => (
                  <div key={idx} className="space-y-1.5 pt-2 border-t border-border">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">{group.groupTitle}</p>
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between text-sm text-muted-foreground pl-2">
                        <span>{item.quantity}x {item.itemName}</span>
                        <span>{formatINR(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                
                <div className="pt-3 border-t border-border space-y-2 mt-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Items Subtotal</span>
                    <span className="text-foreground">{formatINR(subtotal)}</span>
                  </div>
                  {data.lineItems?.discount?.value > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Discount ({data.lineItems.discount.type === 'percentage' ? `${data.lineItems.discount.value}%` : 'Fixed'})</span>
                      <span className="font-bold text-destructive">
                        -{formatINR(discountAmt)}
                      </span>
                    </div>
                  )}
                  {adjustmentAmt !== 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{data.lineItems?.adjustment?.heading || 'Adjustment'}</span>
                      <span className="font-bold text-foreground">{formatINR(adjustmentAmt)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-border">
                  <span className="text-base font-extrabold text-foreground">Final Total</span>
                  <span className="text-xl font-extrabold text-primary">{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col md:flex-row gap-3 mt-6">
        <AppButton variant="tonal" className="w-full md:w-1/3 h-12 text-sm font-bold rounded-xl" onClick={onBack}>
          Back
        </AppButton>
        <AppButton variant="filled" className="w-full md:w-2/3 h-12 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow" onClick={handleCreateQuotation} loading={loading}>
          {data.id ? 'Save Changes' : 'Generate Quotation'}
        </AppButton>
      </div>
    </div>
  );
};

export default Step3SelectPackageReview;