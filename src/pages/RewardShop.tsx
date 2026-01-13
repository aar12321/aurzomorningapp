import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Zap, Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getShopItems, purchaseItem, getUserPurchases, ShopItem, ShopItemType } from '@/lib/shop-service';
import { useToast } from '@/hooks/use-toast';

const RewardShop = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ShopItemType | 'all'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('users')
        .select('id, total_xp')
        .eq('auth_id', session.user.id)
        .single();

      if (data) {
        setUserId(data.id);
        setUserXP(data.total_xp || 0);
        
        const shopItems = await getShopItems(activeTab === 'all' ? undefined : activeTab);
        setItems(shopItems);

        const userPurchases = await getUserPurchases(data.id);
        setPurchases(userPurchases.map(p => p.item_id));
      }
    }
    setLoading(false);
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!userId) return;

    const result = await purchaseItem(userId, item.id);
    if (result.success) {
      toast({ title: 'Purchase successful!', description: result.message });
      loadData(); // Reload to update XP and purchases
    } else {
      toast({ title: 'Purchase failed', description: result.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const filteredItems = activeTab === 'all' ? items : items.filter(i => i.item_type === activeTab);

  return (
    <Layout>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Reward Shop</h1>
                <p className="text-muted-foreground">Spend your XP on exclusive items</p>
              </div>
              <Card className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{userXP.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Available XP</div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ShopItemType | 'all')}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="theme">Themes</TabsTrigger>
              <TabsTrigger value="avatar">Avatars</TabsTrigger>
              <TabsTrigger value="powerup">Power-ups</TabsTrigger>
              <TabsTrigger value="badge">Badges</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredItems.length === 0 ? (
                <Card className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No items available</h3>
                  <p className="text-muted-foreground">Check back later for new items!</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const owned = purchases.includes(item.id);
                    const canAfford = userXP >= item.xp_cost;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className={`relative overflow-hidden ${item.is_limited ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-orange-500/5' : ''}`}>
                          {item.is_limited && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded">
                              LIMITED
                            </div>
                          )}
                          {owned && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              OWNED
                            </div>
                          )}
                          <CardHeader>
                            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center text-4xl">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Sparkles className="w-8 h-8 text-primary" />
                              )}
                            </div>
                            <CardTitle className="text-center">{item.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4 text-center">{item.description}</p>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="font-bold">{item.xp_cost.toLocaleString()} XP</span>
                              </div>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => handlePurchase(item)}
                              disabled={owned || !canAfford}
                            >
                              {owned ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Owned
                                </>
                              ) : !canAfford ? (
                                'Not Enough XP'
                              ) : (
                                'Purchase'
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default RewardShop;

