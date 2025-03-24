const PriceBreakdown = ({ productPrice, setProductPrice, finalCharge }) => (
  <div className="flex flex-col gap-4">
    <div className="w-full">
      <label className="block mb-2 text-blue-600 text-sm sm:text-base">
        Product Price
      </label>
      <input
        type="number"
        value={productPrice}
        onChange={(e) => setProductPrice(e.target.value)}
        placeholder="Enter price"
        className="w-full md:w-32 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        required
      />
    </div>
    <div className="w-full">
      <label className="block mb-2 text-blue-600 text-sm sm:text-base">
        Final Charge
      </label>
      <input
        value={typeof finalCharge === 'number' && !isNaN(finalCharge) ? finalCharge.toFixed(2) : '0.00'}
        disabled
        className="w-full md:w-32 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-gray-100"
      />
    </div>
  </div>
);

export default PriceBreakdown;