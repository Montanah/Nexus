import React from 'react';
import { Users, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import StatCard from './StatCard';

const ProductsComponent = ({ products, setProducts, isDarkTheme }) => {
  
  console.log(products);

  return (
    <div className={`space-y-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
        <StatCard 
          title="Total Products" 
          value={products.length} 
          icon={Package} 
          color="bg-gradient-to-r from-indigo-500 to-indigo-600"
          change={7}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="In Stock" 
          value={products.filter(p => p.stock > 0).length} 
          icon={ShoppingCart} 
          color="bg-gradient-to-r from-green-500 to-green-600"
          change={-3}
          isDarkTheme={isDarkTheme}
        />
        <StatCard 
          title="Total Value" 
          value={`$${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}`} 
          icon={BarChart3} 
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          change={22}
          isDarkTheme={isDarkTheme}
        />
      </div>

      <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        {/* Debug: Log to confirm dark theme application */}
        {isDarkTheme}
        <div className={`p-6 border-b ${isDarkTheme ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Products</h2>
          <p className={`text-gray-600 mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Manage your product catalog</p>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 ${isDarkTheme ? 'bg-gray-800 text-white' : 'text-gray-900'}`}>
          {products.map((product) => (
            <div key={product._id} className={`rounded-xl p-4 hover:shadow-md transition-shadow ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{product.productName}</h3>
                <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{product.category}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-gray-600 ${isDarkTheme ? 'text-gray-50' : 'text-gray-600'}`}>Price:</span>
                  <span className={`font-semibold ${isDarkTheme ? 'text-green-300' : 'text-green-600'}`}>KES {product.totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-gray-600 ${isDarkTheme ? 'text-gray-50' : 'text-gray-600'}`}>Stock:</span>
                  <span className={`font-semibold ${product.stock > 10 ? (isDarkTheme ? 'text-green-300' : 'text-green-600') : (isDarkTheme ? 'text-red-300' : 'text-red-600')}`}>
                    {product.stock}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductsComponent;