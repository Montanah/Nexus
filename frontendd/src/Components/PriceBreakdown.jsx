const PriceBreakdown = ({ productPrice, setProductPrice, finalCharge }) => (
    <div className="">
      <div>
        <label className="block mb-2 text-blue-600">Product Price</label>
        <input
          type="number"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
          placeholder="Enter price"
          className="w-1/8 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-blue-600">Final Charge</label>
        <input
          value={finalCharge.toFixed(2)}
          disabled
          className="w-1/8 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    </div>
  );
  
  export default PriceBreakdown;