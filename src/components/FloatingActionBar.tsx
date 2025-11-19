import { useState } from 'react';
import { X, Menu, Plus, RefreshCw, TrendingUp, History, Save, BarChart3, ArrowDownUp } from 'lucide-react';

interface FloatingActionBarProps {
  onAddArea: () => void;
  onChangeMaterials: () => void;
  onRecalculatePrices: () => void;
  onVersionHistory: () => void;
  onSaveChanges: () => void;
  onToggleAnalytics: () => void;
  onSaveAreasOrder?: () => void;
  hasAreasOrderChanged?: boolean;
  savingAreasOrder?: boolean;
  showAnalytics: boolean;
  versionCount: number;
  areasEmpty: boolean;
}

export function FloatingActionBar({
  onAddArea,
  onChangeMaterials,
  onRecalculatePrices,
  onVersionHistory,
  onSaveChanges,
  onToggleAnalytics,
  onSaveAreasOrder,
  hasAreasOrderChanged = false,
  savingAreasOrder = false,
  showAnalytics,
  versionCount,
  areasEmpty,
}: FloatingActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Open actions menu"
        >
          <Menu className="h-6 w-6 transition-transform group-hover:rotate-90" />
        </button>
      )}

      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsExpanded(false)}
          />

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-full shadow-2xl border border-slate-200 px-4 py-3 flex items-center gap-2 max-w-[95vw] overflow-x-auto">
              <button
                onClick={() => setIsExpanded(false)}
                className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>

              <div className="h-8 w-px bg-slate-200 flex-shrink-0" />

              <button
                onClick={() => {
                  onAddArea();
                  setIsExpanded(false);
                }}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Area</span>
              </button>

              <button
                onClick={() => {
                  onChangeMaterials();
                  setIsExpanded(false);
                }}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-colors font-medium text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Materials</span>
              </button>

              <button
                onClick={() => {
                  onRecalculatePrices();
                  setIsExpanded(false);
                }}
                disabled={areasEmpty}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Prices</span>
              </button>

              <button
                onClick={() => {
                  onVersionHistory();
                  setIsExpanded(false);
                }}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-colors font-medium text-sm relative"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
                {versionCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {versionCount}
                  </span>
                )}
              </button>

              <div className="h-8 w-px bg-slate-200 flex-shrink-0" />

              {hasAreasOrderChanged && onSaveAreasOrder && (
                <button
                  onClick={() => {
                    onSaveAreasOrder();
                    setIsExpanded(false);
                  }}
                  disabled={savingAreasOrder}
                  className="flex-shrink-0 h-10 px-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownUp className="h-4 w-4" />
                  <span className="hidden sm:inline">{savingAreasOrder ? 'Saving...' : 'Save Order'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  onSaveChanges();
                  setIsExpanded(false);
                }}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors font-medium text-sm"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </button>

              <button
                onClick={() => {
                  onToggleAnalytics();
                  setIsExpanded(false);
                }}
                className={`flex-shrink-0 h-10 px-4 rounded-full flex items-center gap-2 transition-colors font-medium text-sm ${
                  showAnalytics
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
