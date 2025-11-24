import React, { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/components/utils/helpers";
import {
  MessageSquare,
  TrendingUp,
  Clock,
  ThumbsUp,
  User,
  Plus,
  Pin,
  Eye,
  EyeOff,
  MessageCircle,
  ArrowUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageLoadingSkeleton } from "../components/ui/loading-skeleton";
import { useCustomDialog } from "../components/ui/custom-dialog";
import CreateFeedbackPost from "../components/feedback/CreateFeedbackPost";
import FeedbackPostCard from "../components/feedback/FeedbackPostCard";

const CATEGORY_COLORS = {
  'App': 'bg-[#4169E1]/20 text-[#B0C4DE]',
  'Matcher': 'bg-[#2BA84A]/20 text-[#CFE8D6]',
  'Karta': 'bg-[#9370DB]/20 text-[#DDD6FE]',
  'Lag': 'bg-[#F4743B]/20 text-[#FDE3D2]',
  'Profil': 'bg-[#14B8A6]/20 text-[#99F6E4]',
  'Annat': 'bg-[#7B8A83]/20 text-[#B6C2BC]'
};

const STATUS_COLORS = {
  'Öppen': 'bg-[#7B8A83]/20 text-[#B6C2BC]',
  'Undersöks': 'bg-[#4169E1]/20 text-[#B0C4DE]',
  'Planerad': 'bg-[#9370DB]/20 text-[#DDD6FE]',
  'Under utveckling': 'bg-[#F4743B]/20 text-[#FDE3D2]',
  'Lanserad': 'bg-[#2BA84A]/20 text-[#CFE8D6]',
  'Ej planerad': 'bg-[#DC2626]/20 text-[#FCA5A5]'
};

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('top');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const { confirm, alert, DialogContainer } = useCustomDialog();
  const queryClient = useQueryClient();

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['feedbackPosts', activeTab, selectedCategory, selectedStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('feedback/getPosts', {
        sort: activeTab,
        category: selectedCategory,
        status: selectedStatus
      });
      return response.data.posts || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (postId) => {
      const response = await base44.functions.invoke('feedback/votePost', {
        postId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackPosts'] });
    }
  });

  const handleVote = async (postId) => {
    try {
      await voteMutation.mutateAsync(postId);
    } catch (error) {
      console.error('Error voting:', error);
      await alert('Fel', 'Kunde inte rösta. Försök igen.', { type: 'alert' });
    }
  };

  const handleCreatePost = () => {
    setShowCreateForm(true);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageLoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1513] pb-24 lg:pb-8">
      <DialogContainer />

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#121715] rounded-t-[20px] lg:rounded-[20px] w-full lg:max-w-2xl border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] h-[85vh] lg:h-auto lg:max-h-[85vh] mb-16 lg:mb-0 lg:my-8 overflow-hidden"
            >
              <CreateFeedbackPost
                user={user}
                onCancel={() => setShowCreateForm(false)}
                onSuccess={() => {
                  setShowCreateForm(false);
                  queryClient.invalidateQueries({ queryKey: ['feedbackPosts'] });
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-[#4169E1] to-[#3457D5] rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F4F7F5]">Feedback</h1>
              <p className="text-sm text-[#B6C2BC]">Dela dina idéer och rösta på förslag</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-[#121715] border border-[#223029] rounded-[16px] p-3">
            <TabsList className="bg-transparent w-full grid grid-cols-4 gap-2">
              <TabsTrigger
                value="top"
                className="data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] rounded-[14px]"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Toppen</span>
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] rounded-[14px]"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nyligen</span>
              </TabsTrigger>
              <TabsTrigger
                value="myVotes"
                className="data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] rounded-[14px]"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Mina röster</span>
              </TabsTrigger>
              <TabsTrigger
                value="myPosts"
                className="data-[state=active]:bg-[#2BA84A]/16 data-[state=active]:text-[#EAF6EE] data-[state=active]:ring-1 data-[state=active]:ring-[#2BA84A]/30 text-[#B6C2BC] rounded-[14px]"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Mina inlägg</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Posts List */}
          <AnimatePresence mode="wait">
            <TabsContent value={activeTab} key={activeTab}>
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <Card className="bg-[#121715] border border-[#223029] rounded-[16px]">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-[#4169E1]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#4169E1]/30">
                        <MessageSquare className="w-8 h-8 text-[#4169E1]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#F4F7F5] mb-2">
                        {activeTab === 'myPosts' ? 'Inga inlägg än' : 'Inga förslag här'}
                      </h3>
                      <p className="text-sm text-[#B6C2BC] mb-6">
                        {activeTab === 'myPosts' 
                          ? 'Skapa ditt första förbättringsförslag!'
                          : 'Bli den första att dela ett förslag!'}
                      </p>
                      <button
                        onClick={handleCreatePost}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#4169E1] text-white px-6 font-semibold hover:bg-[#3457D5] transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        Skapa inlägg
                      </button>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post, index) => (
                    <FeedbackPostCard
                      key={post.id}
                      post={post}
                      user={user}
                      onVote={handleVote}
                      index={index}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Floating Create Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCreatePost}
        className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#4169E1] to-[#3457D5] hover:from-[#5179F1] hover:to-[#4567E5] text-white rounded-full shadow-[0_8px_24px_rgba(65,105,225,0.4)] flex items-center justify-center z-[60] transition-all"
      >
        <Plus className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}