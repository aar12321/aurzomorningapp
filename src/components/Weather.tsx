import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { getPreference } from "@/lib/user-preferences-service";

interface WeatherData {
    current: {
        temperature: number;
        weatherCode: number;
        windSpeed: number;
        humidity?: number; // Open-Meteo basic free tier might not give humidity in 'current' easily without extra params, let's stick to basics or add it
    };
    daily: {
        time: string[];
        weatherCode: number[];
        maxTemp: number[];
        minTemp: number[];
    };
}

interface LocationData {
    name: string;
    latitude: number;
    longitude: number;
}

export const Weather = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLocation = async () => {
        try {
            const locationPref = await getPreference('location');
            if (locationPref) {
                setLocation(locationPref);
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem("user_location");
                if (stored) {
                    try {
                        setLocation(JSON.parse(stored));
                    } catch (e) {
                        console.error("Failed to parse location", e);
                        setLocation(null);
                    }
                } else {
                    setLocation(null);
                }
            }
        } catch (error) {
            console.error("Error loading location:", error);
            // Fallback to localStorage
            const stored = localStorage.getItem("user_location");
            if (stored) {
                try {
                    setLocation(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse location", e);
                    setLocation(null);
                }
            } else {
                setLocation(null);
            }
        }
    };

    useEffect(() => {
        loadLocation();

        // Listen for location updates from settings
        const handleLocationUpdate = () => loadLocation();
        window.addEventListener("locationUpdated", handleLocationUpdate);
        return () => window.removeEventListener("locationUpdated", handleLocationUpdate);
    }, []);

    useEffect(() => {
        if (!location) {
            setLoading(false);
            return;
        }

        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    latitude: location.latitude.toString(),
                    longitude: location.longitude.toString(),
                    current: "temperature_2m,weather_code,wind_speed_10m",
                    daily: "weather_code,temperature_2m_max,temperature_2m_min",
                    timezone: "auto",
                    temperature_unit: "fahrenheit",
                    wind_speed_unit: "mph",
                });

                const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
                if (!response.ok) throw new Error("Failed to fetch weather data");

                const data = await response.json();

                setWeather({
                    current: {
                        temperature: data.current.temperature_2m,
                        weatherCode: data.current.weather_code,
                        windSpeed: data.current.wind_speed_10m,
                    },
                    daily: {
                        time: data.daily.time,
                        weatherCode: data.daily.weather_code,
                        maxTemp: data.daily.temperature_2m_max,
                        minTemp: data.daily.temperature_2m_min,
                    },
                });
            } catch (err) {
                console.error("Weather fetch error:", err);
                setError("Could not load weather data.");
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location]);

    const getWeatherIcon = (code: number, className = "w-6 h-6") => {
        // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
        if (code === 0) return <Sun className={`${className} text-yellow-400`} />;
        if (code >= 1 && code <= 3) return <Cloud className={`${className} text-gray-400`} />;
        if (code >= 45 && code <= 48) return <Wind className={`${className} text-muted-foreground`} />;
        if (code >= 51 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
        if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-sky-200`} />;
        if (code >= 80 && code <= 82) return <CloudRain className={`${className} text-blue-500`} />;
        if (code >= 85 && code <= 86) return <CloudSnow className={`${className} text-sky-200`} />;
        if (code >= 95 && code <= 99) return <CloudLightning className={`${className} text-yellow-500`} />;
        return <Sun className={`${className} text-yellow-400`} />;
    };

    const getWeatherDescription = (code: number) => {
        if (code === 0) return "Clear sky";
        if (code === 1) return "Mainly clear";
        if (code === 2) return "Partly cloudy";
        if (code === 3) return "Overcast";
        if (code >= 45 && code <= 48) return "Fog";
        if (code >= 51 && code <= 55) return "Drizzle";
        if (code >= 56 && code <= 57) return "Freezing Drizzle";
        if (code >= 61 && code <= 65) return "Rain";
        if (code >= 66 && code <= 67) return "Freezing Rain";
        if (code >= 71 && code <= 77) return "Snow";
        if (code >= 80 && code <= 82) return "Rain Showers";
        if (code >= 85 && code <= 86) return "Snow Showers";
        if (code >= 95 && code <= 99) return "Thunderstorm";
        return "Clear";
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    };

    if (!location) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="p-4 bg-muted/50 rounded-full">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">No Location Set</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                        Please set your location in settings to see the weather forecast.
                    </p>
                </div>
                {/* We can't easily open the settings modal from here without passing props or context. 
            For now, just a message. User knows where settings are. 
        */}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !weather) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <CloudRain className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground">{error || "Weather unavailable"}</p>
                <Button variant="outline" onClick={() => window.location.reload()} className="border-border text-foreground hover:bg-accent">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Current Weather */}
            <div className="relative overflow-hidden glass-panel p-8">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    {getWeatherIcon(weather.current.weatherCode, "w-32 h-32")}
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">{location.name}</span>
                    </div>

                    <div className="flex items-end gap-4 mt-2">
                        <h2 className="text-6xl font-bold text-foreground tracking-tighter">
                            {Math.round(weather.current.temperature)}°
                        </h2>
                        <div className="pb-2 space-y-1">
                            <p className="text-xl font-medium text-foreground">
                                {getWeatherDescription(weather.current.weatherCode)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Wind className="w-4 h-4" />
                                <span>{weather.current.windSpeed} mph</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecast */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {weather.daily.time.slice(1, 6).map((time, index) => (
                    <motion.div
                        key={time}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center hover:bg-accent transition-colors"
                    >
                        <span className="text-sm font-medium text-muted-foreground">
                            {formatDate(time).split(',')[0]} {/* Just weekday */}
                        </span>
                        {getWeatherIcon(weather.daily.weatherCode[index + 1], "w-8 h-8")}
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">
                                {Math.round(weather.daily.maxTemp[index + 1])}°
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {Math.round(weather.daily.minTemp[index + 1])}°
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
