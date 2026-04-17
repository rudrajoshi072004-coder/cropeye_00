import React, { useState, useEffect } from "react";
import { AddStock } from "./AddStock"; // Assuming AddStock is in the same folder

interface InventoryItem {
  id?: number;
  itemName: string;
  Make: string;
  itemType:
    | "Logistic"
    | "Transport"
    | "Equipment"
    | "Office Purpose"
    | "Storage"
    | "Processing";
  yearMake: string;
  estimateCost: string;
  status: "Not working" | "Working" | "underRepair";
  remark: string;
}

const ParentComponent: React.FC = () => {
  const [stocks, setStocks] = useState<InventoryItem[]>([]); // State to hold stocks data
  const [showForm, setShowForm] = useState(false); // State to control showing the form

  // Fetch initial stocks from the API (you can modify this if your API supports it)
  useEffect(() => {
    fetch("https://cropeye-backendd.up.railway.app/api/Stocklist")
      .then((response) => response.json())
      .then((data) => setStocks(data))
      .catch((error) => console.error("Error fetching stock data:", error));
  }, []);

  return (
    <div>
      <AddStock
        showForm={showForm}
        setShowForm={setShowForm}
        setStocks={setStocks} // Pass setStocks function down to the AddStock component
      />

      {/* Display the list of stocks */}
      <div>
        <h3>Stocks:</h3>
        <ul>
          {stocks.map((stock) => (
            <li key={stock.id}>
              {stock.itemName} - {stock.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ParentComponent;
