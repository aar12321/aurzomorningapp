-- Add DELETE policy for user_topics to allow users to delete their own topics
CREATE POLICY "Users can delete their own topics" 
ON public.user_topics FOR DELETE 
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

