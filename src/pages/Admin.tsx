import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Users, 
  BookOpen, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  ArrowLeft,
  Eye,
  TrendingUp,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuizCreator } from "@/components/ui/quiz-creator";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Topic {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  topic_id: string;
  day_number: number;
  questions: Question[];
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Topic management state
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState({
    name: "",
    category: "",
    description: ""
  });
  
  // Quiz creation state
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [selectedTopicForQuiz, setSelectedTopicForQuiz] = useState<string>("");
  const [selectedDayForQuiz, setSelectedDayForQuiz] = useState<number>(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }

      // Check if user is admin
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("auth_id", session.user.id)
        .single();

      if (!userData?.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/overview");
        return;
      }

      await fetchData();
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch topics
      const { data: topicsData } = await supabase
        .from("topics")
        .select("*")
        .order("name");

      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch quizzes with questions
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select(`
          id,
          topic_id,
          day_number,
          topics (name)
        `)
        .order("day_number");

      setTopics(topicsData || []);
      setUsers(usersData || []);
      setQuizzes(quizzesData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Topic CRUD functions
  const handleCreateTopic = async () => {
    try {
      const { error } = await supabase
        .from("topics")
        .insert([topicForm]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic created successfully",
      });

      setIsTopicDialogOpen(false);
      setTopicForm({ name: "", category: "", description: "" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditTopic = async () => {
    if (!editingTopic) return;

    try {
      const { error } = await supabase
        .from("topics")
        .update(topicForm)
        .eq("id", editingTopic.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic updated successfully",
      });

      setIsTopicDialogOpen(false);
      setEditingTopic(null);
      setTopicForm({ name: "", category: "", description: "" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic? This will also delete all associated quizzes and questions.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("topics")
        .delete()
        .eq("id", topicId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openTopicDialog = (topic?: Topic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        name: topic.name,
        category: topic.category,
        description: topic.description || ""
      });
    } else {
      setEditingTopic(null);
      setTopicForm({ name: "", category: "", description: "" });
    }
    setIsTopicDialogOpen(true);
  };

  const startQuizCreation = (topicId: string, dayNumber: number) => {
    setSelectedTopicForQuiz(topicId);
    setSelectedDayForQuiz(dayNumber);
    setIsCreatingQuiz(true);
  };

  const handleQuizCreationComplete = () => {
    setIsCreatingQuiz(false);
    setSelectedTopicForQuiz("");
    setSelectedDayForQuiz(1);
    fetchData(); // Refresh data
  };

  if (isCreatingQuiz) {
    return (
      <QuizCreator
        topicId={selectedTopicForQuiz}
        dayNumber={selectedDayForQuiz}
        onComplete={handleQuizCreationComplete}
        onCancel={() => setIsCreatingQuiz(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-calm flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-calm">
      <header className="border-b border-border bg-gradient-card backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-sunrise bg-clip-text text-transparent">
              Admin Console
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/overview")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-card backdrop-blur-sm border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-sm border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{topics.length}</div>
                  <p className="text-xs text-muted-foreground">Available topics</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-sm border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quizzes.length}</div>
                  <p className="text-xs text-muted-foreground">Total quizzes</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card backdrop-blur-sm border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12%</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Topics Management</h2>
              <Button onClick={() => openTopicDialog()} className="bg-gradient-sunrise text-white border-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Topic
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-card backdrop-blur-sm border-2 hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <Badge variant="secondary">{topic.category}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {topic.description || "No description available"}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openTopicDialog(topic)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startQuizCreation(topic.id, 1)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Quiz
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTopic(topic.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Card className="bg-gradient-card backdrop-blur-sm border-2">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">XP</th>
                        <th className="text-left p-4 font-medium">Streak</th>
                        <th className="text-left p-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/50">
                          <td className="p-4">{user.full_name}</td>
                          <td className="p-4">{user.email}</td>
                          <td className="p-4">{user.total_xp || 0}</td>
                          <td className="p-4">{user.streak_count || 0}</td>
                          <td className="p-4">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <h2 className="text-2xl font-bold">Content Overview</h2>
            <Card className="bg-gradient-card backdrop-blur-sm border-2">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-medium">Topic</th>
                        <th className="text-left p-4 font-medium">Day</th>
                        <th className="text-left p-4 font-medium">Questions</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.map((quiz) => (
                        <tr key={quiz.id} className="border-b border-border/50">
                          <td className="p-4">{quiz.topics?.name}</td>
                          <td className="p-4">Day {quiz.day_number}</td>
                          <td className="p-4">{quiz.questions?.length || 0}</td>
                          <td className="p-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? 'Edit Topic' : 'Create New Topic'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) => setTopicForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Advanced Calculus"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="topic-category">Category</Label>
              <Select
                value={topicForm.category}
                onValueChange={(value) => setTopicForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Adult Learning">Adult Learning</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Personal Development">Personal Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="topic-description">Description</Label>
              <Textarea
                id="topic-description"
                value={topicForm.description}
                onChange={(e) => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this topic covers..."
                className="mt-2 min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={editingTopic ? handleEditTopic : handleCreateTopic}
                className="bg-gradient-sunrise text-white border-0"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTopic ? 'Update Topic' : 'Create Topic'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;