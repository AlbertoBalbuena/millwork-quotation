interface StockBadgeProps {
  stock_quantity: number;
  min_stock_level: number;
}

export function StockBadge({ stock_quantity, min_stock_level }: StockBadgeProps) {
  if (stock_quantity === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        No Stock
      </span>
    );
  }
  if (stock_quantity <= min_stock_level) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      OK
    </span>
  );
}
