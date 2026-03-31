// SugarcanePrices.tsx
import React, { useEffect, useState } from 'react';

interface SugarcanePrice {
  market: string;
  variety: string;
  grade: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

const SugarcanePrices: React.FC = () => {
  const [prices, setPrices] = useState<SugarcanePrice[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd00000192b7b5617dcf45f95865d31f2f071eb2&format=json&offset=4&limit=4&filters%5Bstate.keyword%5D=Maharastra&filters%5Bdistrict%5D=Nashik&filters%5Bmarket%5D=Nashik&filters%5Bcommodity%5D=sugarcane&filters%5Bvariety%5D=sugarcane&filters%5Bgrade%5D=A'
        );
        const data = await response.json();

        const todayPrices = data.records.filter((record: SugarcanePrice) => record.arrival_date === today);
        setPrices(todayPrices);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [today]);

  if (loading) return <p>Loading today's sugarcane prices...</p>;

  if (prices.length === 0) return <p>No data available for today ({today})</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {prices.map((price, index) => (
        <div key={index} className="bg-white p-4 shadow rounded border">
          <h2 className="text-lg font-bold text-purple-700">{price.market}</h2>
          <p><strong>Variety:</strong> {price.variety} ({price.grade})</p>
          <p><strong>Date:</strong> {price.arrival_date}</p>
          <p><strong>Min Price:</strong> ₹{price.min_price}</p>
          <p><strong>Max Price:</strong> ₹{price.max_price}</p>
          <p><strong>Modal Price:</strong> ₹{price.modal_price}</p>
        </div>
      ))}
    </div>
  );
};

export default SugarcanePrices;
