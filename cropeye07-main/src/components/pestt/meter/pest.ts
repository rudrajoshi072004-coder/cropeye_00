// meter/pest.ts

export interface Pest {
  name: string;
  stage?: string;
  months: string[];
  temperature: string;
  humidity: string;
  image: string;
  symptoms: string[];
  identification: string[];
  where: string;
  why: string;
  when: {
    high: string;
    moderate: string;
    low: string;
  };
  organic: string[];
  chemical: string[];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  pressure_mb: number;
  uv: number;
  visibility_km: number;
  location: string;
}



export type RiskLevel = 'high' | 'moderate' | 'low';

export interface PestRisk {
  pest: Pest;
  riskLevel: RiskLevel;
  riskScore: number;
}
