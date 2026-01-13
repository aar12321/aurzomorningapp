import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import { getPreference } from '@/lib/user-preferences-service';

interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
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

export const WeatherSection = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const locationPref = await getPreference('location');
        if (locationPref) {
          setLocation(locationPref);
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem('user_location');
          if (stored) {
            try {
              setLocation(JSON.parse(stored));
            } catch (e) {
              console.error('Failed to parse location', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading location:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('user_location');
        if (stored) {
          try {
            setLocation(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse location', e);
          }
        }
      }
    };
    loadLocation();

    // Listen for location updates
    const handleLocationUpdate = () => loadLocation();
    window.addEventListener('locationUpdated', handleLocationUpdate);
    return () => window.removeEventListener('locationUpdated', handleLocationUpdate);
  }, []);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          current: 'temperature_2m,weather_code,wind_speed_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min',
          timezone: 'auto',
          temperature_unit: 'fahrenheit',
          wind_speed_unit: 'mph',
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch weather');

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
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-8 h-8 text-yellow-400" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-8 h-8 text-gray-400" />;
    if (code >= 45 && code <= 48) return <Wind className="w-8 h-8 text-muted-foreground" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-8 h-8 text-sky-200" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (code >= 85 && code <= 86) return <CloudSnow className="w-8 h-8 text-sky-200" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="w-8 h-8 text-yellow-500" />;
    return <Sun className="w-8 h-8 text-yellow-400" />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return 'Clear sky';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Clear';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <section className="min-h-screen flex items-center justify-center snap-start px-4 sm:px-6 py-12 md:py-20">
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Weather Forecast
          </h2>
        </motion.div>

        {!location ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Set your location in settings to see the weather
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !weather ? (
          <div className="text-center py-20 text-muted-foreground">
            Weather unavailable
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current Weather */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden glass-panel p-8 rounded-3xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                {getWeatherIcon(weather.current.weatherCode)}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase tracking-wider">{location.name}</span>
                </div>
                <div className="flex items-end gap-4 mt-2">
                  <h3 className="text-6xl font-bold text-foreground tracking-tighter">
                    {Math.round(weather.current.temperature)}°
                  </h3>
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
            </motion.div>

            {/* Forecast */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {weather.daily.time.slice(1, 6).map((time, index) => (
                <motion.div
                  key={time}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card/50 border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatDate(time).split(',')[0]}
                  </span>
                  {getWeatherIcon(weather.daily.weatherCode[index + 1])}
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
        )}
      </div>
    </section>
  );
};

