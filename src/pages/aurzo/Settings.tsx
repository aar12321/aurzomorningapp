import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, Lock, Bell, Shield, Save, Check } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ full_name: fullName });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-bold text-foreground">Account Settings</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="aurzo-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="search-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="search-input opacity-60"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm !py-2.5">
              {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="aurzo-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
              <div>
                <p className="font-medium text-foreground text-sm">Password</p>
                <p className="text-xs text-muted-foreground">Change your account password</p>
              </div>
              <button className="btn-secondary text-xs !py-2 !px-4">Change</button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
              <div>
                <p className="font-medium text-foreground text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="aurzo-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Product updates', desc: 'New features and improvements' },
              { label: 'Weekly digest', desc: 'Summary of your activity across products' },
              { label: 'Community', desc: 'News from the Aurzo community' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-secondary">
                <div>
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions */}
        <div className="aurzo-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Subscription</h2>
          </div>

          <div className="p-4 rounded-xl bg-secondary mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-foreground">Free Plan</p>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">Active</span>
            </div>
            <p className="text-sm text-muted-foreground">Access to all products with basic features.</p>
          </div>

          <button className="btn-primary w-full text-sm !py-2.5">
            Upgrade to Premium — $9.99/mo
          </button>
        </div>

        {/* Danger Zone */}
        <div className="aurzo-card p-6 border-destructive/20">
          <h2 className="text-lg font-bold text-foreground mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">Sign out</p>
              <p className="text-xs text-muted-foreground">Sign out of your Aurzo account on this device</p>
            </div>
            <button onClick={handleSignOut} className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
