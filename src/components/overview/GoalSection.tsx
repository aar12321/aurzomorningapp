import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const GoalSection = () => {
  const [goal, setGoal] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        // First get user_id
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();

        if (!userData) {
          setLoading(false);
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('user_goals')
          .select('goal_text')
          .eq('user_id', userData.id)
          .eq('date', today)
          .maybeSingle();

        if (data) {
          setGoal(data.goal_text);
        }
      } catch (err) {
        console.error('Error loading goal:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGoal();
  }, []);

  const saveGoal = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (!userData) return;

      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('user_goals')
        .upsert({
          user_id: userData.id,
          goal_text: goal,
          date: today,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date'
        });

      setIsEditing(false);
      toast({
        title: 'Goal saved',
        description: 'Your daily goal has been updated.',
      });
    } catch (err) {
      console.error('Error saving goal:', err);
      toast({
        title: 'Error',
        description: 'Failed to save goal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center snap-start px-6 py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center snap-start px-4 sm:px-6 py-12 md:py-20">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-8"
          >
            <div className="p-4 bg-primary/10 rounded-full">
              <Target className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Today's Goal
          </h2>
          <p className="text-lg text-muted-foreground">
            What do you want to accomplish today?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 rounded-3xl"
        >
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Enter your goal for today..."
                className="text-lg"
                autoFocus
              />
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // Reload goal from DB
                    window.location.reload();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveGoal} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Goal'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {goal ? (
                <>
                  <p className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                    {goal}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Goal
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg text-muted-foreground mb-6">
                    No goal set for today
                  </p>
                  <Button onClick={() => setIsEditing(true)} className="gap-2">
                    <Target className="w-4 h-4" />
                    Set Your Goal
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

