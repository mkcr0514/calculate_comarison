/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  ChevronDown, 
  Download, 
  Share2, 
  Edit2, 
  X, 
  Plus, 
  ChevronUp, 
  Minimize2, 
  Maximize2,
  Check,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react';
import { ALL_PRODUCTS, CATEGORIES, KEY_LABELS, KEY_UNITS, TAB_NAMES } from './constants';
import { Product, Category, BenefitValue } from './types';
import { cn, formatNumber } from './lib/utils';

export default function App() {
  const [activeProducts, setActiveProducts] = useState<Product[]>([ALL_PRODUCTS[0]]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [filledAmounts, setFilledAmounts] = useState<Record<number, number>>({});
  const [paymentTerms, setPaymentTerms] = useState<Record<number, string>>({});
  const [editingMode, setEditingMode] = useState<Record<number, boolean>>({});
  const [activeSingleCat, setActiveSingleCat] = useState(CATEGORIES[0].key);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [diffMode, setDiffMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSelected, setAddSelected] = useState<number[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);

  const scrollZoneRef = useRef<HTMLDivElement>(null);
  const inlineHeaderRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  const isSingle = activeProducts.length === 1;

  // Sync scroll
  const matrixScrollRef = useRef<HTMLDivElement>(null);
  const inlineScrollRef = useRef<HTMLDivElement>(null);

  const handleMatrixScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (inlineScrollRef.current) inlineScrollRef.current.scrollLeft = scrollLeft;
  };

  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (matrixScrollRef.current) matrixScrollRef.current.scrollLeft = scrollLeft;
  };

  useEffect(() => {
    const handleGlobalScroll = () => {
      if (!scrollZoneRef.current) return;
      const st = scrollZoneRef.current.scrollTop;
      
      // Control sticky header
      setShowStickyHeader(st > 200);
      
      // Control floating components
      setShowBackToTop(st > 300);
      setShowFloatingToolbar(st > 100 && !isSingle);
      
      lastScrollTopRef.current = st <= 0 ? 0 : st;
    };

    const zone = scrollZoneRef.current;
    zone?.addEventListener('scroll', handleGlobalScroll);
    return () => zone?.removeEventListener('scroll', handleGlobalScroll);
  }, [isSingle]);

  const scrollToTop = () => {
    scrollZoneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBenefitVal = (pid: number, key: string): BenefitValue | 'none' | null => {
    // Only show values if the user has explicitly confirmed the input
    if (editingMode[pid] !== false) return null;
    
    const amt = filledAmounts[pid];
    if (!amt) return null;
    const ratio = ALL_PRODUCTS[pid].ratios[key];
    if (ratio === null) return 'none';
    return {
      amt: formatNumber(Math.round((amt * ratio) / 100) * 100),
      unit: KEY_UNITS[key],
    };
  };

  const isSameValue = (key: string) => {
    if (activeProducts.length < 2) return false;
    // Only compare if all products are confirmed
    const allConfirmed = activeProducts.every(p => editingMode[p.id] === false);
    if (!allConfirmed) return false;
    
    const values = activeProducts.map(p => {
      const r = p.ratios[key];
      // Note: we use filledAmounts directly here since we already verified completion via allConfirmed
      return r === null ? null : Math.round((filledAmounts[p.id] * r) / 100) * 100;
    });
    
    if (values.some(v => v === null)) return false;
    return values.every(v => v === values[0]);
  };

  const calculateAnnualPremium = (pid: number) => {
    const amt = filledAmounts[pid];
    if (!amt) return null;
    return formatNumber(Math.round(ALL_PRODUCTS[pid].fakeBase * (amt / 500)));
  };

  const addProducts = () => {
    const newProducts = [...activeProducts];
    addSelected.forEach(id => {
      const p = ALL_PRODUCTS.find(ap => ap.id === id);
      if (p) newProducts.push(p);
    });
    setActiveProducts(newProducts);
    setActivePageIndex(activeProducts.length);
    setIsAddModalOpen(false);
    setAddSelected([]);
  };

  const deleteProduct = () => {
    if (pendingDeleteId === null) return;
    const newProducts = activeProducts.filter(p => p.id !== pendingDeleteId);
    setActiveProducts(newProducts);
    const newAmounts = { ...filledAmounts };
    delete newAmounts[pendingDeleteId];
    setFilledAmounts(newAmounts);
    setActivePageIndex(Math.min(activePageIndex, newProducts.length - 1));
    setPendingDeleteId(null);
  };

  const toggleAllSections = () => {
    const newState = !allCollapsed;
    setAllCollapsed(newState);
    const newCollapsed: Record<string, boolean> = {};
    CATEGORIES.forEach(cat => {
      newCollapsed[cat.key] = newState;
    });
    setCollapsedSections(newCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#F0F0F5] flex items-center justify-center p-0 sm:p-6 font-sans">
      <div className="w-full max-w-[393px] h-[812px] bg-[#E5E5EA] rounded-[44px] overflow-hidden shadow-2xl flex flex-col relative border-[8px] border-white ring-1 ring-black/5">
        
        {/* Status Bar */}
        <div className="h-[50px] bg-white flex items-end justify-center pb-1.5 shrink-0">
          <div className="w-[120px] h-[30px] bg-white border border-[#D1D1D6] rounded-full flex items-center justify-center gap-2">
            <div className="w-[10px] h-[10px] rounded-full border border-[#D1D1D6]" />
            <div className="w-[40px] h-[4px] rounded-full bg-[#D1D1D6]" />
          </div>
        </div>
        <div className="h-[20px] bg-white flex items-center justify-between px-6 shrink-0 border-b border-[#E5E5EA]">
          <span className="text-[12px] text-[#6C6C70] font-medium">9:41</span>
          <span className="text-[12px] text-[#6C6C70] font-medium">100%</span>
        </div>

        {/* Brand Header */}
        <header className="h-[52px] bg-white flex items-center px-4 shrink-0 border-b border-[#E5E5EA] relative">
          <button className="p-1">
            <Menu className="w-5 h-5 text-[#1C1C1E]" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[#1C1C1E] tracking-tight">國泰人壽</span>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          
          <div className="flex-1 overflow-y-auto scroll-smooth" ref={scrollZoneRef}>
            
            {/* Content Header */}
            <header className="bg-white p-4 pb-3 border-b border-[#E5E5EA]">
              <div className="text-[14px] text-[#6C6C70] mb-1.5 flex items-center gap-1">
                首頁 <ChevronDown className="w-2 h-2 rotate-270" /> 商品試算
              </div>
              <div className="flex items-center justify-between">
                <h1 className="text-[18px] font-semibold text-[#1C1C1E]">商品試算</h1>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 text-[14px] color-[#00703C] border border-[#A8D5B5] rounded-full px-2.5 py-1.5 text-[#00703C]">
                    <Download className="w-3.5 h-3.5" /> 保存結果
                  </button>
                  <button className="flex items-center gap-1 text-[14px] color-[#00703C] border border-[#A8D5B5] rounded-full px-2.5 py-1.5 text-[#00703C]">
                    <Share2 className="w-3.5 h-3.5" /> 分享
                  </button>
                </div>
              </div>
            </header>

            {/* Insured Bar */}
            <div className="bg-white px-4 py-2 flex items-center justify-between border-b border-[#E5E5EA]">
              <div>
                <div className="text-[14px] text-[#6C6C70]">被保險人資料</div>
                <div className="text-base text-[#1C1C1E] font-medium">2000/01/01・女性・第一類</div>
              </div>
              <button className="text-[14px] text-[#00703C] border border-[#A8D5B5] rounded-md px-2.5 py-1">編輯</button>
            </div>

            {/* Product Tabs Area */}
            {isSingle ? (
              <div className="bg-white p-4 flex items-start justify-between gap-3 border-b border-[#E5E5EA]">
                <div className="text-base font-medium text-[#1C1C1E] leading-relaxed flex-1">
                  {activeProducts[0].full}
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-[14px] text-[#00703C] border border-[#A8D5B5] rounded-md px-2.5 py-1.5 whitespace-nowrap mt-0.5"
                >
                  比較同類商品
                </button>
              </div>
            ) : (
              <div className="bg-white border-b border-[#E5E5EA] shrink-0 z-20">
                <div className="flex w-full">
                  {activeProducts.map((p, i) => (
                    <div 
                      key={p.id}
                      onClick={() => setActivePageIndex(i)}
                      className={cn(
                        "flex-1 p-[9px_8px] text-base font-medium cursor-pointer border-b-2 flex items-center justify-between min-width-0 gap-1",
                        i === activePageIndex ? "text-[#00703C] border-[#009A4E]" : "text-[#6C6C70] border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="leading-tight">{TAB_NAMES[i]}</span>
                        {!filledAmounts[p.id] && <div className="w-1.5 h-1.5 rounded-full bg-[#E24B4A] shrink-0" />}
                      </div>
                      {i === activePageIndex && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPendingDeleteId(p.id); }}
                          className="w-4 h-4 flex items-center justify-center rounded-full bg-[#F2F2F7] scale-90"
                        >
                          <X className="w-2.5 h-2.5 text-[#6C6C70]" />
                        </button>
                      )}
                    </div>
                  ))}
                  {activeProducts.length < 3 && (
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="p-[9px_10px] border-b-2 border-transparent"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#E6F5EC] border border-[#A8D5B5] flex items-center justify-center text-[#00703C] font-bold">+</div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filling Card */}
            <div className="bg-white border-b-[8px] border-[#E5E5EA]">
              <div className="p-4">
                {editingMode[activeProducts[activePageIndex].id] !== false ? (
                  <div className="space-y-3">
                    {!isSingle && (
                      <div className="text-base font-medium text-[#1C1C1E] leading-tight mb-3">
                        {activeProducts[activePageIndex].full}
                      </div>
                    )}
                    <div className="flex gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#6C6C70] mb-1.5">繳費年期</div>
                        <div className="relative">
                          <select 
                            className="w-full p-[9px_10px] pr-8 border border-[#D1D1D6] rounded-xl text-base text-[#6C6C70] appearance-none bg-white"
                            value={paymentTerms[activeProducts[activePageIndex].id] || ""}
                            onChange={(e) => {
                              setPaymentTerms({ ...paymentTerms, [activeProducts[activePageIndex].id]: e.target.value });
                            }}
                          >
                            <option value="" disabled>請選擇</option>
                            <option value="10">10年期</option>
                            <option value="20">20年期</option>
                            <option value="30">30年期</option>
                            <option value="life">終身繳</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1D9E75] pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#6C6C70] mb-1.5">保額／日額</div>
                        <div className="relative">
                          <input 
                            type="number"
                            className="w-full p-[9px_10px] border border-[#D1D1D6] rounded-xl text-base text-[#1C1C1E]"
                            placeholder={activeProducts[activePageIndex].ph}
                            value={filledAmounts[activeProducts[activePageIndex].id] || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              setFilledAmounts({ ...filledAmounts, [activeProducts[activePageIndex].id]: val });
                            }}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#6C6C70]">元</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const pid = activeProducts[activePageIndex].id;
                        const amt = filledAmounts[pid];
                        const term = paymentTerms[pid];
                        if (term && amt && amt >= activeProducts[activePageIndex].min && amt <= activeProducts[activePageIndex].max) {
                          setEditingMode({ ...editingMode, [pid]: false });
                          if (activePageIndex < activeProducts.length - 1) setActivePageIndex(activePageIndex + 1);
                        }
                      }}
                      className={cn(
                        "w-full p-2.5 rounded-full font-medium mt-2 transition-colors",
                        (paymentTerms[activeProducts[activePageIndex].id] && filledAmounts[activeProducts[activePageIndex].id]) 
                          ? "bg-[#1D9E75] text-white" 
                          : "bg-[#E5E5EA] text-[#6C6C70] cursor-not-allowed"
                      )}
                    >
                      確認
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    { !isSingle && (
                      <div className="text-base font-medium text-[#1C1C1E] leading-tight">
                        {activeProducts[activePageIndex].full}
                      </div>
                    )}
                    <div 
                      onClick={() => setEditingMode({ ...editingMode, [activeProducts[activePageIndex].id]: true })}
                      className="flex gap-2.5 cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#6C6C70] mb-1.5">繳費年期</div>
                        <div className="p-[9px_10px] border border-[#D1D1D6] rounded-xl text-base text-[#1C1C1E] text-center bg-white">
                          {paymentTerms[activeProducts[activePageIndex].id] === "life" ? "終身繳" : (paymentTerms[activeProducts[activePageIndex].id] || "20") + "年期"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#6C6C70] mb-1.5">保額／日額</div>
                        <div className="p-[9px_10px] border border-[#D1D1D6] rounded-xl text-base text-[#1C1C1E] text-center bg-white">
                          {formatNumber(filledAmounts[activeProducts[activePageIndex].id] || 0)} 元
                        </div>
                      </div>
                    </div>
                    {calculateAnnualPremium(activeProducts[activePageIndex].id) && (
                      <div className="text-[16px] text-[#6C6C70] text-right">
                        年繳保費 <span className="text-[16px] text-[#00703C] font-semibold">{calculateAnnualPremium(activeProducts[activePageIndex].id)} 元</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Display Area */}
            {isSingle ? (
              <div className="bg-white">
                <div className="flex border-b border-[#E5E5EA]">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveSingleCat(cat.key)}
                      className={cn(
                        "flex-1 py-2.5 text-base border-b-2 font-medium tracking-tight",
                        activeSingleCat === cat.key ? "text-[#00703C] border-[#009A4E]" : "text-[#6C6C70] border-transparent"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {editingMode[activeProducts[0].id] !== false ? (
                  <div className="p-12 text-center text-[#6C6C70] text-[13px] leading-relaxed">
                    請填寫上方繳費年期與保額<br />並按下確認即可顯示保障金額
                  </div>
                ) : (
                  <div>
                    {CATEGORIES.find(c => c.key === activeSingleCat)?.keys.map(key => {
                      const v = getBenefitVal(activeProducts[0].id, key);
                      return (
                        <div key={key} className="flex items-center justify-between p-4 border-b border-[#E5E5EA] last:border-0">
                          <span className="text-base text-[#1C1C1E]">{KEY_LABELS[key]}</span>
                          <div className="text-right">
                            {v === null ? (
                              <span className="text-[13px] text-[#C7C7CC]">–</span>
                            ) : v === 'none' ? (
                              <span className="text-[13px] text-[#6C6C70]">不含</span>
                            ) : (
                              <span className="text-base font-medium text-[#1C1C1E]">
                                {v.amt}<span className="text-[13px] text-[#6C6C70] ml-0.5 font-normal">{v.unit}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white flex flex-col">
                {/* Fixed Sticky Header Row (Vertical Sticky) */}
                <div className="sticky top-0 z-30 bg-white border-b border-[#D1D1D6]">
                  <div className="overflow-x-auto scrollbar-hide" ref={inlineScrollRef} onScroll={handleHeaderScroll}>
                    <div className="flex min-w-max">
                      <div className="sticky left-0 z-40 w-[115px] shrink-0 min-h-16 p-2 border-r border-[#E5E5EA] flex items-center text-[16px] font-medium text-[#6C6C70] bg-white">
                        保障項目
                      </div>
                      <div className="flex">
                        {activeProducts.map((p, i) => (
                          <div 
                            key={p.id}
                            onClick={() => setActivePageIndex(i)}
                            className={cn(
                              "w-[110px] shrink-0 min-h-16 p-2 border-l border-[#E5E5EA] flex flex-col justify-between cursor-pointer first:border-l-0",
                              i === activePageIndex && "bg-slate-50"
                            )}
                          >
                            <div className={cn("text-[16px] font-medium leading-tight", i === activePageIndex ? "text-[#00703C]" : "text-[#6C6C70]")}>
                              {p.full}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide" ref={matrixScrollRef} onScroll={handleMatrixScroll}>
                  <div className="min-w-max flex flex-col">
                    {/* Unified Rows */}
                    <div className="flex flex-col">
                      {CATEGORIES.map(cat => (
                        <React.Fragment key={cat.key}>
                          <div className="flex">
                            <button 
                              onClick={() => setCollapsedSections({ ...collapsedSections, [cat.key]: !collapsedSections[cat.key] })}
                              className="sticky left-0 z-20 w-[115px] h-9 bg-[#F2F2F7] border-b border-r border-[#E5E5EA] flex items-center justify-between px-2.5 text-[16px] font-medium text-[#1C1C1E]"
                            >
                              {cat.label}
                              <span className="text-[#6C6C70]">{collapsedSections[cat.key] ? '+' : '−'}</span>
                            </button>
                            <div className="flex">
                              {activeProducts.map((_, i) => (
                                <div key={i} className={cn("w-[110px] shrink-0 h-9 bg-[#F2F2F7] border-b border-l border-[#E5E5EA] first:border-l-0", i === activePageIndex && "bg-slate-100")} />
                              ))}
                            </div>
                          </div>
                          {!collapsedSections[cat.key] && cat.keys.map(key => {
                            if (diffMode && isSameValue(key)) return null;
                            return (
                              <div key={key} className="flex group min-h-16">
                                <div className="sticky left-0 z-20 w-[115px] shrink-0 bg-white border-b border-r border-[#E5E5EA] p-2.5 flex items-center">
                                  <span className="text-base text-[#1C1C1E] leading-tight font-medium opacity-90">{KEY_LABELS[key]}</span>
                                </div>
                                <div className="flex">
                                  {activeProducts.map((p, i) => {
                                    const v = getBenefitVal(p.id, key);
                                    return (
                                      <div 
                                        key={p.id}
                                        onClick={() => setActivePageIndex(i)}
                                        className={cn(
                                          "w-[110px] shrink-0 bg-white border-b border-l border-[#E5E5EA] p-2.5 flex flex-col justify-center cursor-pointer first:border-l-0",
                                          i === activePageIndex && "bg-slate-50"
                                        )}
                                      >
                                        {v === null ? (
                                          <span className="text-[12px] text-[#D1D1D6] font-normal">–</span>
                                        ) : v === 'none' ? (
                                          <span className="text-[12px] text-[#6C6C70] font-normal">不含</span>
                                        ) : (
                                          <>
                                            <div className="text-base font-semibold text-[#1C1C1E]">{v.amt}</div>
                                            <div className="text-[14px] text-[#6C6C70] mt-0.5">{v.unit}</div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="h-20" />
          </div>
        </main>

        {/* Modals */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="absolute inset-0 z-[60] flex items-end">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full bg-white rounded-t-[20px] p-4 relative z-10 max-h-[80%] flex flex-col"
              >
                <div className="w-9 h-1 bg-[#C7C7CC] rounded-full mx-auto mb-4 shrink-0" />
                <h3 className="text-[16px] font-semibold text-[#1C1C1E] mb-1">比較同類商品</h3>
                <p className="text-[14px] text-[#6C6C70] mb-4">請勾選至多 {3 - activeProducts.length} 個商品</p>
                
                <div className="overflow-y-auto grow space-y-0.5">
                  {ALL_PRODUCTS.filter(p => !activeProducts.some(ap => ap.id === p.id)).map(p => {
                    const isSelected = addSelected.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          if (isSelected) setAddSelected(addSelected.filter(id => id !== p.id));
                          else if (addSelected.length < 3 - activeProducts.length) setAddSelected([...addSelected, p.id]);
                        }}
                        className="flex items-start gap-3 py-3 border-b border-[#E5E5EA] last:border-0 cursor-pointer"
                      >
                        <div className={cn(
                          "w-[18px] h-[18px] border-[1.5px] rounded-[3px] shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                          isSelected ? "bg-[#009A4E] border-[#009A4E]" : "border-[#D1D1D6]"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="text-[16px] font-semibold text-[#1C1C1E] leading-tight mb-1">{p.full}</div>
                          <div className="text-[14px] text-[#6C6C70]">主約・外溢型</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={addProducts}
                  disabled={addSelected.length === 0}
                  className="w-full mt-4 p-3.5 bg-[#009A4E] text-white rounded-xl font-semibold disabled:bg-[#F2F2F7] disabled:text-[#6C6C70]"
                >
                  加入比較
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full mt-2 p-3.5 bg-transparent text-[#6C6C70] border border-[#D1D1D6] rounded-xl"
                >
                  取消
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pendingDeleteId !== null && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPendingDeleteId(null)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full bg-white rounded-2xl p-5 relative z-10 shadow-xl"
              >
                <h3 className="text-base font-semibold text-[#1C1C1E] mb-2">移除商品</h3>
                <p className="text-[13px] text-[#6C6C70] leading-relaxed mb-5">
                  確定要移除「<strong className="text-[#1C1C1E]">{ALL_PRODUCTS.find(p => p.id === pendingDeleteId)?.full}</strong>」嗎？已填寫的條件與保費試算將會清除。
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPendingDeleteId(null)}
                    className="flex-1 p-2.5 bg-[#F2F2F7] text-[#1C1C1E] rounded-xl text-sm font-medium"
                  >
                    取消
                  </button>
                  <button 
                    onClick={deleteProduct}
                    className="flex-1 p-2.5 bg-[#E24B4A] text-white rounded-xl text-sm font-semibold"
                  >
                    確認移除
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Components (Toolbar & Back to Top) */}
        {!isSingle && (
          <div className="absolute bottom-[60px] left-0 right-0 z-[60] px-6 pointer-events-none flex flex-col items-center gap-3">
            <AnimatePresence>
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  onClick={scrollToTop}
                  className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center pointer-events-auto border border-[#E5E5EA] self-end"
                >
                  <ChevronUp className="w-5 h-5 text-[#1C1C1E]" />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showFloatingToolbar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white/95 backdrop-blur-sm rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center h-[52px] px-6 pointer-events-auto border border-[#E5E5EA] gap-4"
                >
                  <button 
                    onClick={toggleAllSections}
                    className="flex items-center gap-2 text-[15px] font-medium text-[#1C1C1E]"
                  >
                    {allCollapsed ? (
                      <>
                        <ChevronsUpDown className="w-4 h-4" />
                        <span>全部展開</span>
                      </>
                    ) : (
                      <>
                        <ChevronsDownUp className="w-4 h-4" />
                        <span>全部收合</span>
                      </>
                    )}
                  </button>
                  
                  <div className="w-[1px] h-4 bg-[#E5E5EA]" />
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-medium text-[#1C1C1E]">只看差異</span>
                    <button 
                      onClick={() => setDiffMode(!diffMode)}
                      className={cn(
                        "w-[44px] h-[24px] rounded-full relative transition-colors p-1",
                        diffMode ? "bg-[#009A4E]" : "bg-[#E5E5EA]"
                      )}
                    >
                      <motion.div 
                        animate={{ x: diffMode ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Home Indicator */}
        <div className="h-[30px] flex items-center justify-center shrink-0">
          <div className="w-[120px] h-[4px] bg-[#C7C7CC] rounded-full" />
        </div>
      </div>
    </div>
  );
}
