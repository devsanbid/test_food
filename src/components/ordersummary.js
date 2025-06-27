export default function OrderSummary() {
    const orderItems = [
      { name: "Spicy seasoned seafood noodles", price: 2.29, qty: 2 },
      { name: "Salted pasta with mushroom sauce", price: 2.69, qty: 1 },
      { name: "Spicy instant noodle", price: 3.49, qty: 3 },
      { name: "Healthy noodle with spinach", price: 3.29, qty: 1 },
    ];
  
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  
    return (
      <div className="w-[350px] bg-[#1F1D2B] border-l border-[#393C49] p-6">
        <h3 className="text-lg font-semibold mb-4">Orders #34562</h3>
        <div className="flex gap-2 mb-4">
          {["Dine In", "To Go", "Delivery"].map((type) => (
            <button
              key={type}
              className={`px-4 py-1 rounded-full text-sm ${
                type === "Dine In" ? "bg-[#EA7C69] text-white" : "bg-[#2D303E] text-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
  
        {orderItems.map((item, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span>${(item.qty * item.price).toFixed(2)}</span>
            </div>
            <div className="flex items-center mt-1">
              <input
                type="number"
                defaultValue={item.qty}
                className="w-12 px-2 bg-[#2D303E] text-white rounded mr-2"
              />
              <input
                type="text"
                placeholder="Order Note..."
                className="bg-[#2D303E] text-sm text-gray-300 flex-1 px-2 py-1 rounded"
              />
            </div>
          </div>
        ))}
  
        <div className="mt-6 text-sm text-gray-400">
          <div className="flex justify-between mb-1">
            <span>Discount</span>
            <span>$0</span>
          </div>
          <div className="flex justify-between font-semibold text-white">
            <span>Sub total</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </div>
  
        <button className="mt-6 w-full bg-[#EA7C69] py-2 rounded-lg font-semibold">
          Continue to Payment
        </button>
      </div>
    );
  }
