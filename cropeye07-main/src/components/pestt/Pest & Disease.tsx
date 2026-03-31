import React, { useState, useEffect, useMemo } from "react";
import { SingleCategoryRiskMeter } from "./meter/SingleCategoryRiskMeter";
import { ImageModal } from "./meter/ImageModal";
import { pestsData } from "./meter/pestsData";
import { diseasesData } from "./meter/diseasesData";
import { weedsData } from "./meter/Weeds";
import { DetectionCard } from "./meter/PestCard";
import {
  generateRiskAssessment,
  fetchPlantationDate,
  fetchCurrentWeather,
  fetchPestDetectionData,
  RiskAssessmentResult,
  WeatherData,
  PestDetectionData,
} from "./meter/riskAssessmentService";
import { useAppContext } from "../../context/AppContext";
import { useFarmerProfile } from "../../hooks/useFarmerProfile";
import {
  getCurrentMonthLower,
  categorizeWeedsBySeason,
} from "./meter/weedRiskUtils";

export const PestDisease: React.FC = () => {
  const { selectedPlotName, setSelectedPlotName } = useAppContext();
  const { profile, loading: profileLoading } = useFarmerProfile();
  const [riskAssessment, setRiskAssessment] =
    useState<RiskAssessmentResult | null>(null);
  const [pestDetectionData, setPestDetectionData] =
    useState<PestDetectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    "Pests" | "Diseases" | "Weeds" | null
  >(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<
    "High" | "Moderate" | "Low" | null
  >(null);

  const [chemModal, setChemModal] = useState<{
    open: boolean;
    title: string;
    chemicals: string[];
  }>({ open: false, title: "", chemicals: [] });

  useEffect(() => {
    loadRiskAssessment();
  }, [selectedPlotName]);

  const loadRiskAssessment = async () => {
    try {
      setIsLoading(true);

      // Fetch plantation date and weather data
      const plantationDate = await fetchPlantationDate(
        selectedPlotName || undefined,
      );
      const weatherData = await fetchCurrentWeather(
        selectedPlotName || undefined,
      );

      // Fetch pest detection data once (will be used by both generateRiskAssessment and component state)
      // This prevents duplicate API calls
      const pestData = await fetchPestDetectionData(
        selectedPlotName || undefined,
      );

      // Generate risk assessment with plotId (pass pestData to avoid duplicate fetch)
      const assessment = await generateRiskAssessment(
        plantationDate,
        weatherData,
        selectedPlotName || undefined,
        pestData // Pass the already-fetched data
      );

      // Assessment already has correct logic: only HIGH if API percentage > 0 AND stage matches AND month matches
      setRiskAssessment(assessment);
      setPestDetectionData(pestData);

      // Auto-select "High" risk level if there are High risk pests or diseases detected
      if (
        assessment.pests.High.length > 0 ||
        assessment.diseases.High.length > 0
      ) {
        setSelectedCategory(
          assessment.pests.High.length > 0 ? "Pests" : "Diseases",
        );
        setSelectedRiskLevel("High");
        console.log(
          "✅ Auto-selected High risk level. Pests:",
          assessment.pests.High.length,
          "Diseases:",
          assessment.diseases.High.length,
        );
      }
    } catch (error) {
      console.error("Failed to load risk assessment:", error);
      // Set a default empty assessment to prevent infinite loading
      setRiskAssessment({
        stage: "Unknown",
        current_conditions: {
          month: "Unknown",
          temperature: "N/A",
          humidity: "N/A"
        },
        pests: {
          High: [],
          Moderate: [],
          Low: []
        },
        diseases: {
          High: [],
          Moderate: [],
          Low: []
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: modifyAssessmentWithAPIData is no longer needed since the risk assessment
  // already includes API data, stage, and month matching in generateRiskAssessment.
  // This function is kept for backward compatibility but should not override the logic.
  const modifyAssessmentWithAPIData = (
    assessment: RiskAssessmentResult,
    pestData: PestDetectionData,
  ): RiskAssessmentResult => {
    // The assessment from generateRiskAssessment already has the correct logic:
    // - Only shows HIGH if API percentage > 0 AND stage matches AND month matches
    // - No need to modify it further
    return assessment;
  };

  const getRiskCounts = () => {
    if (!riskAssessment)
      return {
        counts: { high: 0, moderate: 0, low: 0 },
        pestsByRisk: { high: [], moderate: [], low: [] },
      };

    const counts = {
      high: riskAssessment.pests.High.length,
      moderate: riskAssessment.pests.Moderate.length,
      low: riskAssessment.pests.Low.length,
    };

    const pestsByRisk = {
      high: riskAssessment.pests.High,
      moderate: riskAssessment.pests.Moderate,
      low: riskAssessment.pests.Low,
    };

    return { counts, pestsByRisk };
  };

  const getDiseaseRiskTags = () => {
    if (!riskAssessment) return { high: [], moderate: [], low: [] };

    // Fungal diseases that should show fungi percentage
    const fungalDiseaseNames = [
      "Red Rot",
      "Rust",
      "Smut",
      "Wilt",
      "Downy Mildew",
    ];

    const diseasesByRisk = {
      high: riskAssessment.diseases.High.map((name) => {
        const disease = diseasesData.find((d) => d.name === name);
        const isFungal = fungalDiseaseNames.includes(name);
        return {
          name: disease?.name || name,
          image: disease?.image || "/Image/wilt.png",
          months: disease?.months || [],
          fungiPercentage:
            isFungal && pestDetectionData
              ? pestDetectionData.fungi_affected_pixel_percentage
              : undefined,
        };
      }),
      moderate: riskAssessment.diseases.Moderate.map((name) => {
        const disease = diseasesData.find((d) => d.name === name);
        const isFungal = fungalDiseaseNames.includes(name);
        return {
          name: disease?.name || name,
          image: disease?.image || "/Image/wilt.png",
          months: disease?.months || [],
          fungiPercentage:
            isFungal && pestDetectionData
              ? pestDetectionData.fungi_affected_pixel_percentage
              : undefined,
        };
      }),
      low: riskAssessment.diseases.Low.map((name) => {
        const disease = diseasesData.find((d) => d.name === name);
        const isFungal = fungalDiseaseNames.includes(name);
        return {
          name: disease?.name || name,
          image: disease?.image || "/Image/wilt.png",
          months: disease?.months || [],
          fungiPercentage:
            isFungal && pestDetectionData
              ? pestDetectionData.fungi_affected_pixel_percentage
              : undefined,
        };
      }),
    };

    return diseasesByRisk;
  };

  const handleImageClick = (imageUrl: string, pestName: string) => {
    setSelectedImage({ url: imageUrl, name: pestName });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const { counts, pestsByRisk } = getRiskCounts();
  const diseasesByRisk = getDiseaseRiskTags();

  // Calculate actual detected counts (pests and diseases that have any risk level)
  const totalPestsDetected = riskAssessment
    ? riskAssessment.pests.High.length +
      riskAssessment.pests.Moderate.length +
      riskAssessment.pests.Low.length
    : 0;

  const totalDiseasesDetected = riskAssessment
    ? riskAssessment.diseases.High.length +
      riskAssessment.diseases.Moderate.length +
      riskAssessment.diseases.Low.length
    : 0;

  // Categorize weeds by current month
  const currentMonthLower = useMemo(getCurrentMonthLower, []);
  const weedRiskBuckets = useMemo(
    () => categorizeWeedsBySeason(weedsData, currentMonthLower),
    [currentMonthLower],
  );

  const handleRiskClick = (
    category: "Pests" | "Diseases" | "Weeds",
    level: "High" | "Moderate" | "Low",
  ) => {
    // If clicking the same category and level, deselect
    if (selectedCategory === category && selectedRiskLevel === level) {
      setSelectedCategory(null);
      setSelectedRiskLevel(null);
    } else {
      setSelectedCategory(category);
      setSelectedRiskLevel(level);
    }
  };

  const displayedPests = selectedRiskLevel
    ? pestsByRisk[
        selectedRiskLevel.toLowerCase() as "high" | "moderate" | "low"
      ]
        .map((name: string) => {
          return pestsData.find((p) => p.name === name);
        })
        .filter(Boolean)
    : [];

  const displayedDiseases = selectedRiskLevel
    ? diseasesByRisk[
        selectedRiskLevel.toLowerCase() as "high" | "moderate" | "low"
      ]
        .map((diseaseInfo: any) => {
          const disease = diseasesData.find((d) => d.name === diseaseInfo.name);
          if (disease && diseaseInfo.fungiPercentage !== undefined) {
            return { ...disease, fungiPercentage: diseaseInfo.fungiPercentage };
          }
          return disease;
        })
        .filter(Boolean)
    : [];

  if (!riskAssessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading risk assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Plot Selector - Top Left */}
        {profile && !profileLoading && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="font-semibold text-gray-700">
                Select Plot:
              </label>
              <select
                value={selectedPlotName || ""}
                onChange={(e) => {
                  setSelectedPlotName(e.target.value);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {profile.plots?.map((plot) => {
                  let displayName = "";

                  if (
                    plot.gat_number &&
                    plot.plot_number &&
                    plot.gat_number.trim() !== "" &&
                    plot.plot_number.trim() !== "" &&
                    !plot.gat_number.startsWith("GAT_") &&
                    !plot.plot_number.startsWith("PLOT_")
                  ) {
                    displayName = `${plot.gat_number}_${plot.plot_number}`;
                  } else if (
                    plot.gat_number &&
                    plot.gat_number.trim() !== "" &&
                    !plot.gat_number.startsWith("GAT_")
                  ) {
                    displayName = plot.gat_number;
                  } else if (
                    plot.plot_number &&
                    plot.plot_number.trim() !== "" &&
                    !plot.plot_number.startsWith("PLOT_")
                  ) {
                    displayName = plot.plot_number;
                  } else {
                    const village = plot.address?.village;
                    const taluka = plot.address?.taluka;

                    if (village) {
                      displayName = `Plot in ${village}`;
                      if (taluka) displayName += `, ${taluka}`;
                    } else {
                      displayName = "Plot (No GAT/Plot Number)";
                    }
                  }

                  return (
                    <option
                      key={plot.fastapi_plot_id}
                      value={plot.fastapi_plot_id}
                    >
                      {displayName}
                    </option>
                  );
                }) || []}
              </select>
            </div>
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 text-center mb-4 sm:mb-6 px-2">
            Risk Assessment
          </h2>

          {/* Three Separate Risk Meters - One for each category */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Pests Risk Meter */}
            <SingleCategoryRiskMeter
              category="Pests"
              highCount={counts.high}
              moderateCount={counts.moderate}
              lowCount={counts.low}
              // icon="??"
              onRiskClick={handleRiskClick}
              selectedCategory={selectedCategory}
              selectedRiskLevel={selectedRiskLevel}
            />

            {/* Diseases Risk Meter */}
            <SingleCategoryRiskMeter
              category="Diseases"
              highCount={riskAssessment?.diseases.High.length || 0}
              moderateCount={riskAssessment?.diseases.Moderate.length || 0}
              lowCount={riskAssessment?.diseases.Low.length || 0}
              // icon="??"
              onRiskClick={handleRiskClick}
              selectedCategory={selectedCategory}
              selectedRiskLevel={selectedRiskLevel}
            />

            {/* Weeds Risk Meter */}
            <SingleCategoryRiskMeter
              category="Weeds"
              highCount={weedRiskBuckets.high.length}
              moderateCount={weedRiskBuckets.moderate.length}
              lowCount={weedRiskBuckets.low.length}
              // icon="??"
              onRiskClick={handleRiskClick}
              selectedCategory={selectedCategory}
              selectedRiskLevel={selectedRiskLevel}
            />
          </div>
        </div>

        {/* Conditionally Render Based on Selected Category and Risk Level */}
        {selectedCategory === "Pests" && selectedRiskLevel && (
          <div className="mb-6 sm:mb-10 px-2 sm:px-0">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 capitalize mb-3 sm:mb-4 text-center">
              {selectedRiskLevel} Risk Pests ({displayedPests.length})
            </h3>

            {displayedPests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-start">
                {displayedPests.map((pest: any, index: number) => {
                  const cardKey = `pest-${pest.name}-${index}`;
                  return (
                    <DetectionCard
                      key={cardKey}
                      type="pest"
                      data={pest}
                      riskLevel={
                        selectedRiskLevel?.toLowerCase() as
                          | "high"
                          | "moderate"
                          | "low"
                      }
                      onImageClick={handleImageClick}
                      isExpanded={true}
                      onExpand={() => {}}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 font-medium">
                No pest detected
              </p>
            )}
          </div>
        )}

        {/* Disease Cards */}
        {selectedCategory === "Diseases" && selectedRiskLevel && (
          <div className="mb-6 sm:mb-10 px-2 sm:px-0">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 capitalize mb-3 sm:mb-4 text-center">
              {selectedRiskLevel} Risk Diseases ({displayedDiseases.length})
            </h3>
            {displayedDiseases.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-start">
                {displayedDiseases.map((disease: any, index: number) => {
                  const cardKey = `disease-${disease.name}-${index}`;
                  return (
                    <DetectionCard
                      key={cardKey}
                      type="disease"
                      data={disease}
                      riskLevel={
                        selectedRiskLevel?.toLowerCase() as
                          | "high"
                          | "moderate"
                          | "low"
                      }
                      onImageClick={handleImageClick}
                      isExpanded={true}
                      onExpand={() => {}}
                      fungiPercentage={disease.fungiPercentage}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 font-medium">
                No disease detected
              </p>
            )}
          </div>
        )}

        {/* Weeds Cards */}
        {selectedCategory === "Weeds" && selectedRiskLevel && (
          <div className="mb-6 sm:mb-10 px-2 sm:px-0">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 capitalize mb-3 sm:mb-4 text-center">
              {selectedRiskLevel} Risk Weeds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {(() => {
                // Filter weeds based on selected risk level using month-based categorization
                const filteredWeeds =
                  selectedRiskLevel === "High"
                    ? weedRiskBuckets.high
                    : selectedRiskLevel === "Moderate"
                      ? weedRiskBuckets.moderate
                      : weedRiskBuckets.low;

                return filteredWeeds.map((weed, index) => (
                  <div
                    key={index}
                    className="bg-[#fbf3ea] rounded-lg sm:rounded-xl p-4 sm:p-6 shadow border border-orange-200"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                        Possible Weed : {weed.name}
                        </h4>
                        <div className="text-sm text-gray-800 mb-2">
                          <span className="font-semibold text-black">
                            Active Months:
                          </span>{" "}
                          {Array.isArray(weed.months)
                            ? weed.months.join(", ")
                            : ""}
                        </div>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc ml-5">
                          {weed.when && (
                            <li>
                              <span className="font-semibold">When:</span>{" "}
                              {weed.when}
                            </li>
                          )}
                          {weed.where && (
                            <li>
                              <span className="font-semibold">Where:</span>{" "}
                              {weed.where}
                            </li>
                          )}
                          {weed.why && (
                            <li>
                              <span className="font-semibold">Why:</span>{" "}
                              {weed.why}
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="w-full mt-3">
                        <img
                          src={weed.image}
                          alt={weed.name}
                          className="w-full h-48 object-cover rounded cursor-pointer border border-orange-200"
                          onClick={() =>
                            handleImageClick(weed.image, weed.name)
                          }
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <button
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-sm"
                          onClick={() =>
                            setChemModal({
                              open: true,
                              title: weed.name,
                              chemicals: Array.isArray(weed.chemical)
                                ? weed.chemical
                                : [],
                            })
                          }
                        >
                          ACTION
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <ImageModal
          isOpen={!!selectedImage}
          imageUrl={selectedImage?.url || ""}
          pestName={selectedImage?.name || ""}
          onClose={closeImageModal}
        />

        {chemModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-11/12 max-w-md shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-gray-800">
                  Chemical Recommendations
                </h4>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() =>
                    setChemModal({ open: false, title: "", chemicals: [] })
                  }
                ></button>
              </div>
              <div className="text-sm text-gray-700 mb-2 font-semibold">
                {chemModal.title}
              </div>
              <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
                {chemModal.chemicals.length ? (
                  chemModal.chemicals.map((c, i) => <li key={i}>{c}</li>)
                ) : (
                  <li>No data</li>
                )}
              </ul>
              <div className="text-right mt-4">
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  onClick={() =>
                    setChemModal({ open: false, title: "", chemicals: [] })
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
