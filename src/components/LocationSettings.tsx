import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPreference, savePreference } from "@/lib/user-preferences-service";

interface LocationData {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string; // State/Region
}

export const LocationSettings = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(false);
    const [savedLocation, setSavedLocation] = useState<LocationData | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchUserLocation();
    }, []);

    const fetchUserLocation = async () => {
        try {
            const location = await getPreference('location');
            if (location) {
                setSavedLocation(location);
            }
        } catch (error) {
            console.error("Error fetching location:", error);
        }
    };

    const searchLocation = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
            );
            const data = await response.json();

            if (data.results) {
                setResults(data.results);
            } else {
                setResults([]);
                toast({
                    title: "No results found",
                    description: "Try a different city name.",
                });
            }
        } catch (error) {
            console.error("Error searching location:", error);
            toast({
                title: "Error",
                description: "Failed to search for location. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const saveLocation = async (location: LocationData) => {
        try {
            await savePreference('location', {
                name: location.name,
                latitude: location.latitude,
                longitude: location.longitude,
                country: location.country,
                admin1: location.admin1
            });

            setSavedLocation(location);
            setResults([]);
            setQuery("");

            toast({
                title: "Location Saved! 📍",
                description: `Weather will now be shown for ${location.name}.`,
            });
        } catch (error) {
            console.error("Error saving location:", error);
            toast({ title: "Error", description: "Failed to save location.", variant: "destructive" });
        }
    };

    const clearLocation = async () => {
        try {
            await savePreference('location', undefined);
            localStorage.removeItem("user_location");
            setSavedLocation(null);
            toast({
                title: "Location Removed",
                description: "Weather data will no longer be displayed.",
            });
        } catch (error) {
            console.error("Error clearing location:", error);
            toast({ title: "Error", description: "Failed to remove location.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Weather Location</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Set your location to see the daily forecast.
                </p>

                {savedLocation ? (
                    <Card className="glass-panel mb-6 border-border/50">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-full">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-foreground font-medium">{savedLocation.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {[savedLocation.admin1, savedLocation.country].filter(Boolean).join(", ")}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearLocation}
                                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="glass-panel p-4 mb-6 text-center">
                        <p className="text-sm text-muted-foreground">No location set.</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search city (e.g. London, New York)"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                            className="bg-background/50 border-input"
                        />
                        <Button
                            onClick={searchLocation}
                            disabled={loading || !query.trim()}
                            className="bg-card hover:bg-accent text-foreground"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>

                    {results.length > 0 && (
                        <div className="glass-panel rounded-lg overflow-hidden mt-4">
                            {results.map((location, index) => (
                                <button
                                    key={`${location.latitude}-${location.longitude}-${index}`}
                                    onClick={() => saveLocation(location)}
                                    className="w-full flex items-center justify-between p-3 text-left hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-foreground font-medium">{location.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {[location.admin1, location.country].filter(Boolean).join(", ")}
                                            </p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
