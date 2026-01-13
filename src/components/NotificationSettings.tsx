import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Smartphone, Loader2, CheckCircle2 } from "lucide-react";

interface NotificationPreferences {
  notification_method: string[];
  notification_preferences: {
    include_news: boolean;
    include_quotes: boolean;
    include_challenge: boolean;
    news_categories: string[];
  };
  whatsapp_number?: string;
}

export const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notification_method: ['email'],
    notification_preferences: {
      include_news: false,
      include_quotes: false,
      include_challenge: false,
      news_categories: ['general']
    }
  });
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences().catch((error) => {
      console.error('Error in loadPreferences:', error);
    });
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: userPref, error } = await supabase
        .from('user_preferences')
        .select('notification_settings, phone_number')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (userPref) {
        // Handle potentially null or legacy structure
        const settings = userPref.notification_settings as any || {};

        setPreferences({
          notification_method: settings.notification_method || ['email'],
          notification_preferences: settings.notification_preferences || {
            include_news: false,
            include_quotes: false,
            include_challenge: false,
            news_categories: ['general']
          }
        });
        setWhatsappNumber(userPref.phone_number || '');
        setWhatsappVerified(!!userPref.phone_number);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationMethod = (method: string) => {
    setPreferences(prev => {
      const methods = prev.notification_method || [];
      const newMethods = methods.includes(method)
        ? methods.filter(m => m !== method)
        : [...methods, method];

      if (newMethods.length === 0) {
        return prev;
      }

      return { ...prev, notification_method: newMethods };
    });
  };

  const togglePreference = (key: keyof typeof preferences.notification_preferences) => {
    setPreferences(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: !prev.notification_preferences[key]
      }
    }));
  };

  const toggleNewsCategory = (category: string) => {
    setPreferences(prev => {
      const categories = prev.notification_preferences.news_categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];

      return {
        ...prev,
        notification_preferences: {
          ...prev.notification_preferences,
          news_categories: newCategories.length > 0 ? newCategories : ['general']
        }
      };
    });
  };

  const handleSaveWhatsApp = async () => {
    if (!whatsappNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    let cleaned = whatsappNumber.replace(/[^0-9+]/g, '');

    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+1' + cleaned;
      }
    }

    const digitsOnly = cleaned.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code (e.g., +1234567890)",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          phone_number: cleaned,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      const wasAlreadyVerified = whatsappVerified;
      setWhatsappVerified(true);
      toast({
        title: wasAlreadyVerified ? "WhatsApp Number Updated! ✅" : "WhatsApp Connected! ✅",
        description: wasAlreadyVerified
          ? "Your WhatsApp number has been updated. You'll continue receiving daily quiz reminders."
          : "Your WhatsApp number has been saved. You'll receive daily quiz reminders via WhatsApp when enabled.",
      });
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
      toast({
        title: "Error",
        description: "Failed to save WhatsApp number",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // We need to preserve other fields if we use upsert, or rely on the fact that existing rows are there from migration.
      // Upsert is safer. We only update notification_settings here.
      // However, upsert might overwrite other fields with null if not provided? 
      // No, Postgres UPDATE only updates specified fields. UPSERT (INSERT ... ON CONFLICT DO UPDATE) also specifies what to update.
      // Supabase .upsert() replaces the whole row if you don't be careful? 
      // Supabase upsert performs a "merge" if you provide the ID? No, it replaces unless you use .update().
      // But we might be creating the row for the first time if migration didn't run for a new user.
      // Best to use upsert with explicit columns? Supabase JS upsert takes the full object.
      // The safest way here is to use .upsert() but we need to make sure we don't wipe out 'location' or 'theme' if we insert a new row 
      // that just so happened to not exist (unlikely given migration, but possible for brand new users).
      // Actually, for new users, they might not have a row.

      // Let's use upsert but we'll need to fetch existing row first if we want to be 100% safe against overwriting other fields with nulls 
      // IF Supabase upsert behaves as a full row replacement.
      // Wait, standard SQL upsert updates only what you tell it to. Supabase client upsert usually tries to insert the object you give it.
      // If the row exists, it updates the columns present in the object. It does NOT nullify missing columns unless you explicitly send null.
      // So this is safe.

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          notification_settings: {
            notification_method: preferences.notification_method,
            notification_preferences: preferences.notification_preferences
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Preferences Saved! ✅",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Notification Methods</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how you want to receive daily quiz reminders
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <Label className="text-foreground cursor-pointer">Email</Label>
                <p className="text-xs text-muted-foreground">
                  {preferences.notification_method.includes('email') 
                    ? 'Receiving reminders via email' 
                    : 'Receive reminders via email'}
                </p>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Switch
                checked={preferences.notification_method.includes('email')}
                onCheckedChange={() => toggleNotificationMethod('email')}
                className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-green-400" />
              <div>
                <Label className="text-foreground cursor-pointer">WhatsApp</Label>
                <p className="text-xs text-muted-foreground">
                  {whatsappVerified 
                    ? (preferences.notification_method.includes('whatsapp') 
                        ? `Connected • ${whatsappNumber}` 
                        : `Connected • Enable to receive reminders`)
                    : 'Connect your WhatsApp number to receive reminders'}
                </p>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Switch
                checked={preferences.notification_method.includes('whatsapp')}
                onCheckedChange={() => {
                  if (!whatsappVerified) {
                    toast({
                      title: "WhatsApp Not Connected",
                      description: "Please connect your WhatsApp number first before enabling notifications.",
                      variant: "destructive",
                    });
                    return;
                  }
                  toggleNotificationMethod('whatsapp');
                }}
                disabled={!whatsappVerified}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600 disabled:opacity-50"
              />
            </div>
          </div>

          {preferences.notification_method.includes('whatsapp') && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-sm text-green-500 dark:text-green-400">
                  {whatsappVerified ? 'Update WhatsApp Number' : 'Connect WhatsApp'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {whatsappVerified
                    ? `Current number: ${whatsappNumber}. Enter a new number to update.`
                    : 'Enter your phone number with country code (e.g., +1234567890)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {whatsappVerified && (
                  <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Currently connected</span>
                  </div>
                )}
                <div>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="bg-background/50 border-input"
                  />
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveWhatsApp();
                  }}
                  disabled={saving}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {whatsappVerified ? 'Update Number' : 'Connect WhatsApp'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Notification Content</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose what to include in your daily notifications
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex-1">
              <Label className="text-foreground cursor-pointer">📰 News from Past 24 Hours</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Get the latest news alongside your quiz reminders
              </p>
              {preferences.notification_preferences.include_news && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {['general', 'sports', 'stocks', 'technology'].map(category => (
                      <div key={category} className="flex items-center gap-2">
                        <Checkbox
                          id={`news-${category}`}
                          checked={preferences.notification_preferences.news_categories.includes(category)}
                          onCheckedChange={() => toggleNewsCategory(category)}
                        />
                        <Label
                          htmlFor={`news-${category}`}
                          className="text-xs text-muted-foreground cursor-pointer capitalize"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Switch
                checked={preferences.notification_preferences.include_news}
                onCheckedChange={() => togglePreference('include_news')}
                className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex-1">
              <Label className="text-foreground cursor-pointer">💭 Motivational Quotes</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Get inspired with daily motivational quotes
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Switch
                checked={preferences.notification_preferences.include_quotes}
                onCheckedChange={() => togglePreference('include_quotes')}
                className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex-1">
              <Label className="text-foreground cursor-pointer">🎯 Daily Challenge</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Get a personalized challenge to complete each day
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <Switch
                checked={preferences.notification_preferences.include_challenge}
                onCheckedChange={() => togglePreference('include_challenge')}
                className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleSavePreferences();
        }}
        disabled={saving}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Preferences
          </>
        )}
      </Button>
    </div>
  );
};

