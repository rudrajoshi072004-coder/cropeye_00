
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Timer, Factory, Satellite, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface CardContent {
  summary: string[];
  details: string[];
}

interface Card {
  title: string;
  icon: React.ReactNode;
  images: string[];
  content: CardContent;
}

interface CardProps extends Card {}

const Card: React.FC<CardProps> = ({ title, icon, content, images }) => {
  const [showMore, setShowMore] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-12 w-full max-w-6xl mx-auto transform transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full text-green-600 shadow-md">
          {icon}
        </div>
        <h2 className="text-4xl font-bold text-gray-800 leading-tight">{title}</h2>
      </div>

      <div className="relative mb-12">
        <div className="overflow-hidden rounded-xl relative shadow-lg">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentImage * 100}%)` }}
          >
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${title} - Image ${index + 1}`}
                className="w-full h-96 object-cover flex-shrink-0 hover:scale-105 transition-transform duration-700"
              />
            ))}
          </div>
          
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        
        <div className="flex justify-center mt-6 gap-3">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentImage === index 
                  ? 'bg-green-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {content.summary.map((paragraph, index) => (
          <p key={index} className="text-gray-700 leading-relaxed text-xl font-medium">
            {formatContent(paragraph)}
          </p>
        ))}

        {showMore && (
          <div className="mt-10 space-y-8 border-t border-gray-200 pt-10">
            {content.details.map((detail, index) => (
              <div key={`detail-${index}`} className="text-gray-700 leading-relaxed text-xl">
                {formatContent(detail)}
              </div>
            ))}
          </div>
        )}

        {content.details.length > 0 && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="mt-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-4 rounded-full font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
          >
            {showMore ? 'View less' : 'View more'}
          </button>
        )}
      </div>
    </div>
  );
};

const BlogCard: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentDataSet, setCurrentDataSet] = useState(0);

  // Initial cards data
  const initialCards: Card[] = [
    {
      title: "Harvest Timing and Its Impact on Sucrose Levels",
      icon: <Timer className="w-8 h-8" />,
      images: [
        "https://i.imgur.com/oFGYdhf.jpeg",
"https://i.imgur.com/F5XhWcX.jpeg",
"https://i.imgur.com/2MKNKkr.jpeg"
      ],
      content: {
        summary: [
          "Sugarcane is a crop where timing plays a major role in maximizing sucrose content and yield. Even after putting in months of effort, improper harvesting timing can lead to significant loss in sugar recovery and reduce factory efficiency.",
          "In India, farmers often either harvest too early due to fear of pest/disease or too late while waiting for market signals. Both decisions can heavily impact the juice quality.",
          "Let us understand how harvest timing influences sucrose levels and overall profit."
        ],
        details: [
          "Why harvest timing matters:\n• Sugarcane accumulates sucrose primarily during the maturity stage.\n• If harvested before maturity, canes are high in moisture but low in sugar.\n• If delayed too much, sucrose levels begin to decline due to flowering, lodging, or pest attacks.",
          "Key indicators that suggest optimal harvesting time:\n1. Brix reading of 18-20% in top internodes.\n2. Canes sound solid when tapped—indicating juice thickening.\n3. No active leaf growth—shows that vegetative phase is over.\n4. Slight yellowing of older leaves—a natural sign of maturity.",
          "Consequences of improper harvesting:\n• Early harvest: Results in low sugar recovery and high processing losses.\n• Late harvest: Canes may dry out, lodge, or get infested, lowering both weight and quality.",
          "Tips to improve harvest timing decisions:\n1. Use field-level sucrose monitoring tools or hand refractometers.\n2. Coordinate with sugar mills for schedule-based harvesting.\n3. Avoid harvesting under moisture stress or immediately after rainfall.\n4. Monitor climatic events and pest alerts that might force early harvest."
        ]
      }
    },
    {
      title: "Challenges Faced by Sugar Factories During Peak Season",
      icon: <Factory className="w-8 h-8" />,
      images: [
        "https://i.imgur.com/238pR4O.jpeg",
"https://i.imgur.com/7VUzSUF.jpeg",
"https://i.imgur.com/uqXodtk.jpeg"
      ],
      content: {
        summary: [
          "During the peak crushing season, sugar factories face several operational challenges that can affect efficiency, sugar recovery, and overall profitability. While the harvest brings in a high volume of cane, handling it without a smart system in place becomes a major bottleneck.",
          "Factories must operate at full capacity for nearly 4–5 months, and any disruption—whether technical, logistical, or labor-related—can result in serious losses."
        ],
        details: [
          "Common challenges sugar factories encounter during peak season:\n1. Irregular Cane Supply:\n• Sudden inflow or gaps in supply from farms create uneven load on machinery.\n• This leads to either idle time or overburdening the mill.",
          "2. Low Sucrose Content in Late Arrivals:\n• Delayed cane arrival due to transport or field delays causes deterioration in quality.\n• Poor-quality cane reduces recovery rate and increases processing cost.",
          "3. Labour Shortages:\n• Increased demand for skilled workers in crushing, boiling, and packing sections.\n• Seasonal migration or strikes can affect operations.",
          "4. Machinery Downtime:\n• Continuous running leads to frequent breakdowns.\n• Maintenance scheduling becomes tough under nonstop crushing pressure.",
          "5. Environmental Compliance:\n• Meeting pollution norms for effluents and emissions becomes critical.\n• Seasonal pressure often leads to shortcuts and penalties.",
          "What can be done:\n• Implement real-time cane tracking systems.\n• Schedule preventive maintenance before the season starts.\n• Establish decentralized procurement points to manage cane flow."
        ]
      }
    },
    {
      title: "The Future of Sugarcane: Satellites, AI, and IoT on the Field",
      icon: <Satellite className="w-8 h-8" />,
      images: [
        "https://i.imgur.com/OUtxNAg.jpeg",
"https://i.imgur.com/ekz1vNS.jpeg",
"https://i.imgur.com/ITlbAkG.jpeg"
      ],
      content: {
        summary: [
          "Sugarcane farming is undergoing a quiet revolution. With the rise of technologies like satellite monitoring, Artificial Intelligence (AI), and the Internet of Things (IoT), farmers are moving beyond traditional practices into a data-driven, precision agriculture era.",
          "These technologies are no longer just experimental—they are being adopted on actual farms to improve yield, save inputs, and make smarter decisions."
        ],
        details: [
          "How Satellites, AI, and IoT Are Transforming Sugarcane Farming:",
          "1. Satellite Monitoring for Field Surveillance\n• High-resolution satellite imagery tracks crop health across large areas.\n• Detects water stress, nutrient deficiency, and pest hotspots early.\n• Weekly or even daily updates allow farmers to monitor every acre from a mobile or laptop.",
          "2. AI-Based Disease and Pest Prediction\n• Machine learning models analyze weather, soil, and remote sensing data to forecast pest/disease outbreaks.\n• Helps farmers take preventive action on time, reducing crop loss and chemical use.",
          "3. IoT Sensors for Soil and Irrigation Monitoring\n• Field sensors measure soil moisture, temperature, and salinity in real time.\n• Data is sent to mobile apps, helping plan precise irrigation schedules.",
          "4. Automated Harvest Scheduling\n• AI recommends optimal harvest time based on sucrose content trends, satellite NDVI, and mill logistics.\n• Ensures timely harvesting and better sugar recovery.",
          "5. Precision Input Management\n• Satellite-based vegetation and moisture indices guide where to apply fertilizers or pesticides.\n• Saves input costs and prevents over-application in healthy zones.",
          "Why It Matters for the Future:\n• Reduces input wastage and supports climate-smart farming.\n• Makes precision agriculture accessible to small and marginal farmers.\n• Supported by government programs, sugar mills, and agri-tech startups through pilot projects and subsidies."
        ]
      }
    }
  ];

  // New cards data (after 1 day)
  const newCards: Card[] = [
    {
      title: "How to Identify and Prevent Red Rot in Sugarcane",
      icon: <AlertTriangle className="w-8 h-8" />,
      images: [
        "https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg",
        "https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg",
        "https://images.pexels.com/photos/1595108/pexels-photo-1595108.jpeg"
      ],
      content: {
        summary: [
          "🚨 Red Rot is one of the most serious diseases affecting sugarcane. If not controlled early, it can cause major yield losses and even affect sugar recovery. Here's what every sugarcane farmer needs to know.",
          "🔍 Red rot is a fungal disease caused by Colletotrichum falcatum. It mostly spreads through infected setts (seed cane) and thrives in waterlogged or poorly drained fields."
        ],
        details: [
          "⚠️ Symptoms to Watch For\nEarly detection is the key. Look out for these signs:\n• Yellowing and drying of the top leaves (starting from the tips).\n• Red discoloration inside the stalk when split lengthwise.\n• Crosswise white patches in between the red parts inside the stalk – a classic symptom.\n• Foul smell from infected stalks.\n• Hollow or brittle stalks with poor juice content.",
          "🛡️ How to Prevent Red Rot\nPrevention is better than cure. Follow these good practices:\n• Use disease-free, certified seed cane.\n• Avoid ratooning infected crops. Don't use setts from diseased fields.\n• Rotate crops. Don't grow sugarcane continuously in the same field.\n• Improve drainage. Red rot spreads faster in waterlogged conditions.\n• Remove and destroy infected plants to prevent spread.\n• Apply fungicides like Carbendazim (0.1%) as a sett treatment or foliar spray if needed.",
          "💡 Bonus Tip:\nChoose resistant varieties suitable for your region. Consult your local agriculture officer or Krishi Vigyan Kendra for recommendations.",
          "📌 Final Thought\nEarly identification and proper field hygiene can save your sugarcane from red rot and improve your yield. Stay alert, and take action at the first sign of trouble!"
        ]
      }
    },
    {
      title: "बीजारोपण हंगाम सुरू होण्यापूर्वी तपासणी यादी",
      icon: <CheckCircle className="w-8 h-8" />,
      images: [
        "https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg",
        "https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg",
        "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg"
      ],
      content: {
        summary: [
          "✅ पिकाची चांगली उत्पन्न घ्यायची असेल, तर सुरुवात मजबूत असावी लागते. त्यामुळे बीजारोपण करण्यापूर्वी काही महत्त्वाच्या गोष्टी तपासणं अत्यावश्यक आहे.",
          "खाली दिलेली यादी तुम्हाला योग्य नियोजन करण्यात मदत करेल."
        ],
        details: [
          "🌱 1. मातीची तपासणी\n• मातीचा प्रकार, pH आणि पोषणतत्त्वांची पातळी जाणून घ्या.\n• त्यानुसार योग्य खतांचे नियोजन करा.",
          "🚜 2. शेतीची तयारी\n• नांगरणी, गवत काढणे आणि सपाटीकरण पूर्ण करा.\n• पाण्याचा निचरा योग्य होईल याची खात्री करा.",
          "🌾 3. बियाण्याची निवड\n• रोगमुक्त, उगमशक्ती असलेली प्रमाणित बियाणं वापरा.\n• आपल्या भागातील हवामान आणि जमिनीनुसार योग्य वाण निवडा.",
          "💧 4. सिंचन व्यवस्था तपासा\n• ठिबक, फवारणी किंवा नाली सिंचन व्यवस्थेची पाहणी करा.\n• पाण्याचा अपव्यय टाळण्यासाठी गळती थांबवा.",
          "🧪 5. बियाण्यांचे प्रक्रिया\n• बुरशीनाशक, कीटकनाशक किंवा जैविक प्रक्रिया करा.\n• बीजप्रक्रियेने रोगप्रतिकारशक्ती वाढते.",
          "🧰 6. खत आणि कीडनाशक साठा\n• लागणारे जैविक/रासायनिक खते, कीडनाशके आधीच विकत घ्या.\n• प्रत्यक्ष लागवडीच्या वेळी वेळ वाचतो.",
          "📌 निष्कर्ष\nबीजारोपणपूर्वी योग्य तयारी केली, तर हंगाम अधिक यशस्वी आणि फायदेशीर ठरतो. ही यादी वापरून तुमच्या शेतीच्या कामांची काटेकोर तयारी करा!"
        ]
      }
    },
    {
      title: "सरकारी सब्सिडी और योजनाओं का लाभ कैसे लें?",
      icon: <DollarSign className="w-8 h-8" />,
      images: [
        "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg",
        "https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg",
        "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg"
      ],
      content: {
        summary: [
          "🏛️ भारत सरकार किसानों की मदद के लिए कई सब्सिडी और योजनाएं चलाती है—जैसे बीज, खाद, मशीनरी, सिंचाई, बीमा और कृषि विपणन से जुड़ी।",
          "लेकिन कई किसान इनका लाभ नहीं ले पाते क्योंकि उन्हें प्रक्रिया की पूरी जानकारी नहीं होती। इस लेख में हम आसान भाषा में समझेंगे कि आप इन योजनाओं का लाभ कैसे ले सकते हैं।"
        ],
        details: [
          "🔍 1. सबसे पहले योजना की जानकारी प्राप्त करें\n• कृषि विभाग की वेबसाइट (जैसे agricoop.nic.in, pmkisan.gov.in) पर योजना की जानकारी पढ़ें।\n• नजदीकी कृषि अधिकारी या कृषि विज्ञान केंद्र (KVK) से संपर्क करें।\n• मोबाइल ऐप्स (जैसे Kisan Suvidha, PM-Kisan, IFFCO Kisan) से भी जानकारी मिलती है।",
          "📋 2. आवश्यक दस्तावेज तैयार रखें\nज्यादातर योजनाओं में ये दस्तावेज लगते हैं:\n• आधार कार्ड\n• भूमि दस्तावेज (खतौनी, 7/12, पट्टा)\n• बैंक खाता विवरण\n• पासपोर्ट साइज फोटो\n• मोबाइल नंबर (OTP के लिए)",
          "🧾 3. ऑनलाइन या ऑफलाइन आवेदन करें\n• कई योजनाएं ऑनलाइन पोर्टल पर उपलब्ध हैं। जैसे:\n  - pmkisan.gov.in\n  - agrimachinery.nic.in\n  - राज्य सरकार की कृषि विभाग साइट\n• अन्य योजनाओं के लिए आपको कृषि कार्यालय या CSC केंद्र (जन सेवा केंद्र) जाना होगा।",
          "💸 4. लाभ मिलने के बाद स्थिति जांचें\n• आवेदन के बाद नियमित रूप से स्टेटस चेक करें।\n• अगर कोई दस्तावेज अधूरा हो तो उसे समय पर अपडेट करें।\n• बैंक खाते में राशि आने की जानकारी SMS से मिलती है।",
          "📌 जरूरी सुझाव:\n• फॉर्म भरते समय सही जानकारी भरें।\n• दलालों से सावधान रहें – सभी सेवाएं सरकारी हैं और निःशुल्क होती हैं।\n• किसी भी योजना का लाभ लेने से पहले उसकी शर्तें और पात्रता ज़रूर पढ़ें।",
          "🌾 निष्कर्ष:\nसरकारी योजनाएं किसानों के लिए बहुत उपयोगी होती हैं, लेकिन जागरूकता और समय पर आवेदन ज़रूरी है। सही जानकारी और तैयारी से आप इन योजनाओं का पूरा लाभ उठा सकते हैं।"
        ]
      }
    }
  ];

  const allDataSets = [initialCards, newCards];
  const currentCards = allDataSets[currentDataSet];

  // Check if 1 day has passed and switch content
  useEffect(() => {
    const checkDate = () => {
      const startDate = localStorage.getItem('blogStartDate');
      const now = new Date().getTime();
      
      if (!startDate) {
        localStorage.setItem('blogStartDate', now.toString());
        return;
      }
      
      const daysPassed = Math.floor((now - parseInt(startDate)) / (1000 * 60 * 60 * 24));
      
      if (daysPassed >= 1 && currentDataSet === 0) {
        setCurrentDataSet(1);
        setCurrentSlide(0);
      }
    };

    checkDate();
    const interval = setInterval(checkDate, 1000 * 60 * 60); // Check every hour
    
    return () => clearInterval(interval);
  }, [currentDataSet]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % currentCards.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + currentCards.length) % currentCards.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 px-6">
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-8">
            Sugarcane Harvest Insights
          </h1>
          <p className="text-gray-600 max-w-5xl mx-auto text-2xl leading-relaxed">
            Explore the critical relationship between harvest timing and sucrose levels in sugarcane production
          </p>
        </div>

        <div className="relative">
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 bg-white p-5 rounded-full shadow-xl z-10 hover:bg-gray-50 hover:scale-110 transition-all duration-300"
          >
            <ChevronLeft className="w-8 h-8 text-gray-700" />
          </button>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {currentCards.map((card, index) => (
                <div key={`${currentDataSet}-${index}`} className="w-full flex-shrink-0 px-6">
                  <Card {...card} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 bg-white p-5 rounded-full shadow-xl z-10 hover:bg-gray-50 hover:scale-110 transition-all duration-300"
          >
            <ChevronRight className="w-8 h-8 text-gray-700" />
          </button>
        </div>

        <div className="flex justify-center mt-16 gap-5">
          {currentCards.map((_, index) => (
            <button
              key={index}
              className={`w-5 h-5 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'bg-green-600 scale-125 shadow-lg' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogCard;